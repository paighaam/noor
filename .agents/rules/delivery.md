---
activation: always
description: Evidence-led delivery and independent review across Paigham repositories
---

# Paigham delivery contract — protocol 1

Applies to implementation, correction, integration and review across Paigham, including the
coordinator. Read the repository rule index and the relevant section of `delivery-profiles.md`.
Use this workflow proportionally: a narrow fix needs clear acceptance and appropriate evidence,
not a fabricated project, elaborate task graph or every technology's test suite.
This contract never grants permission to publish, rebase, merge, change infrastructure or deploy.

## Ready before dispatch
- Record the objective, non-goals, owner, exact source/base revisions, allowed paths, dependencies,
  observable acceptance criteria and evidence layer. Use one durable issue for multi-agent work.
- Verify premises in current source before writing a prompt or starting implementation. A planned
  API, missing tool, unavailable read/version, or similarly named artifact is not a dependency.
- Give missing prerequisites and reproducible baseline failures an owner and unblock condition.
  Do not demand a green check while forbidding its necessary fix, or silently exempt a blocker.
- Distinguish a ready correction from a blocked whole feature. Do not redefine acceptance afterward.
- Verify worktree/ref state before edits and publication. Preserve unrelated staged, unstaged and
  untracked work. Drift blocks the affected operation, not safe independent investigation.

## Implementation and evidence
- Reproduce corrections at the real caller when safe: exported UI/page and layout, HTTP handler,
  service or datasource. Helpers and copied conditionals cannot prove their actual callers.
- Test observable behavior and relevant denial, failure, retry, stale-result and concurrency cases.
  Use meaningful regression/mutation probes for high-risk invariants, not a test-count quota.
- Required behavioral suites need actual nonempty reports. Missing, stale, failed or skipped
  required evidence is incomplete. Record approved exclusions separately, with owner and impact.
- Separate static compilation, unit/handler tests, render, interaction/hydration, browser/device,
  isolated database, hosted CI, staging and production. Never substitute one for another.
- Never invent missing identity, authorization, version, validator, storage address or fallback.
  Preserve authoritative contracts and privacy boundaries; follow the owning repository's rules.
- Do not weaken tests or guards to turn a gate green. Retain failure artifacts and investigate.
- Honor explicit user/runtime budgets. Do not invent default token caps that terminate required
  verification. Checkpoint honestly when context or an actual resource limit requires it.

## Independent review and correction
- Read agreed acceptance and source before the implementer's explanation. Verify real entry
  points, immediate callers and cumulative scope, then the task's applicable trust boundaries.
- Classify each finding: regression, unmet agreed criterion, missing prerequisite, baseline debt
  or new requirement. Record evidence, reviewed revision, criterion and owner. New scope needs
  a decision; do not present a newly introduced requirement as a pre-existing implementation bug.
- Consolidate a defect family and immediate callers into one correction batch where possible.
  A second recurrence triggers a bounded family audit and acceptance/tooling diagnosis.
- The implementer cannot certify independent review. Bind review/evidence to exact revisions;
  rebase or changed inputs require reassessment. No inherited green badge proves a rewritten head.

## Completion and coordination
- Use NOT_READY, READY, IMPLEMENTING, AWAITING_REVIEW, REVIEWED, INTEGRATED and RELEASED.
  BLOCKED names an owner and exact unblock evidence. No state grants merge/deploy authority.
- Acceptance is a conjunction, not an average. Report correction, feature and release status
  separately. A green protocol self-test is not a green feature or a release authorization.
- Parallelize ready tasks with compatible ownership and verified dependencies. Keep shared
  package, contract, migration and integration ownership explicit.
- Rebase only when authorized: snapshot recovery refs and dirty work, map declared parents,
  process parents before children, preserve local changes, and stop on substantive conflicts.
  Do not rebase detached review snapshots or already-landed branches as active dependents.
  Never force-push shared branches without explicit force-push authorization.
- Preserve applied migration history and owner-managed graph artifacts. No broad cleanup.
- Track repeated finding families, blocked dispatches and escaped defects, not raw test volume.
  Keep human architecture/security/merge/release gates. Disclose missing hosting enforcement.
