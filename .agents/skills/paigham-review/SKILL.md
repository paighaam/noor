---
name: paigham-review
description: Independently review a Paigham implementation, correction or stacked PR against agreed acceptance, actual entry points and the applicable repository contracts. Review does not authorize fixes, merges or deployment.
---

# Paigham independent review

Read `../../rules/delivery.md`, the relevant `../../rules/delivery-profiles.md` section, the
repository rule index and the task record. Treat handoffs and graphs as leads, not proof.

1. Resolve exact base/head/merge-base, clean review source and cumulative scope. Start from
   acceptance and current callers rather than the implementer's desired verdict.
2. Verify agreed behavior through actual entry points. UI: page/screen plus layout/state,
   then effects, interaction and device/browser evidence where required. Backend: actual
   route, guard, service, datasource and serializer. Infrastructure: declared environment
   and safe validation boundaries, without implicitly applying anything.
3. Inspect applicable identity/owner, authorization, privacy, versioning, retry and concurrency
   invariants in proportion to the risk. Check producer/consumer contract compatibility.
4. Look for vacuous tests, bypassed callers, stale reports, skipped execution and weakened
   assertions. Reproduce relevant regressions in disposable copies with isolated fixtures.
5. Use the task's evidence commands and inspect reports. Read `tools/delivery/README.md`.
   Tool self-tests, compile, render, runtime and release evidence remain separate.
6. Consolidate findings by family with criterion, severity, evidence, source and owner.
   Distinguish unmet acceptance from new scope; a repeated family warrants a bounded audit.
7. Report correction, lane/integration and release verdicts separately at exact revisions.
   Do not edit the reviewed implementation or publish comments unless authorized.

When delegated, receive the task, raw source and necessary fixtures rather than a prescribed
answer. Independent review is not an implementer's self-certification or a local JSON field.
