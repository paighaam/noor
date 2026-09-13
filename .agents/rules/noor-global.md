---
activation: always
description: Current Noor structure, layer rules, design-system contract, and product-flow authority
---

# Noor architecture

## Run Commands

Static source pages can be served directly for authoring. Publishing requires the clean-URL
build in `dist/`:

```bash
# Dev server with caching disabled (preferred — stock http.server serves stale files)
python3 src/_theme/devserver.py 8474

# Plain static server (ports 8471–8473 configured in .claude/launch.json)
python3 -m http.server 8471

# Build and preview the published routes
npm run build
python3 tools/serve-dist.py 8475

# Deploy only the Noor Hosting site configured in firebase.json
npm run deploy
```

Entry point: `src/Index.dc.html` (Figma-style cover linking every page).

## Project Structure

Interactive design POC for the Paigham "Noor" app. Every screen is a self-contained `*.dc.html`
page under `src/` (screens at the `src/` root, plus flow boards in `onboarding/` and `home/`),
rendered by a custom runtime. The design system itself is segregated into an atomic-design tree:
`src/foundation/` (Primitives, Tokens, Theme) and `src/components/{atoms,molecules,organisms}/`.

- `support.js` — the "dc" framework: `<x-dc>` root, `<helmet>` for page styles, `{{ }}` bindings,
  `<sc-if>` / `<sc-for list as>` (single root child per iteration), and one
  `<script type="text/x-dc" data-dc-script>` holding `class Component extends DCLogic` with
  `state`, handlers, and `renderVals()` (every binding used in markup must be returned from it).
- `_ds/noor-design-system-*/` — runtime copy of the design system: `colors_and_type.css`
  (semantic light+dark tokens, mirrors the Kotlin tokens in paigham-app) and `_ds_bundle.js`
  (React components; its `NOOR` object resolves to CSS vars so embeds are theme-aware).
- `_theme/` — shared canvas layer: `chrome.js` (light/dark/system switcher persisted in
  localStorage, sets `data-theme` on `<html>`, injects the Index link + theme chrome on every
  page), `poc.css` (canvas tokens), `components.css` (the DS component CSS kit — see below).
- `ios-frame.jsx` — the iOS device frame; follows the global theme automatically.
- `foundation/Tokens.dc.html` + `components/{atoms,molecules,organisms}/*.dc.html` — living
  previews of the token set and the component kit, organised by atomic-design tier.

## Layer Architecture — HARD RULES (do not violate)

Composition is strictly **one-directional**: each layer may only reach *down* to the layer below
it; nothing ever depends upward. This was audited clean on 2026-07-08 — keep it that way. Before
adding UI, identify which layer you are in and only pull from the layers beneath it.

```
FOUNDATION      Primitives ──▶ Tokens ──▶ Theme
                (--noor-*)     (--color-* --font-* --size-* --radius-* --shadow-*)
COMPONENTS      Atoms ──▶ Molecules ──▶ Organisms      (consume Tokens/Theme; NEVER Primitives)
SCREENS/BOARDS  consume Components; only rarely Foundation tokens directly
```

1. **Primitives are foundation-only.** Raw `--noor-*` variables may appear ONLY in
   `_ds/…/colors_and_type.css` (where tokens are defined) and the `foundation/*.dc.html` preview
   pages. They must NEVER appear in `components.css`, any `components/**`, screens, or boards. Style
   everything else with semantic `--color-*` / `--font-*` / `--size-*` / `--radius-*` / `--shadow-*`.
2. **Components compose downward only.** Molecules are built from Atom classes; Organisms from
   Molecule/Atom classes. A lower tier never references a higher one, and no page redefines a
   component class it didn't originate.
3. **Screens/boards consume the Components layer.** Use the `components.css` classes (`.btn`,
   `.chip`, `.input`, `.otp`, `.app-bar`, `.nb-bar`, …). Do not rebuild a component inline and do not
   define a page-local fork of one (e.g. an `.atom-chip` shadowing `.chip`).
