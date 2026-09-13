#!/usr/bin/env python3
"""Behavioral self-tests for the evidence gate; never use a developer repository."""
import copy
import importlib.util
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location("gate", Path(__file__).with_name("gate.py"))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

XML = '<testsuite tests="1" failures="0" errors="0" skipped="0"><testcase classname="Journey" name="ready renders"/></testsuite>'

class GateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="paigham-gate-test-")
        self.root = Path(self.tmp.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        self.git("init", "-q")
        self.git("config", "user.email", "gate@example.invalid")
        self.git("config", "user.name", "Delivery gate test")
        (self.repo / "source.txt").write_text("baseline")
        self.git("add", "source.txt")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "test baseline")
        self.head = self.git("rev-parse", "HEAD")
        self.task = {"protocol": 1, "id": "pilot", "objective": "Ready journey renders",
            "owner": "test", "issue": "https://example.invalid/tasks/pilot",
            "non_goals": ["release"], "source_revision": self.head, "scope_base": self.head,
            "allowed_paths": ["source.txt"], "blockers": [], "dependencies": [],
            "checks": [{"id": "render", "layer": "render", "cwd": ".",
                "argv": [sys.executable, "-c",
                         "from pathlib import Path; import sys; Path(sys.argv[1]).write_text(" + repr(XML) + ")",
                         "{report}"],
                "timeout_seconds": 5, "report": "junit"}],
            "acceptance": [{"id": "ready", "behavior": "Ready seller sees journey",
                "check": "render", "test_pattern": "Journey::ready renders"}]}
        self.task_path = self.root / "task.json"
        self.out = self.root / "evidence"

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.repo), *args], text=True).strip()

    def save(self):
        self.task_path.write_text(json.dumps(self.task))
        return self.task_path

    def run_gate(self):
        return gate.run_task(self.save(), self.repo, self.out, self.head)

    def xml(self, text):
        path = self.root / "result.xml"
        path.write_text(text)
        return [path]

    def test_real_command_report_and_reassessment(self):
        self.assertEqual(self.run_gate()["status"], "LOCAL_CHECKS_PASSED")
        self.assertEqual(gate.assess(self.task_path, self.repo, self.out)["head"], self.head)

    def test_missing_criterion_check_rejected(self):
        self.task["acceptance"][0]["check"] = "missing"
        with self.assertRaises(gate.GateError): gate.validate(self.task)

    def test_unbound_check_rejected(self):
        extra = copy.deepcopy(self.task["checks"][0])
        extra["id"] = "extra"
        self.task["checks"].append(extra)
        with self.assertRaises(gate.GateError): gate.validate(self.task)

    def test_exit_zero_is_not_render_evidence(self):
        self.task["checks"][0]["report"] = "exit"
        with self.assertRaises(gate.GateError): gate.validate(self.task)

    def test_blocker_is_not_ready(self):
        self.task["blockers"] = [{"owner": "server", "reason": "missing read", "unblock": "reviewed API"}]
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo)

    def test_wrong_expected_head_rejected(self):
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo, "0" * 40)

    def test_dirty_target_rejected(self):
        (self.repo / "source.txt").write_text("dirty")
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo)

    def test_git_configuration_cannot_hide_untracked_source(self):
        self.git("config", "status.showUntrackedFiles", "no")
        (self.repo / "unreviewed.py").write_text("pass")
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo)

    def test_utf16_entities_and_failed_test_status_are_rejected(self):
        path = self.root / "utf16.xml"
        path.write_bytes(('<?xml version="1.0" encoding="UTF-16"?>'
                          '<!DOCTYPE testsuite [<!ENTITY x "secret">]>' + XML).encode("utf-16"))
        with self.assertRaises(gate.GateError): gate.parse_junit([path])
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml(XML.replace('name="ready renders"', 'status="failed" name="ready renders"')))

    def test_out_of_scope_commit_rejected(self):
        (self.repo / "other.txt").write_text("other")
        self.git("add", "other.txt")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "outside task")
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo)

    def test_dependency_digest_rejected(self):
        self.task["dependencies"] = [{"owner": "server", "artifact": "source.txt",
            "revision": self.head, "sha256": "0" * 64}]
        with self.assertRaises(gate.GateError): gate.preflight(self.task, self.repo)

    def test_path_escape_rejected(self):
        with self.assertRaises(gate.GateError): gate.child(self.repo, "../outside")

    def test_empty_report_rejected(self):
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml('<testsuite tests="0"/>'))

    def test_skip_failure_error_and_disabled_rejected(self):
        for tag in ("skipped", "failure", "error"):
            with self.subTest(tag=tag), self.assertRaises(gate.GateError):
                gate.parse_junit(self.xml(XML.replace('/></testsuite>', f'><{tag}/></testcase></testsuite>')))
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml(XML.replace('name="ready renders"', 'status="notrun" name="ready renders"')))

    def test_forged_aggregate_count_rejected(self):
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml(XML.replace('tests="1"', 'tests="999"')))

    def test_duplicate_report_not_double_counted(self):
        paths = self.xml(XML)
        with self.assertRaises(gate.GateError): gate.parse_junit(paths + paths)

    def test_xml_entities_rejected(self):
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml('<!DOCTYPE testsuite [<!ENTITY x "secret">]>' + XML))

    def test_missing_report_even_with_exit_zero_rejected(self):
        self.task["checks"][0]["argv"] = [sys.executable, "-c", "pass", "{report}"]
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_failed_process_rejected(self):
        self.task["checks"][0]["argv"] = [sys.executable, "-c", "raise SystemExit(7)", "{report}"]
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_failed_process_preserves_failing_junit(self):
        failed = XML.replace('failures="0"', 'failures="1"').replace(
            '/></testsuite>', '><failure message="synthetic regression"/></testcase></testsuite>')
        self.task["checks"][0]["argv"][2] = (
            "from pathlib import Path; import sys; Path(sys.argv[1]).write_text("
            + repr(failed) + "); raise SystemExit(7)")
        with self.assertRaises(gate.GateError): self.run_gate()
        data = gate.read_json(self.out / "evidence.json")
        check = data["checks"][0]
        self.assertEqual(check["exit_code"], 7)
        self.assertEqual(check["status"], "failed")
        self.assertEqual(data["status"], "INCOMPLETE")
        self.assertFalse(data["acceptance"][0]["passed"])
        self.assertEqual(len(check["reports"]), 1)
        artifact = self.out / check["reports"][0]["path"]
        self.assertEqual(artifact.read_text(), failed)
        self.assertEqual(gate.digest(artifact), check["reports"][0]["sha256"])
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_failed_glob_command_preserves_fresh_reports(self):
        (self.repo / ".gitignore").write_text("results/\n")
        self.git("add", ".gitignore")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "ignore reports")
        self.head = self.git("rev-parse", "HEAD")
        self.task["scope_base"] = self.head
        self.task["checks"][0]["report_glob"] = "results/*.xml"
        failed = XML.replace('failures="0"', 'failures="1"').replace(
            '/></testsuite>', '><failure message="synthetic regression"/></testcase></testsuite>')
        self.task["checks"][0]["argv"] = [sys.executable, "-c",
            "from pathlib import Path; p=Path('results'); p.mkdir(); "
            + "(p/'failed.xml').write_text(" + repr(failed) + "); "
            + "(p/'passed.xml').write_text(" + repr(XML) + "); raise SystemExit(1)"]
        with self.assertRaises(gate.GateError): self.run_gate()
        data = gate.read_json(self.out / "evidence.json")
        check = data["checks"][0]
        self.assertEqual(check["exit_code"], 1)
        self.assertEqual(check["status"], "failed")
        self.assertEqual(len(check["reports"]), 2)
        self.assertCountEqual(
            [(self.out / r["path"]).read_text() for r in check["reports"]], [failed, XML])
        self.assertFalse(data["acceptance"][0]["passed"])
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_passing_xml_cannot_override_failed_process(self):
        self.task["checks"][0]["argv"][2] += "; raise SystemExit(7)"
        with self.assertRaises(gate.GateError): self.run_gate()
        data = gate.read_json(self.out / "evidence.json")
        self.assertEqual(data["checks"][0]["cases"], ["Journey::ready renders"])
        self.assertEqual(data["checks"][0]["exit_code"], 7)
        self.assertEqual(data["checks"][0]["status"], "failed")
        self.assertEqual(len(data["checks"][0]["reports"]), 1)
        self.assertFalse(data["acceptance"][0]["passed"])
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_stale_glob_report_cannot_hide_fresh_failure_or_allow_success(self):
        (self.repo / ".gitignore").write_text("results/\n")
        self.git("add", ".gitignore")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "ignore reports")
        self.head = self.git("rev-parse", "HEAD")
        self.task["scope_base"] = self.head
        self.task["checks"][0]["report_glob"] = "results/*.xml"
        directory = self.repo / "results"
        directory.mkdir()
        stale = directory / "a-stale.xml"
        stale.write_text(XML)
        os.utime(stale, (time.time() - 100, time.time() - 100))
        failed = XML.replace('failures="0"', 'failures="1"').replace(
            '/></testsuite>', '><failure message="synthetic regression"/></testcase></testsuite>')
        for code, xml in ((7, failed), (0, XML)):
            with self.subTest(exit_code=code):
                self.out = self.root / f"evidence-{code}"
                self.task["checks"][0]["argv"] = [sys.executable, "-c",
                    "from pathlib import Path; Path('results/b-fresh.xml').write_text("
                    + repr(xml) + f"); raise SystemExit({code})"]
                with self.assertRaises(gate.GateError): self.run_gate()
                data = gate.read_json(self.out / "evidence.json")
                check = data["checks"][0]
                self.assertEqual(check["exit_code"], code)
                self.assertEqual(check["status"], "failed")
                self.assertEqual(len(check["reports"]), 1)
                self.assertEqual((self.out / check["reports"][0]["path"]).read_text(), xml)
                self.assertIn("stale", check["error"].lower())
                self.assertFalse(data["acceptance"][0]["passed"])
                with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_wrong_executed_test_cannot_satisfy_acceptance(self):
        self.task["acceptance"][0]["test_pattern"] = "missing journey"
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_stale_output_directory_rejected(self):
        self.out.mkdir()
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_report_tampering_rejected(self):
        self.run_gate()
        (self.out / "render-0.xml").write_text(XML.replace("ready", "different"))
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_task_drift_rejected(self):
        self.run_gate()
        self.task["objective"] = "changed"
        self.save()
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_missing_check_cannot_be_claimed_passed(self):
        self.run_gate()
        path = self.out / "evidence.json"
        data = json.loads(path.read_text())
        data["checks"] = []
        path.write_text(json.dumps(data))
        with self.assertRaises(gate.GateError): gate.assess(self.task_path, self.repo, self.out)

    def test_no_signed_or_release_claim(self):
        data = self.run_gate()
        self.assertEqual(data["independent_review"], "NOT_ATTESTED")
        self.assertEqual(data["production"], "NOT_VERIFIED")

    def test_complete_evidence_can_be_relocated(self):
        self.run_gate()
        moved = self.root / "downloaded"
        shutil.copytree(self.out, moved)
        self.assertEqual(gate.assess(self.task_path, self.repo, moved)["status"], "LOCAL_CHECKS_PASSED")

    def test_incomplete_bundle_and_wrong_identity_are_rejected(self):
        self.run_gate()
        path = self.out / "evidence.json"
        original = json.loads(path.read_text())
        for key, value in (("task_id", "different-task"), ("protocol", 999)):
            data = copy.deepcopy(original)
            data[key] = value
            path.write_text(json.dumps(data))
            with self.subTest(key=key), self.assertRaises(gate.GateError):
                gate.assess(self.task_path, self.repo, self.out)
        path.write_text(json.dumps(original))
        (self.out / "render.log").unlink()
        with self.assertRaises(OSError):
            gate.assess(self.task_path, self.repo, self.out)

    def test_root_aggregate_failures_and_counts_rejected(self):
        for field in ("failures", "errors", "skipped", "disabled"):
            with self.subTest(field=field), self.assertRaises(gate.GateError):
                gate.parse_junit(self.xml(f'<testsuites {field}="1">{XML}</testsuites>'))
        with self.assertRaises(gate.GateError):
            gate.parse_junit(self.xml(f'<testsuites tests="99">{XML}</testsuites>'))

    def test_future_dated_existing_report_cannot_prove_execution(self):
        (self.repo / ".gitignore").write_text("results/\n")
        self.git("add", ".gitignore")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "ignore reports")
        self.head = self.git("rev-parse", "HEAD")
        self.task["scope_base"] = self.head
        directory = self.repo / "results"
        directory.mkdir()
        old = directory / "old.xml"
        old.write_text(XML)
        future = time.time() + 3600
        os.utime(old, (future, future))
        self.task["checks"][0]["report_glob"] = "results/*.xml"
        self.task["checks"][0]["argv"] = [sys.executable, "-c", "pass"]
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_task_modified_during_execution_invalidates_evidence(self):
        original = self.task["checks"][0]["argv"][2]
        self.task["checks"][0]["argv"][2] = original + (
            "; import json; p=Path(" + repr(str(self.task_path)) +
            "); d=json.loads(p.read_text()); d['objective']='changed'; p.write_text(json.dumps(d))")
        with self.assertRaises(gate.GateError): self.run_gate()

    def test_claimed_acceptance_or_release_cannot_override_reports(self):
        self.run_gate()
        path = self.out / "evidence.json"
        original = json.loads(path.read_text())
        for key, value in (("acceptance", []), ("independent_review", "REVIEWED"),
                           ("production", "VERIFIED"), ("staging", "VERIFIED")):
            data = copy.deepcopy(original)
            data[key] = value
            path.write_text(json.dumps(data))
            with self.subTest(key=key), self.assertRaises(gate.GateError):
                gate.assess(self.task_path, self.repo, self.out)

