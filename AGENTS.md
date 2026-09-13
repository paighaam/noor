# noor agent guidance

Before changing this repository, read `.agents/rules/noor.md` and every rule its index marks as
always-on. `.agents/rules/` is the canonical rule body for Codex, Claude, Antigravity, Cursor, and
other agents.

When `graphify-out/graph.json` exists, use the graph as the first index for codebase-wide questions,
then verify findings in the current boards, `components.css`, and the token set.

General execution contract:

- Read the board, its CSS, and the shared product rule before editing a journey.
- Make surgical changes and preserve unrelated user work.
- Report exactly what was validated, and what was not.

## Paigham-wide delivery

Read `.agents/rules/delivery.md` and the relevant `delivery-profiles.md` section for implementation,
correction, integration and review. Use the `paigham-delivery` and `paigham-review` skills in
`.agents/skills/` when applicable. These are versioned copies of the shared Paigham workspace pack;
repository-specific product, architecture and safety rules still apply.
The protocol CI job tests the delivery tool, not the feature. A feature task needs its own reviewed
manifest, explicit CI binding, and the correct isolated test environment. Never infer merge,
rebase, publication, infrastructure or deployment authority from the presence of this guidance.