4. **Missing component → add it to the kit, don't inline-fork.** If a screen needs a component that
   isn't in `components.css`, add the class there PLUS a variant on its Atoms/Molecules/Organisms
   reference page, then use it. Never leave a reusable construct inline on tokens.
5. **No hardcoded hex** except the whitelist: data/chart colors, badge accent hues, and on-color
   text/icons composited over a solid fill, photo, or gradient (e.g. `#fff` on an accent button).
   Inverse surfaces (snackbars, tooltips) use `--color-info-primary` + `--color-info-primary-inverse`,
   never a literal dark.

Self-check before finishing any DS/screen change — the first two greps must be empty (the
second may only return whitelisted hits), and the class audit must pass:

```bash
grep -rnE '\-\-noor-' src/components src/_theme/components.css src/*.dc.html src/home src/onboarding
grep -rnE '#[0-9a-fA-F]{3,8}' src/components src/_theme/components.css
python3 tools/check_classes.py
```

`tools/check_classes.py` fails when a page uses a class nothing defines — the silent failure
mode of this repo, where a screen borrows a construction that only another page's helmet
styles and renders unstyled with no error. For every `*.dc.html` it resolves the classes used
by the page **and by every `.jsx` module it x-imports**, against the kit, the page's own
`<style>`/stylesheet, and the utilities `support.js` injects. If it reports a class, either
promote the construction to `components.css` (plus its Atoms/Molecules/Organisms reference
entry) or define it in that page's helmet — never leave it owned by a different page.

## Design System Rules

- **Source of truth:** this repo *is* the design system of record. `_theme/components.css` plus the
  Atoms / Molecules / Organisms pages define component construction, and `_ds/…/colors_and_type.css`
  defines the tokens. There is no external DS to sync from; when you add or change a component, update
  `components.css` and its reference page together.
- **Tokens only:** style with `var(--color-*)` semantic tokens. No hardcoded palette hex except
  data colors (chart accents, badge accent hues) and text composited over photos/gradients.
- **Reference, don't rebuild:** shared component constructions live in `_theme/components.css`
  (`.btn`, `.ib`, `.badge`, `.input`/`.phone`/`.otp`, `.sw`, `.cb`, `.tbar`, `.dd-menu`, `.surf`,
  `.nb-bar`, …). Screens and DS pages must use these classes instead of re-implementing components
  inline — `components.css` is the sole home for component styling; pages keep only page-chrome
  (layout) styles inline. The Atoms / Molecules / Organisms pages are the visual reference.
- **Theme-aware always:** every page loads `chrome.js` in `<head>` (after `support.js`) and
  `poc.css` + `components.css` in the helmet; body background is `var(--canvas-bg)`. Never set a
  hardcoded `data-theme` or a `dark` prop on the device frame.
- **Icons — local kit only.** Use `<span class="mi" data-i="home"></span>` (add class `fill` for the
  filled variant). Icons are self-hosted SVGs in `src/_ds/icons/` (app VectorDrawables converted +
  Material Symbols Rounded from Google for gaps), rendered via CSS `mask` in `_theme/icons.css` so
  `font-size` (→ size) and `color` (→ tint) work like the old font. Dynamic names bind through the
  attribute: `data-i="{{ icon }}"` (dc) or `data-i={icon}` (jsx). To add an icon: drop
  `NAME.svg` in `src/_ds/icons/` and add a `[data-i="NAME"]` rule to `icons.css`. Do NOT add new
  `material-symbols-rounded` ligatures — that font is retained only for the vendored `_ds_bundle.js`.

## Commit Messages

Never include `Co-Authored-By: Claude` or any Anthropic/Claude trailer. Omit it entirely.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## Canonical Product Flows — Read Before Journey Design

The shared Paigham product-flow, design-system, accessibility, motion, and certification rules live
in `../paigham-app/.agents/rules/ui-ux-product.md`. Read that rule before changing Noor journeys for
authentication, onboarding, Home, Profile, Masjid discovery, Salaah, or Compose parity. Noor may
improve how a flow is explained, but it must not silently change product logic; approved changes
must update the shared rule in the same change.
