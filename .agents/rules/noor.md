---
activation: always
description: Canonical index for Noor rules
---

# Noor rule index

`.agents/rules/` is the canonical rule set. Claude, Codex, Antigravity, and Cursor files are
adapters only and must not duplicate these rules.

Always read:

- `agent-behavior.md`
- `delivery.md` (select the matching verification profile)
- `ai-communication.md`
- `no-auto-md-files.md`
- `self-improve.md`
- `graphify.md`
- `noor-global.md`

Noor is the visual and component source of truth for Paigham. The shared product-flow, design-system,
accessibility, motion, and certification rules live in `../paigham-app/.agents/rules/ui-ux-product.md`;
read that rule before changing any Noor journey, and update it in the same change when an approved
decision alters a durable contract.

Screen and workspace skills live in `.agents/skills/`.

Rules describe current contracts, not aspirational architecture. When source and a rule disagree,
inspect the current board and its CSS, identify the current contract, then update the rule with the
same approved change. Do not silently preserve known-stale guidance.
