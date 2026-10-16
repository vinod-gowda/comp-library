# Studio design system, no React (2026-10-16)

**Supersedes** `plans/openui-component-library-2026-10.md`. The user decided on **no React**.
None of the projects build their screens with AI. They are:
- adc-26: static HTML
- imagelab, audiolab: Python apps with plain-JS front ends
- ts-2, ts-3, task-sheet: plain JS

Thesys OpenUI is a React-first tool for screens an AI builds at runtime, so it is dropped. Its audit
(the earlier plan, §2a) stays for reference.
Home: `vinod-gowda/comp-library` (public).

## What the base layer is instead
**The web platform itself.** Native elements already carry keyboard, focus and ARIA behaviour, with
no framework, no build step and no third-party runtime:

| Need | Native element |
|---|---|
| modal | `<dialog>` with `showModal()`: focus trap, Esc to close, inert background |
| menus, popovers, tooltips | `popover` attribute with `popovertarget`: light dismiss, top layer |
| select | `<select>`. Style it with `appearance: base-select` where supported, falling back to the plain select |
| accordion | `<details name="group">`: exclusive accordion |
| form validation | `required`, `pattern`, `:user-invalid` |
| toggle | `<input type=checkbox role=switch>` |

Tabs have no native element. Use one small vanilla-JS file, with no dependency, following the WAI-ARIA APG tabs pattern.

## Layers (all plain CSS and HTML)
1. **Primitives:** the raw palette, font stacks, spacing scale, radii, motion durations and easings (`--jg-*`).
2. **Semantic tokens:** surface, text, accent, danger and focus-ring, in light and dark sets using `light-dark()` and
   `color-scheme`, plus the **pairing table** (which text may sit on which surface), contrast-checked.
3. **Components:** about 8 native-element recipes styled only with semantic tokens, in `@layer jg.components`.
4. **Project overrides:** a few tokens per project, never raw hex values.

Delivery: one `jg.css` (tokens, base and components in cascade layers) plus an optional `jg.js` (tabs,
theme toggle). Pages link them by relative path or a pinned tag. No npm, no build.

## The standard it gives
- Native elements bring keyboard and focus behaviour. The recipe must not break them (keep a visible
  `:focus-visible` ring, never `outline: none`).
- Checks:
  - a token contrast script (AA: 4.5:1 for text, 3:1 for UI)
  - axe-core in a Playwright run on each pilot's key pages, light and dark
  - Lighthouse accessibility ≥ 95 on adc-26
  - a manual pass: Tab through the page, Esc, 320px width and 200% zoom, reduced motion

## Rollout
| Phase | What | Done when |
|---|---|---|
| 1. Tokens | Palette, fonts and pairings from the user, plus `jg.css` tokens and the contrast script | Contrast script passes in both modes. A swatch page is published |
| 2. Components | button, input, select, dialog, popover, details, tabs, table, card, callout | Each passes axe and the manual pass in both modes, on a gallery page |
| 3. Pilots | **ts-3** (active, plain JS), **adc-26** (static, public-facing), **imagelab** (tool UI) | No raw colours in pilot CSS. Checks are green |
| 4. Governance | Tagged releases, a changelog, new colours enter only as tokens, a vault entry per release | Two projects consume a tagged version |

ts-2 and task-sheet adopt it only when they are next touched.

## Needed from the user
Brand palette, colour pairings and fonts. Phase 1 starts there.
