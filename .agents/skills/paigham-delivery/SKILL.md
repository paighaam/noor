---
name: paigham-delivery
description: Prepare or execute a bounded implementation, correction or integration task across Paigham repositories with verified prerequisites and behavior-linked evidence. Does not authorize publication or deployment.
---

# Paigham delivery

Read `../../rules/delivery.md`, the relevant `../../rules/delivery-profiles.md` section, the
repository rule index and the assignment completely. Keep rules canonical; prompts link to them.

1. Verify the real objective, scope, refs, worktree, permissions, dependency artifacts and baseline.
   Give each criterion a stable ID, observable behavior, evidence layer and check/test binding.
   Resolve missing prerequisites and contradictory requirements before dispatch.
2. Reproduce the actual caller's regression when safe; implement and inspect its immediate
   caller family. Preserve unrelated work and accepted product decisions.
3. For executable acceptance, adapt `.delivery/task-template.json`; placeholders remain blocked.
   Inspect commands, select the real toolchain/profile and use `tools/delivery/gate.py`.
   Read `tools/delivery/README.md` before running; use `--repo` for an explicit target.
4. Inspect raw evidence and failures, not just exit codes. Handoff criterion results, exact tested
   revisions, blockers/owners and evidence links in the existing durable issue when the assignment
   uses one, otherwise in the task handoff. Do not create tracker records without authority.
   Request independent review when required by the assignment or its risk.

A task file or registry entry does not select itself in CI. The integration owner must review and
bind both CI `run` and `assess` to that assignment and provision its required isolated environment.
The generic protocol workflow tests the delivery tool only; it never certifies application work.
Existing Store pilot workflows explicitly bind a pilot task and must not be widened to bypass
another assignment's prerequisites. Do not mutate CI, publish, rebase or deploy without authority.