class XmlResult(unittest.TextTestResult):
    def startTest(self, test):
        super().startTest(test)
        self.current = ET.SubElement(self.xml, "testcase", classname=test.__class__.__name__,
                                     name=test._testMethodName)
    def addFailure(self, test, err):
        super().addFailure(test, err)
        ET.SubElement(self.current, "failure")
    def addError(self, test, err):
        super().addError(test, err)
        ET.SubElement(self.current, "error")
    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        ET.SubElement(self.current, "skipped", message=reason)

if __name__ == "__main__":
    output = None
    if len(sys.argv) == 3 and sys.argv[1] == "--junit":
        output = Path(sys.argv[2])
    elif len(sys.argv) != 1:
        raise SystemExit("usage: test_gate.py [--junit FILE]")
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(GateTests)
    XmlResult.xml = ET.Element("testsuite", name="DeliveryGate")
    result = unittest.TextTestRunner(verbosity=2, resultclass=XmlResult).run(suite)
    if output:
        XmlResult.xml.set("tests", str(result.testsRun))
        XmlResult.xml.set("failures", str(len(result.failures)))
        XmlResult.xml.set("errors", str(len(result.errors)))
        XmlResult.xml.set("skipped", str(len(result.skipped)))
        ET.ElementTree(XmlResult.xml).write(output, encoding="utf-8", xml_declaration=True)
    raise SystemExit(0 if result.wasSuccessful() and not result.skipped else 1)
