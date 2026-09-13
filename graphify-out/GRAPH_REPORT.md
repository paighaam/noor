# Graph Report - noor  (2026-09-12)

## Corpus Check
- 139 files · ~3,253,072 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1588 nodes · 2209 edges · 147 communities (85 shown, 62 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 203 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e6be2ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tokenKinds
- support.js
- react
- Visual foundations
- _ds_manifest.json
- x-omelette
- chrome.js
- useNoorDark
- dependencies
- intro-row.jsx
- start.sh
- NoCacheHandler
- launch.json
- otp-row.jsx
- phone-row.jsx
- Agent Behavior
- toolbar.tsx
- Section board — annotated skeletons
- main
- .claude/skills/add-screen/evals/evals.json
- types.ts
- onboarding/storyboards/screens.jsx
- Agent Behavior
- Add a section board to the Noor POC
- Add a section board to the Noor POC
- Section board — annotated skeletons
- slide-canvas.tsx
- eval-0-dua-dikhr-section/eval_metadata.json
- eval-1-zakaat-section/eval_metadata.json
- .agents/skills/add-screen/evals/evals.json
- main
- compilerOptions
- screenshot-editor.tsx
- home/storyboards/screens.jsx
- tabs-row.jsx
- nav-bar.jsx
- components.jsx
- hijri/storyboards/screens.jsx
- calendar-row.jsx
- dua-dikhr/storyboards/screens.jsx
- asma-ul-husna/storyboards/screens.jsx
- dua-row.jsx
- names-row.jsx
- masjid-explore/storyboards/screens.jsx
- sehri/storyboards/screens.jsx
- zakaat/storyboards/screens.jsx
- states-row.jsx
- quran-reader.jsx
- zakaat-row.jsx
- list-row.jsx
- map-row.jsx
- pincode-row.jsx
- qr-row.jsx
- sehri-row.jsx
- personal-details/storyboards/screens.jsx
- details-row.jsx
- masjid-register/storyboards/screens.jsx
- qibla/storyboards/screens.jsx
- sheet-row.jsx
- SalaahTab
- wizard-row.jsx
- outcome-row.jsx
- ar-row.jsx
- setup-row.jsx
- build.mjs
- package.json
- hosting
- Handler
- zakaat/storyboards/screens.jsx
- masjid-operations/storyboards/screens.jsx
- Noor UI/UX Upgrade Decisions
- devDependencies
- @dnd-kit/core
- describeConfig
- defaults.ts
- board-rows.jsx
- describeConfig
- inspector.tsx
- components.json
- storage.ts
- App Store Screenshots — Editor Template
- salaah-rules-screens.jsx
- upload/route.ts
- project/route.ts
- layout.tsx
- next.config.mjs
- tailwind.config.ts
- ScanBoardStage
- compose-post.jsx
- check_classes.py
- @dnd-kit/core
- countLabel
- salaah-scroll-timeline.jsx
- @dnd-kit/core
- Salaah timing rules — final product and interaction specification
- SalaahConfigBody
- 8. Screen: Prayer timing rule
- @dnd-kit/utilities
- 13. Draft and publish lifecycle
- 17. Required tests
- 2. Product decisions
- 4. Data contract
- 9. Rule-aware timeline dragging
- 11. Validation and clamping
- 7. Screen: How timings update
- 14. Complete UI state matrix
- 18. Implementation impact
- 5. Resolution rules
- canonicalCommitteePhone
- 6. Navigation and information architecture
- salaah-rules-board.jsx
- jszip
- next
- @radix-ui/react-dialog
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-select
- @radix-ui/react-slot
- @radix-ui/react-tabs
- @radix-ui/react-tooltip
- tailwind-merge
- canonicalCommitteePhone
- Agent behavior
- Noor architecture
- AGENTS.md
- ai-communication.md
- graphify.md
- no-auto-md-files.md
- noor.md
- self-improve.md
- .claude/CLAUDE.md
- GateTests
- task-template.json
- scan-secrets-and-pii.mjs
- Paigham delivery contract — protocol 1
- Paigham delivery evidence — protocol 1
- delivery-profiles.md
- paigham-delivery/SKILL.md
- paigham-review/SKILL.md
- screenshot-editor.tsx

## God Nodes (most connected - your core abstractions)
1. `tokenKinds` - 187 edges
2. `react` - 69 edges
3. `GateTests` - 42 edges
4. `Salaah timing rules — final product and interaction specification` - 22 edges
5. `Noor UI/UX Upgrade Decisions` - 17 edges
6. `compilerOptions` - 16 edges
7. `ScreenshotEditor()` - 15 edges
8. `cn()` - 14 edges
9. `HomeScreen()` - 13 edges
10. `Agent behavior` - 13 edges

## Surprising Connections (you probably didn't know these)
- `QaumScreen()` --references--> `react`  [EXTRACTED]
  src/home/storyboards/screens.jsx → app-store-screenshots/package.json
- `SalaahScreen()` --references--> `react`  [EXTRACTED]
  src/home/storyboards/screens.jsx → app-store-screenshots/package.json
- `SrlSelect()` --references--> `react`  [EXTRACTED]
  src/masjid-operations/storyboards/salaah-rules-screens.jsx → app-store-screenshots/package.json
- `OptionSheet()` --references--> `react`  [EXTRACTED]
  src/_theme/components.jsx → app-store-screenshots/package.json
- `ZakaatStepScreen()` --references--> `react`  [EXTRACTED]
  src/zakaat/storyboards/screens.jsx → app-store-screenshots/package.json

## Import Cycles
- None detected.

## Communities (147 total, 62 thin omitted)

### Community 0 - "tokenKinds"
Cohesion: 0.01
Nodes (187): --body-h1-lh, --body-h1-size, --body-h1-tracking, --body-h2-lh, --body-h2-size, --body-h2-tracking, --body-h3-lh, --body-h3-size (+179 more)

### Community 1 - "support.js"
Cohesion: 0.08
Nodes (42): boot(), collectProps(), compileAttr(), compileTemplate(), createComponentFactory(), createExternalModules(), createHelmetManager(), createPseudoSheet() (+34 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (48): react, react, Badge(), BodyM(), BodyS(), BodyXS(), Checkbox(), ExploreScreen() (+40 more)

### Community 3 - "Visual foundations"
Cohesion: 0.09
Nodes (22): Animation, Backgrounds, Blur / transparency, Cards, Content fundamentals, Corner radii, Don't, Iconography (+14 more)

### Community 4 - "_ds_manifest.json"
Cohesion: 0.15
Nodes (12): brandFonts, cards, components, fonts, globalCssPaths, hasThumbnailHtml, namespace, source (+4 more)

### Community 5 - "x-omelette"
Cohesion: 0.18
Nodes (10): overrides, plugins, rules, no-restricted-imports, no-restricted-syntax, react/forbid-elements, x-omelette, components (+2 more)

### Community 6 - "chrome.js"
Cohesion: 0.14
Nodes (22): ENTRY_FRAMES, EntryRow(), frame(), NAV, apply(), buildChrome(), buildDrawer(), closeDrawer() (+14 more)

### Community 7 - "useNoorDark"
Cohesion: 0.42
Nodes (8): IOSDevice(), IOSGlassPill(), IOSKeyboard(), IOSList(), IOSListRow(), IOSNavBar(), IOSStatusBar(), useNoorDark()

### Community 8 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, html-to-image, lucide-react, @radix-ui/react-dropdown-menu, react-rnd, sonner (+9 more)

### Community 15 - "Agent Behavior"
Cohesion: 0.11
Nodes (19): Agent Behavior, Commit Messages, Design System Rules, graphify, Layer Architecture — HARD RULES (do not violate), Project Structure, Rule 10 — Checkpoint after every significant step, Rule 11 — Match the codebase's conventions, even if you disagree (+11 more)

### Community 16 - "toolbar.tsx"
Cohesion: 0.08
Nodes (29): Props, SaveStatus(), Card, CardContent, CardHeader, CardTitle, DialogContent, DialogDescription (+21 more)

### Community 17 - "Section board — annotated skeletons"
Cohesion: 0.29
Nodes (6): 1. The board page — `<section>/<Section>.dc.html`, 2. A storyboard row — `<section>/storyboards/<flow>-row.jsx`, 3. Shared screen components — `<section>/storyboards/screens.jsx`, Index registration, Pre-loading cross-section components, Section board — annotated skeletons

### Community 20 - "types.ts"
Cohesion: 0.18
Nodes (19): PreviewStage(), Props, Props, DeckCanvas(), getCanvas(), SlideCanvas(), Props, SlideThumb() (+11 more)

### Community 22 - "Agent Behavior"
Cohesion: 0.10
Nodes (20): Agent Behavior, Canonical Product Flows — Read Before Journey Design, Commit Messages, Design System Rules, graphify, Layer Architecture — HARD RULES (do not violate), Project Structure, Rule 10 — Checkpoint after every significant step (+12 more)

### Community 23 - "Add a section board to the Noor POC"
Cohesion: 0.15
Nodes (12): Add a section board to the Noor POC, Anatomy, App bar — use the DS `.app-bar` (progressive blur), like Home, Audio player — use the DS `.aplayer` molecule, don't build a container, Pre-loading cross-section components (React Error #130 prevention), Step 1 — Inventory the source screens, Step 2 — Scaffold the board page, Step 3 — Storyboard rows (+4 more)

### Community 24 - "Add a section board to the Noor POC"
Cohesion: 0.15
Nodes (12): Add a section board to the Noor POC, Anatomy, App bar — use the DS `.app-bar` (progressive blur), like Home, Audio player — use the DS `.aplayer` molecule, don't build a container, Pre-loading cross-section components (React Error #130 prevention), Step 1 — Inventory the source screens, Step 2 — Scaffold the board page, Step 3 — Storyboard rows (+4 more)

### Community 25 - "Section board — annotated skeletons"
Cohesion: 0.29
Nodes (6): 1. The board page — `<section>/<Section>.dc.html`, 2. A storyboard row — `<section>/storyboards/<flow>-row.jsx`, 3. Shared screen components — `<section>/storyboards/screens.jsx`, Index registration, Pre-loading cross-section components, Section board — annotated skeletons

### Community 26 - "slide-canvas.tsx"
Cohesion: 0.09
Nodes (27): Inspector(), TextElementPanel(), backgroundFor(), Caption(), clampRect(), DeckCanvasProps, DeckEditHandlers, defaultElementZ() (+19 more)

### Community 27 - "eval-0-dua-dikhr-section/eval_metadata.json"
Cohesion: 0.40
Nodes (4): assertions, eval_id, eval_name, prompt

### Community 28 - "eval-1-zakaat-section/eval_metadata.json"
Cohesion: 0.40
Nodes (4): assertions, eval_id, eval_name, prompt

### Community 31 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 32 - "screenshot-editor.tsx"
Cohesion: 0.05
Nodes (13): CONSOLE_DESTINATIONS, INVITE_SAVE_STEPS, OPS_CAPABILITIES, OPS_FOLLOWERS, OPS_INVITATIONS, OPS_MANAGED, OPS_MASJID, OPS_MEMBERS (+5 more)

### Community 33 - "home/storyboards/screens.jsx"
Cohesion: 0.12
Nodes (6): QAUM_AMP, QaumAudioPlayer(), qaumBars(), QaumScreen(), qaumTime(), SalaahScreen()

### Community 39 - "dua-dikhr/storyboards/screens.jsx"
Cohesion: 0.15
Nodes (8): AUDIO_AMP, audioBars(), DUA_CATEGORIES, DUA_DETAIL, DUA_LIST, DuaDetailScreen(), FAVOURITE_ITEMS, fmtTime()

### Community 40 - "asma-ul-husna/storyboards/screens.jsx"
Cohesion: 0.24
Nodes (6): DetailOverlay(), GridScreen(), NAMES, SCHEMES, schemeStyle(), screenStyle

### Community 43 - "masjid-explore/storyboards/screens.jsx"
Cohesion: 0.15
Nodes (6): ExploreListScreen(), ExploreMapScreen(), masjidCardTransitionName(), MASJIDS, pagerIndicatorWindow(), PIN_KEYS

### Community 45 - "zakaat/storyboards/screens.jsx"
Cohesion: 0.33
Nodes (8): baseData(), claimResults(), journeyGroups(), JourneyRows(), MASLAKS, noop(), options(), ROLES

### Community 46 - "states-row.jsx"
Cohesion: 0.20
Nodes (10): GUEST_STATES, GuestRow, makeRow(), NO_MASJID_STATES, NO_TRACK, NoMasjidRow, NOTIF_STATES, NotifRow (+2 more)

### Community 56 - "masjid-register/storyboards/screens.jsx"
Cohesion: 0.08
Nodes (9): CLAIM_DATA, FOLLOW_DATA, MANAGE_DATA, MASLAK_LIST, REGISTRATION_DATA, ROLE_LIST, STATE_LIST, WIZARD_SUB (+1 more)

### Community 57 - "qibla/storyboards/screens.jsx"
Cohesion: 0.25
Nodes (3): bpt(), CompassDial(), QIBLA_AR_METRICS

### Community 58 - "sheet-row.jsx"
Cohesion: 0.52
Nodes (6): buildFollowRows(), buildManageTiles(), frame(), noop(), sheetFrames(), SheetRow()

### Community 59 - "SalaahTab"
Cohesion: 0.11
Nodes (9): CMP_AUDIENCE, CMP_LIBRARY, CMP_STEPS, CMP_WAVE, cmpMessageState(), CmpMessageStep(), CmpPostPreview(), CmpReviewStep() (+1 more)

### Community 60 - "wizard-row.jsx"
Cohesion: 0.70
Nodes (4): buildClaimResults(), frame(), wizardFrames(), WizardRow()

### Community 61 - "outcome-row.jsx"
Cohesion: 0.67
Nodes (3): frame(), OUTCOME_FRAMES, OutcomeRow()

### Community 64 - "build.mjs"
Cohesion: 0.12
Nodes (12): dirCount, DIST, fixedRoutes, IMAGES, pages, patchChrome(), resolveWeb(), rewrite() (+4 more)

### Community 65 - "package.json"
Cohesion: 0.18
Nodes (10): description, name, private, scripts, build, deploy, preview, serve (+2 more)

### Community 66 - "hosting"
Cohesion: 0.29
Nodes (6): hosting, headers, ignore, public, site, trailingSlash

### Community 69 - "masjid-operations/storyboards/screens.jsx"
Cohesion: 0.12
Nodes (21): COLD_START_FRAMES, HOME_DATA_FRAMES, HomeColdStartRow(), HomePrayerRow(), HomeRow(), INVITED_FRAMES, MANAGED_ENTRY_FRAMES, PRAYER_FRAMES (+13 more)

### Community 70 - "Noor UI/UX Upgrade Decisions"
Cohesion: 0.09
Nodes (39): Approval status, Asma ul Husna design read and state specification — 2026-07-21, Before | After | Why, Before / After / Why, Certification notes, Design read, Design read and dials, Design-system and UX checklist (+31 more)

### Community 71 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+7 more)

### Community 72 - "@dnd-kit/core"
Cohesion: 0.21
Nodes (9): ACCEPTED, Props, ScreenshotPicker(), cache, didFail(), failed, fetchAsDataUrl(), preloadImages() (+1 more)

### Community 73 - "describeConfig"
Cohesion: 0.17
Nodes (12): clamp01(), EASE, GLOW_FLOOD_FAMILY, glowFlood(), lerp(), phase(), SPLASH_FONTS, SPLASH_VARIANTS (+4 more)

### Community 74 - "defaults.ts"
Cohesion: 0.42
Nodes (9): DEFAULT_PROJECT, en(), fgStarter(), ipadStarter(), makeStarterSlides(), newSlide(), nid(), tabletStarter() (+1 more)

### Community 75 - "board-rows.jsx"
Cohesion: 0.25
Nodes (8): ConsoleHome(), ConsoleScreen(), destTransitionName(), fmt12(), nextPrayer(), prayerMinutes(), salaahTile(), salaahToMinutes()

### Community 76 - "describeConfig"
Cohesion: 0.27
Nodes (10): availableCommitteeRoles(), BroadcastStudioHeader(), CommitteeBody(), DetailsBody(), InvitationCard(), isRepeatableCommitteeRole(), MemberBody(), MemberRow() (+2 more)

### Community 77 - "inspector.tsx"
Cohesion: 0.14
Nodes (20): ActiveElementPanel(), defaultZ(), ELEMENT_LABEL, elementLabel(), ElementTransformControls(), Props, ScreenshotEditor(), Sidebar() (+12 more)

### Community 78 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 79 - "storage.ts"
Cohesion: 0.24
Nodes (14): coerceLocalized(), applyUpdater(), cleanTextElement(), cleanTransform(), loadFromFile(), loadFromLocalStorage(), mergeWithDefaults(), migrateSlide() (+6 more)

### Community 80 - "App Store Screenshots — Editor Template"
Cohesion: 0.25
Nodes (7): Adding screenshots, App Store Screenshots — Editor Template, Customizing, Exporting, Notes, Quick start, What's inside

### Community 81 - "salaah-rules-screens.jsx"
Cohesion: 0.07
Nodes (15): srFmt(), srFmtShort(), SRL_INTERVALS, srlDelayOptions(), SrlDetailBody(), SrlDriftOffer(), SrlPrayerAxis(), srlRowSubtitle() (+7 more)

### Community 82 - "upload/route.ts"
Cohesion: 0.50
Nodes (4): MIME_EXT, parseDataUrl(), POST(), UPLOAD_DIR_REL

### Community 83 - "project/route.ts"
Cohesion: 0.83
Nodes (3): filePath(), GET(), POST()

### Community 84 - "layout.tsx"
Cohesion: 0.40
Nodes (3): bodyFont, displayFont, metadata

### Community 91 - "check_classes.py"
Cohesion: 0.57
Nodes (6): classes_used(), globals_defined(), main(), modules_for(), The .jsx modules a page pulls in, one hop deep., read()

### Community 92 - "@dnd-kit/core"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, dev, start, version

### Community 93 - "countLabel"
Cohesion: 0.50
Nodes (4): BroadcastComposer(), BroadcastFeedState(), countLabel(), MasjidSwitcherSheet()

### Community 95 - "salaah-scroll-timeline.jsx"
Cohesion: 0.16
Nodes (16): SST_ALL, SST_BREAKS, SST_JUMAH, SST_NOW, SST_PRAYERS, SST_SPAN_FROM, SST_SPAN_TO, sstAxis() (+8 more)

### Community 97 - "Salaah timing rules — final product and interaction specification"
Cohesion: 0.17
Nodes (11): 10.1 Iqama-chip drag, 10.2 Azaan-body drag, 10. Iqama behaviour, 15. Accessibility and interaction requirements, 16. Analytics needed for product validation, 19. Behaviour changes from the current app, 1. Outcome, 20. Acceptance criteria (+3 more)

### Community 99 - "8. Screen: Prayer timing rule"
Cohesion: 0.29
Nodes (7): 8.1 App bar, 8.2 Rule choices, 8.3 At prayer start controls, 8.4 Round-up controls, 8.5 Fixed controls, 8.6 Restore action, 8. Screen: Prayer timing rule

### Community 101 - "13. Draft and publish lifecycle"
Cohesion: 0.33
Nodes (6): 13.1 Store model, 13.2 Changed count, 13.3 Publish request, 13.4 Publish success, 13.5 Revision conflict, 13. Draft and publish lifecycle

### Community 102 - "17. Required tests"
Cohesion: 0.33
Nodes (6): 17.1 Pure rule-resolution tests, 17.2 Server-first hydration tests, 17.3 Rule-aware editing tests, 17.4 UI state tests, 17.5 Device verification, 17. Required tests

### Community 103 - "2. Product decisions"
Cohesion: 0.33
Nodes (6): 2.1 Use the real-world prayer pattern as the recommended model, 2.2 The server rule is the first-load source of truth, 2.3 Rule changes are explicit; rule execution is silent, 2.4 Keep the info icon as the entry point, 2.5 One draft and one publish, 2. Product decisions

### Community 104 - "4. Data contract"
Cohesion: 0.33
Nodes (6): 4.1 Stored rule shapes, 4.2 Config response metadata required by the app, 4.3 First-load cases, 4.4 No client-created fallback config, 4.5 Canonicalization, 4. Data contract

### Community 105 - "9. Rule-aware timeline dragging"
Cohesion: 0.33
Nodes (6): 9.1 Common drag behaviour, 9.2 Fixed rule, 9.3 Round-up rule, 9.4 At-prayer-start rule, 9.5 Why the rule must not be inferred after every drag, 9. Rule-aware timeline dragging

### Community 106 - "11. Validation and clamping"
Cohesion: 0.40
Nodes (5): 11.1 During a timeline drag, 11.2 On the rule detail page, 11.3 On publish, 11.4 A fixed rule that drifts later, 11. Validation and clamping

### Community 107 - "7. Screen: How timings update"
Cohesion: 0.40
Nodes (5): 7.1 Purpose, 7.2 Layout, 7.3 Prayer row contents, 7.4 Page state, 7. Screen: How timings update

### Community 108 - "14. Complete UI state matrix"
Cohesion: 0.50
Nodes (4): 14.1 Salaah timings and rule summary, 14.2 Prayer rule detail, 14.3 Existing unusual server configs, 14. Complete UI state matrix

### Community 109 - "18. Implementation impact"
Cohesion: 0.50
Nodes (4): 18.1 Noor, 18.2 Compose app, 18.3 Backend, 18. Implementation impact

### Community 110 - "5. Resolution rules"
Cohesion: 0.50
Nodes (4): 5.1 At prayer start, 5.2 Same time every day or Friday, 5.3 Round up after prayer begins, 5. Resolution rules

### Community 111 - "canonicalCommitteePhone"
Cohesion: 0.67
Nodes (3): 12.1 What scan may change, 12.2 Applying an azaan reading by rule, 12. Board scan

### Community 112 - "6. Navigation and information architecture"
Cohesion: 0.67
Nodes (3): 6.1 Salaah timings app bar, 6.2 Back behaviour, 6. Navigation and information architecture

### Community 127 - "Agent behavior"
Cohesion: 0.14
Nodes (13): Agent behavior, Rule 10 — Checkpoint after every significant step, Rule 11 — Match the codebase's conventions, even if you disagree, Rule 12 — Fail loud, Rule 1 — Think Before Coding, Rule 2 — Simplicity First, Rule 3 — Surgical Changes, Rule 4 — Goal-Driven Execution (+5 more)

### Community 128 - "Noor architecture"
Cohesion: 0.22
Nodes (8): Canonical Product Flows — Read Before Journey Design, Commit Messages, Design System Rules, Layer Architecture — HARD RULES (do not violate), Noor architecture, Project Structure, Run Commands, Skill routing

### Community 138 - "task-template.json"
Cohesion: 0.12
Nodes (32): acceptance, allowed_paths, blockers, checks, dependencies, id, issue, non_goals (+24 more)

### Community 139 - "scan-secrets-and-pii.mjs"
Cohesion: 0.16
Nodes (12): RFC-2606, RFC-6761, argv, EXCLUDED_PATHS, isReserved(), MUST_FLAG, MUST_NOT_FLAG, redact() (+4 more)

### Community 140 - "Paigham delivery contract — protocol 1"
Cohesion: 0.33
Nodes (5): Completion and coordination, Implementation and evidence, Independent review and correction, Paigham delivery contract — protocol 1, Ready before dispatch

### Community 141 - "Paigham delivery evidence — protocol 1"
Cohesion: 0.40
Nodes (4): Canonical distribution and safety, CI and task binding, Paigham delivery evidence — protocol 1, Run a bounded assignment

### Community 145 - "screenshot-editor.tsx"
Cohesion: 0.11
Nodes (25): AndroidPhone(), AndroidTabletL(), AndroidTabletP(), FrameProps, IPad(), Phone(), getFrameForDevice(), CANVAS (+17 more)

## Knowledge Gaps
- **683 isolated node(s):** `protocol`, `objective`, `owner`, `issue`, `merge` (+678 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `home/storyboards/screens.jsx`, `support.js`, `components.jsx`, `zakaat/storyboards/screens.jsx`, `useNoorDark`, `dependencies`, `@dnd-kit/core`, `describeConfig`, `describeConfig`, `inspector.tsx`, `toolbar.tsx`, `salaah-rules-screens.jsx`, `types.ts`, `slide-canvas.tsx`, `salaah-scroll-timeline.jsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@dnd-kit/core`, `SalaahConfigBody`, `react`, `@dnd-kit/utilities`, `tabs-row.jsx`, `jszip`, `next`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@dnd-kit/core`, `tailwind-merge`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `tokenKinds` connect `tokenKinds` to `x-omelette`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `protocol`, `objective`, `owner` to the rest of the system?**
  _683 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tokenKinds` be split into smaller, more focused modules?**
  _Cohesion score 0.0106951871657754 - nodes in this community are weakly interconnected._
- **Should `support.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07966457023060797 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08461131676361713 - nodes in this community are weakly interconnected._