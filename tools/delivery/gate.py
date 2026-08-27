#!/usr/bin/env python3
"""Protocol-1 evidence gate. Standard library only; no network, git writes or deployment."""
import argparse
import fnmatch
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

LAYERS = {"static", "unit", "handler", "render", "interaction", "postgres", "browser"}
SHA = re.compile(r"[0-9a-f]{40}")
ID = re.compile(r"[a-z][a-z0-9-]{1,79}")

class GateError(Exception):
    pass

def require(condition, message):
    if not condition:
        raise GateError(message)

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def read_json(path):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError) as exc:
        raise GateError(f"Invalid JSON file {path}: {exc}") from exc

def child(root, relative):
    require(isinstance(relative, str) and relative and not Path(relative).is_absolute(),
            "Expected repository-relative path")
    result = (root / relative).resolve()
    require(result.is_relative_to(root.resolve()), f"Path escapes repository: {relative}")
    return result

def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    require(result.returncode == 0, f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()

def validate(task):
    require(isinstance(task, dict) and task.get("protocol") == 1, "Expected protocol 1 task")
    for field in ("id", "objective", "owner", "issue", "non_goals"):
        require(bool(task.get(field)), f"Missing task {field}")
    for field in ("source_revision", "scope_base"):
        require(isinstance(task.get(field), str) and SHA.fullmatch(task[field]), f"Invalid {field}")
    require(task.get("allowed_paths") and all(isinstance(p, str) and p and
            not p.startswith("/") and ".." not in p.split("/") for p in task["allowed_paths"]),
            "Missing/invalid allowed paths")
    require(isinstance(task.get("blockers"), list), "Explicit blockers list required")
    for blocker in task["blockers"]:
        require(all(blocker.get(k) for k in ("owner", "reason", "unblock")), "Unowned blocker")
    require(isinstance(task.get("dependencies"), list), "Explicit dependency list required")
    for dep in task["dependencies"]:
        require(all(dep.get(k) for k in ("owner", "artifact", "revision", "sha256")),
                "Dependency needs owner, artifact, revision and digest")
        require(SHA.fullmatch(dep["revision"]), "Invalid dependency revision")
        require(re.fullmatch(r"[0-9a-f]{64}", dep["sha256"]), "Invalid dependency digest")
    checks = task.get("checks")
    require(isinstance(checks, list) and checks, "No checks")
    ids = []
    for check in checks:
        cid = check.get("id", "")
        require(ID.fullmatch(cid) and cid not in ids, "Invalid/duplicate check ID")
        ids.append(cid)
        require(check.get("layer") in LAYERS, f"{cid}: invalid evidence layer")
        require(isinstance(check.get("argv"), list) and check["argv"] and
                all(isinstance(a, str) and a for a in check["argv"]), f"{cid}: command argv required")
        require(isinstance(check.get("timeout_seconds"), int) and
                0 < check["timeout_seconds"] <= 3600, f"{cid}: bounded timeout required")
        require(check.get("cwd") is not None, f"{cid}: cwd required")
        require(check.get("report") in ("exit", "junit"), f"{cid}: invalid report type")
        if check["report"] == "junit":
            require("{report}" in " ".join(check["argv"]) or check.get("report_glob"),
                    f"{cid}: JUnit output location required")
        elif check["layer"] != "static":
            raise GateError(f"{cid}: behavioral evidence requires test reports, not just exit 0")
    acceptance = task.get("acceptance")
    require(isinstance(acceptance, list) and acceptance, "No acceptance criteria")
    aids = set()
    bound = set()
    for criterion in acceptance:
        aid = criterion.get("id", "")
        require(ID.fullmatch(aid) and aid not in aids, "Invalid/duplicate acceptance ID")
        aids.add(aid)
        require(criterion.get("behavior"), f"{aid}: observable behavior required")
        require(criterion.get("check") in ids, f"{aid}: missing check binding")
        bound.add(criterion["check"])
        check = next(c for c in checks if c["id"] == criterion["check"])
        if check["report"] == "junit":
            require(criterion.get("test_pattern"), f"{aid}: named test binding required")
            try:
                re.compile(criterion["test_pattern"])
            except re.error as exc:
                raise GateError(f"{aid}: invalid test pattern") from exc
    require(bound == set(ids), "Every required check needs an acceptance binding")
    return task

def preflight(task, repo, expected_head=None):
    require(not task["blockers"], "Task is BLOCKED; route prerequisites before execution")
    head = git(repo, "rev-parse", "HEAD")
    if expected_head:
        require(head == expected_head, "HEAD drift from expected revision")
    require(not git(repo, "status", "--porcelain", "--untracked-files=all"),
            "Dirty target; use a clean review/worktree")
    require(git(repo, "merge-base", task["source_revision"], head) == task["source_revision"],
            "Pinned source revision is not an ancestor")
    require(git(repo, "merge-base", task["scope_base"], head) == task["scope_base"],
            "Scope base is not an ancestor")
    paths = git(repo, "diff", "--name-only", task["scope_base"], head).splitlines()
    bad = [p for p in paths if not any(fnmatch.fnmatchcase(p, g) for g in task["allowed_paths"])]
    require(not bad, f"Changes outside assigned scope: {bad}")
    git(repo, "diff", "--check", task["scope_base"], head)
    for dep in task["dependencies"]:
        artifact = child(repo, dep["artifact"])
        require(artifact.is_file() and digest(artifact) == dep["sha256"],
                f"Dependency artifact mismatch: {dep['artifact']} (owner: {dep['owner']})")
    for check in task["checks"]:
        child(repo, check["cwd"])
    return head

def parse_junit(paths):
    """Count leaf testcases, not aggregate suites; refuse skips, empty or ambiguous results."""
    cases = []
    seen = set()
    for path in paths:
        raw = Path(path).read_bytes()
        try:
            xml_text = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise GateError("JUnit reports must be UTF-8") from exc
        require("\x00" not in xml_text, "NUL/alternate XML encoding is not allowed")
        require("<!DOCTYPE" not in xml_text.upper() and "<!ENTITY" not in xml_text.upper(),
                "DTD/entity declarations are not allowed")
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as exc:
            raise GateError(f"Malformed JUnit: {path}") from exc
        require(root.tag in ("testsuite", "testsuites"), "Not a JUnit document")
        nodes = list(root.iter("testcase"))
        require(nodes, f"Empty report: {path}")
        for suite in (element for element in root.iter()
                      if element.tag in ("testsuite", "testsuites")):
            for field in ("failures", "errors", "skipped", "disabled"):
                require(int(suite.get(field, "0")) == 0, f"{path}: suite {field} is nonzero")
            if "tests" in suite.attrib:
                require(int(suite.attrib["tests"]) == len(list(suite.iter("testcase"))),
                        f"{path}: declared test count does not match executed cases")
        for case in nodes:
            require(not any(case.find(tag) is not None for tag in ("failure", "error", "skipped")),
                    f"Unsuccessful testcase: {case.get('name')}")
            require(case.get("status", "").lower() in ("", "run", "passed", "success", "completed"),
                    "Nonexecuted testcase")
            key = f"{case.get('classname', '')}::{case.get('name', '')}"
            require(case.get("name") and key not in seen, f"Duplicate/unnamed testcase: {key}")
            seen.add(key)
            cases.append(key)
    require(cases, "No test reports found")
    return cases

def acceptance_results(task, results):
    by_id = {r["id"]: r for r in results}
    output = []
    for criterion in task["acceptance"]:
        result = by_id.get(criterion["check"])
        matched = []
        ok = bool(result and result["status"] == "passed")
        if criterion.get("test_pattern"):
            matched = [c for c in (result or {}).get("cases", [])
                       if re.search(criterion["test_pattern"], c)]
            ok = ok and bool(matched)
        output.append({"id": criterion["id"], "passed": ok, "matched_tests": matched})
    return output

def run_task(task_path, repo, output, expected_head=None):
    task_digest = digest(task_path)
    task = validate(read_json(task_path))
    head = preflight(task, repo, expected_head)
    require(not output.exists(), "Evidence directory must be new; never reuse old reports")
    output.mkdir(parents=True)
    results = []
    for check in task["checks"]:
        report = output / f"{check['id']}.xml"
        log = output / f"{check['id']}.log"
        argv = [a.replace("{report}", str(report)) for a in check["argv"]]
        existing = {}
        if check.get("report_glob"):
            pattern = check["report_glob"]
            require(not Path(pattern).is_absolute() and ".." not in Path(pattern).parts,
                    "Invalid report glob")
            existing = {str(p): (p.stat().st_mtime_ns, p.stat().st_ctime_ns)
                        for p in repo.glob(pattern) if p.is_file()}
        started = time.time()
        entry = {"id": check["id"], "layer": check["layer"], "argv": argv,
                 "status": "failed", "cases": [], "reports": []}
        try:
            with log.open("w") as stream:
                completed = subprocess.run(argv, cwd=child(repo, check["cwd"]),
                    stdout=stream, stderr=subprocess.STDOUT, timeout=check["timeout_seconds"])
            entry["exit_code"] = completed.returncode
            if check["report"] == "junit":
                paths = [report]
                if check.get("report_glob"):
                    pattern = check["report_glob"]
                    require(not Path(pattern).is_absolute() and ".." not in Path(pattern).parts,
                            "Invalid report glob")
                    paths = sorted(repo.glob(pattern))
                require(paths, "No JUnit reports generated")
                report_errors = []
                for index, path in enumerate(paths):
                    try:
                        require(path.is_file() and started <= path.stat().st_mtime <= time.time(),
                                f"Missing/stale JUnit report: {path}")
                        require(existing.get(str(path)) !=
                                (path.stat().st_mtime_ns, path.stat().st_ctime_ns),
                                f"JUnit report was not produced by this command: {path}")
                        require(path.resolve().is_relative_to(repo.resolve()) or
                                path.resolve().is_relative_to(output.resolve()), "Report escapes roots")
                        saved = output / f"{check['id']}-{index}.xml"
                        # Evidence artifact copy, not source editing.
                        saved.write_bytes(path.read_bytes())
                        entry["reports"].append({"path": saved.name, "sha256": digest(saved)})
                    except (GateError, OSError) as exc:
                        report_errors.append(str(exc))
                require(not report_errors, "; ".join(report_errors))
                entry["cases"] = parse_junit([output / p["path"] for p in entry["reports"]])
            # Retain fresh failure XML for diagnosis; neither XML nor exit status can
            # authorize success alone. Failed/partial reports still fail parsing.
            require(completed.returncode == 0, f"Command exited {completed.returncode}")
            entry["status"] = "passed"
        except (GateError, OSError, ValueError, subprocess.TimeoutExpired) as exc:
            entry["error"] = str(exc)
        entry["duration_seconds"] = round(time.time() - started, 3)
        entry["log"] = {"path": log.name, "sha256": digest(log)}
        results.append(entry)
        print(f"{check['id']}: {entry['status']} ({len(entry['cases'])} tests)", flush=True)
    criteria = acceptance_results(task, results)
    # Builds may write ignored artifacts, but tracked source/lockfile drift invalidates all evidence.
    unchanged = (git(repo, "rev-parse", "HEAD") == head
                 and not git(repo, "status", "--porcelain", "--untracked-files=all")
                 and digest(task_path) == task_digest)
    evidence = {"protocol": 1, "task_id": task["id"], "head": head,
                "execution_output": str(output),
                "tree": git(repo, "rev-parse", "HEAD^{tree}"),
                "task_sha256": task_digest, "generated_at": time.time(),
                "source_unchanged": unchanged, "checks": results, "acceptance": criteria,
                "status": "LOCAL_CHECKS_PASSED" if unchanged and all(c["passed"] for c in criteria)
                          else "INCOMPLETE",
                "independent_review": "NOT_ATTESTED",
                "hosted_ci": os.getenv("GITHUB_RUN_ID"),
                "staging": "NOT_VERIFIED", "production": "NOT_VERIFIED"}
    (output / "evidence.json").write_text(json.dumps(evidence, indent=2) + "\n")
    require(evidence["status"] == "LOCAL_CHECKS_PASSED",
            f"Required acceptance incomplete; inspect {output / 'evidence.json'}")
    return evidence

def assess(task_path, repo, output):
    task = validate(read_json(task_path))
    data = read_json(output / "evidence.json")
    require(data.get("protocol") == 1 and data.get("task_id") == task["id"],
            "Evidence protocol/task identity mismatch")
    require(isinstance(data.get("execution_output"), str) and
            Path(data["execution_output"]).is_absolute(), "Missing execution output identity")
    require(data.get("task_sha256") == digest(task_path), "Task changed since execution")
    require(data.get("head") == git(repo, "rev-parse", "HEAD"), "Stale tested revision")
    require(data.get("tree") == git(repo, "rev-parse", "HEAD^{tree}"), "Stale tested tree")
    require(not git(repo, "status", "--porcelain", "--untracked-files=all"), "Current worktree is dirty")
    require(data.get("source_unchanged") is True, "Source changed during execution")
    require([c["id"] for c in data["checks"]] == [c["id"] for c in task["checks"]],
            "Required checks missing or substituted")
    for check, result in zip(task["checks"], data["checks"]):
        require(result.get("status") == "passed" and result.get("exit_code") == 0,
                f"Required check unsuccessful: {check['id']}")
        expected = [a.replace("{report}", str(Path(data["execution_output"]) / f"{check['id']}.xml"))
                    for a in check["argv"]]
        require(result.get("argv") == expected and result.get("layer") == check["layer"],
                "Executed command/layer mismatch")
        for artifact in [result["log"], *result["reports"]]:
            path = child(output, artifact["path"])
            require(digest(path) == artifact["sha256"], "Evidence artifact modified")
        if check["report"] == "junit":
            result["cases"] = parse_junit([child(output, r["path"]) for r in result["reports"]])
    canonical_acceptance = acceptance_results(task, data["checks"])
    require(data.get("acceptance") == canonical_acceptance,
            "Acceptance summary modified")
    require(data.get("independent_review") == "NOT_ATTESTED"
            and data.get("staging") == "NOT_VERIFIED"
            and data.get("production") == "NOT_VERIFIED", "Unsupported review/release claim")
    require(all(c["passed"] for c in canonical_acceptance),
            "Acceptance binding not satisfied")
    require(data["status"] == "LOCAL_CHECKS_PASSED", "Evidence is incomplete")
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("validate", "preflight", "run", "assess"))
    parser.add_argument("task", type=Path)
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--output", type=Path)
    parser.add_argument("--expected-head")
    args = parser.parse_args()
    try:
        task_path, repo = args.task.resolve(), args.repo.resolve()
        task = validate(read_json(task_path))
        if args.mode == "validate":
            print(f"VALID_TASK: {task['id']} (not a readiness or completion verdict)")
        elif args.mode == "preflight":
            print("PREFLIGHT_PASSED:", preflight(task, repo, args.expected_head))
        else:
            require(args.output is not None, "--output is required")
            result = (run_task(task_path, repo, args.output.resolve(), args.expected_head)
                      if args.mode == "run" else assess(task_path, repo, args.output.resolve()))
            print(result["status"], result["head"])
    except (GateError, OSError, ValueError, KeyError, TypeError) as exc:
        print(f"DELIVERY_GATE_FAILED: {exc}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
