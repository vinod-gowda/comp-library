# OpenUI as the base UI layer: analysis and rollout plan (2026-10-16)

**Ask:** adopt Thesys **OpenUI** (generative-UI React library, MIT, `github.com/thesysdev/openui`) as the
base UI layer for all projects, with the studio's own colours, pairings and fonts layered on top.
**Status:** analysis only. No project code changed.

## 1. What is actually loaded
- `vinod-gowda/comp-library` ("component library for all Jagli projects", made 2026-08-04) is **empty**:
  no commits, no default branch. It is **public**.
- Nothing OpenUI-related is in the p-cult repos, the forks or stars, or on the drive (`0proj/code`, `shared`,
  `sources`, `tools`). The user confirmed the target is Thesys OpenUI, not open-ui.org.
- Checked upstream on 2026-10-16. `@openuidev/react-ui` is at **0.18.1** (pre-1.0, so breaking changes are
  likely). It is built on **Radix UI** primitives and floating-ui, and styled with SCSS that reads
  **~237 `--openui-*` CSS custom properties**.

## 2. What OpenUI is, and the catch
OpenUI is a **generative-UI** framework. You register React components with Zod-typed props, and it writes the LLM
system prompt from them. The model replies in compact **OpenUI Lang**, and a streaming renderer paints
those components. The packages:
- `lang-core`: parser and prompt generation
- `react-lang`: the renderer
- `react-headless`: chat state and streaming
- `react-ui`: chat layouts plus ~70 components (Button, Input, Select, Tabs, Modal, Table, Charts, Card,
  Steps, Callout, Tag…) and the `ThemeProvider`
- Vue, Svelte and Angular bindings, `browser-bundle` (CDN, no build), `react-email`, `cli`

**The catch:** it is designed for screens an AI assembles at runtime, such as chat answers, agent results and
generated dashboards. It is not a general base layer for hand-built pages. The studio's current frontends
are not React:
- adc-26: static HTML
- imagelab, audiolab: Python apps with plain-JS frontends
- ts-2, ts-3, task-sheet: plain JS

Using it "everywhere" would mean either moving those to React or loading the browser bundle into pages
that have no LLM in the loop. Both cost a lot for little gain.

**Recommendation:** split it into two layers.
- **Brand tokens** (framework-free CSS custom properties) become the universal base, used by every project.
- **OpenUI** sits on top of the tokens wherever an AI renders UI, such as Image Lab or Audio Lab assistants, a
  "describe the shot list" view in the param dashboards, or generated reports.

Hand-built screens use the same tokens with plain HTML and native elements (`<dialog>`, `popover`,
`<select>`). They look the same as OpenUI screens without depending on React.

## 2a. Hosted-service dependency and audit (source read 2026-10-16)
**Verdict: usable with no Thesys account, no Thesys API and no Claude app**, provided the setup below is followed.
The packages below are a library. The model is whichever LLM you call: Claude via fal, a local llama, or similar.
The audit followed `processes/third-party-code-audit-before-install.md`. Source: the official
`thesysdev` org, MIT, active history.

| Package | Reads | Stores | Phones home |
|---|---|---|---|
| `lang-core` 1.0.1 (1 dep) | env vars, git origin (for a hash) | nothing | **Yes, at install.** The postinstall script sends a PostHog event with SDK/Node version, OS, CI and Docker flags and hashed project ID. It says there is no PII. **Disable with `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1`.** Runtime telemetry (10% sampled, server-side only, hashes and counts) is **opt-in** (`OPENUI_RUNTIME_TELEMETRY_ENABLED=1`). Leave it off. |
| `react-lang` 1.0.1 (3 deps) | the model's streamed text | nothing | no |
| `react-headless` 0.18.1 | chat state | nothing | Only if you use its `openuiCloud` helper, which talks to `api.thesys.dev` with a token. **Don't use it.** Point streaming at your own endpoint. |
| `react-ui` 0.18.1 (34 deps: Radix, floating-ui…) | nothing | nothing | no. URLs found are story/demo images only. |
| `observability-cloud` | events | — | Sends to `ingest.thesys.dev`, needs a Thesys key. **Don't install it.** |

Install rules:
- Set `DO_NOT_TRACK=1` in the shell profile and in CI.
- Install with `--ignore-scripts`, or vet `postinstall.cjs` on every upgrade.
- Pin exact versions and verify lockfile integrity hashes.
- Never install `observability-cloud` or the C1 SDK.
- Store a scan of the installed tree in the vault audit doc (telemetry regex, then read every hit).

## 3. Layering the studio's own theme
`ThemeProvider` takes `mode` (`light`/`dark`), a `theme` of partial overrides for light mode, `darkTheme`
(dark overrides; if omitted, the light overrides apply to both), and `cssSelector` (default `body`). It
writes the overrides as `--openui-*` variables. Token families:
- **Colour:** `text-*` (neutral, heading, body, label, accent, danger), `interactive-accent-*` and
  `interactive-destructive-*` (default, hover, pressed, disabled), `highlight`, `elevated`, `border`
- **Type:** `font-*`, `font-size-*`, `font-weight-*`, `line-height-*`, `letter-spacing-*`
- **Shape and depth:** `radius-*`, `space-*`, `shadow-*`
- **Charts:** chart palettes
- **System mode:** `useSystemThemeMode` follows the OS setting

