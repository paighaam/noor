# Paigham delivery evidence — protocol 1

Read `.agents/rules/delivery.md`, the relevant profile and the assignment before execution.
The tool verifies execution/evidence integrity, not business correctness or independent review.
Task commands are executable code; review them. It never fetches, changes Git, approves or deploys.

## Run a bounded assignment

```sh
python3 tools/delivery/test_gate.py
python3 tools/delivery/gate.py validate .delivery/tasks/TASK.json
python3 tools/delivery/gate.py preflight .delivery/tasks/TASK.json --expected-head FULL_SHA
python3 tools/delivery/gate.py run .delivery/tasks/TASK.json --output /tmp/new-evidence --expected-head FULL_SHA
python3 tools/delivery/gate.py assess .delivery/tasks/TASK.json --output /tmp/new-evidence
```

Copy and complete `.delivery/task-template.json`; it is deliberately blocked until scope,
dependencies, commands and criteria are verified. Use `--repo /absolute/target` when invoking
the shared workspace runner against a repository. Select its real toolchain and isolated fixtures.
Never run a dirty user checkout through a gate merely by concealing its untracked files.

Checks use argv arrays, bounded timeouts and explicit evidence layers. Behavioral checks require
fresh nonempty JUnit and named acceptance bindings. Gradle globs require forced test execution;
stale, failed, skipped, malformed or modified evidence is rejected. Both process exit and reports
must succeed. Safe fresh reports remain available after a failure, even if another report is stale.
A check's reported case count means validated successful cases, not a count of all attempted tests.
Use retained raw failure reports to diagnose unsuccessful runs.

Evidence records exact head/tree/task digest, argv, logs, report digests and acceptance results.
Keep the complete JSON/XML/log bundle. Reassessment supports relocated CI artifacts but rejects
missing/changed files and stale revisions. Separate checks can rerun the same test; do not add
those executions into a unique-test total. A test-name match proves execution, not assertion quality.

## CI and task binding

The generic `delivery-protocol.yml` workflow runs this tool's self-tests only. It does NOT run
or certify application acceptance. For each feature assignment the integration owner must review
its manifest, provision the required toolchain/isolated services, and explicitly bind BOTH CI
`run` and `assess` to it. A file or registry entry does not select itself. Never broaden another
task's scope or replace failing application checks with tool self-tests.

Existing Store pilot workflows remain pilot-specific until their assignment is rebound.
Required CI jobs must actually succeed; skipped, absent, cancelled or neutral results are not
success. A committed workflow is not enforced branch protection. Keep owner-approved protection
and human merge/release gates; report hosting-plan/admin limitations.

## Canonical distribution and safety

Workspace source: `Paigham/.agents/rules/delivery*.md`, the two Paigham skills and
`Paigham/tools/delivery/`. Primary repositories carry versioned identical copies for standalone
checkouts and CI. `.delivery/pack.json` records the distributed file hashes; these detect drift,
not malicious edits or independent approval. Update the shared source and affected mirrors only
with authorization; do not create divergent assistant-specific rule copies.
Repo-specific product/architecture rules remain authoritative for their domain.

The signature scanner was reused from Store W0b revision
`1c1928bfe10506e3876851c01dde36bb05d0ca50`; it is heuristic, not a complete security/PII audit.
Never supply production credentials to untrusted PR code. CI artifacts are private, synthetic
evidence with bounded retention; inspect logs before sharing. Local JSON/hashes are not signed
attestations. Rewriting a branch invalidates old exact-SHA acceptance until reassessed.