**Layers, from bottom to top:**
1. **Primitives** (brand layer, ours): raw palette steps (`--jg-ink-900`, `--jg-saffron-500`…), font
   stacks, the spacing scale, radii and motion durations/easings. Values only, no meaning.
2. **Semantic tokens** (brand layer, ours): `--jg-surface`, `--jg-text`, `--jg-accent`, `--jg-danger`,
   `--jg-focus-ring`… These reference primitives, with a light set and a dark set. **Colour pairings**
   live here: each surface token is paired with the text tokens allowed on it, and each pairing is
   contrast-checked once.
3. **Adapters** (bridge): a `jaglitheme` object that maps semantic tokens into OpenUI's `Theme`
   (`interactiveAccentDefault: "var(--jg-accent)"`…), plus a plain-CSS file for non-React projects.
4. **Base layer** (theirs, untouched): OpenUI and Radix components, behaviour, anatomy and states.
5. **Per-project overrides** (rare): a few tokens per project, such as the adc-26 dance palette. Never component
   CSS.

Rule: **projects never set a raw colour or hex value**. They pick semantic tokens. Forking OpenUI's SCSS is
off limits, because overrides only go through `ThemeProvider` and tokens. This keeps 0.x upgrades cheap.
Motion is not themed in OpenUI, so wrap it in `prefers-reduced-motion` in our layer.

## 4. The standard it gives what ships
- **Accessibility, inherited from Radix:** keyboard navigation, focus trapping in Modal, roving focus in
  Tabs, Radio and Toggle groups, and ARIA roles and states on Select, Accordion, Checkbox, Slider and Dialog. OpenUI's own
  composite blocks (cards, lists, carousel, charts) are **not** covered by Radix. Audit them.
- **Generative-specific:** the model can only use registered components with typed props, so it cannot
  invent markup. That makes the output's quality and accessibility as good as the registry.
- **Consistent anatomy and states:** every interactive token has default, hover, pressed and disabled.
  Destructive is a separate family, and danger text is separate from accent.
- **What it does *not* guarantee:** colour contrast with *our* colours. That is our job.

**Checklist per screen:**
- Tab through everything, with a visible focus ring (`--jg-focus-ring`).
- Esc closes overlays, and focus returns to where it was.
- Every input has a label.
- Contrast is AA: 4.5:1 for text, 3:1 for UI and large text, in both modes.
- Respects reduced motion.
- Works at 320px width and 200% zoom.
- Generated output streams without layout jumps, and a `Skeleton` shows while loading.

**Automated checks:**
- A token **contrast test** in CI. A script reads every allowed pairing and fails below AA.
- **axe-core** via Playwright (`@axe-core/playwright`) on each pilot's main screens, light and dark.
- For the static site, **Lighthouse CI** accessibility ≥ 95.
- Storybook (upstream already uses it) with the a11y addon, for the component gallery.

## 5. Phased rollout
| Phase | What | Why this order | Done when |
|---|---|---|---|
| 0. Audit | Initial audit done (§2a). Repeat it on the installed tree; DO_NOT_TRACK, --ignore-scripts, pin exact versions. | Third-party code is trusted only after an audit. 0.x means pinning. | Audit entry in the vault, pinned versions noted |
| 1. Tokens | In `comp-library`: primitives, semantic light and dark tokens, the pairing table, the contrast test, and two adapters (OpenUI theme object and plain CSS) | Everything else depends on them, and they work with no framework | Contrast test passes. One demo page each in plain HTML and OpenUI looks the same in both modes |
| 2. Core primitives | A small set: Button, Input, Select, Tabs, Modal, Callout, Table, Card. OpenUI for React, a native-HTML recipe for plain-JS. Storybook and axe. | Most screens use these. Prove the theme on them before scaling | Each passes the checklist and axe in both modes |
| 3. Patterns | Forms, data tables, empty, loading and error states, and the generative chat or answer pane | Patterns are where consistency shows up | A pattern page with usage rules |
| 4. Pilots | (a) **Image Lab or Audio Lab**: an AI pane rendered with OpenUI, the real generative fit. (b) **ts-3**: a token-only adoption on a dashboard still in active slices. (c) **adc-26**: tokens and plain CSS only, as the static-site test | Covers the three real stacks. Only (a) needs React | Each pilot ships with checks green and no raw colours in its CSS |
| 5. Governance | Semver releases of `comp-library`. A changelog. A rule that new colours enter only as tokens. A monthly OpenUI upgrade check. A vault entry per release | Keeps the brand from drifting and keeps upgrades deliberate | Release process written. Two projects consume a tagged version |

**Not good pilots now:** ts-2 and task-sheet are legacy. Migrate them only when they are touched anyway.

## 6. Open decisions for the user
- The actual brand palette, colour pairings and fonts. These are needed for phase 1.
- Whether any non-AI app should move to React. The recommendation is no.
- `comp-library` is **public**. Tokens and docs are fine there, but keep project names and hosts out of it, or make it private.

Sources: github.com/thesysdev/openui (README; `packages/react-ui` source at 0.18.1);
docs.thesys.dev legacy theming guide (C1 ThemeProvider, OpenUI's predecessor).
