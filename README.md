# comp-library

Design system for all Jagli projects: plain CSS and HTML, no React, no build step.

- Brand tokens (`--jg-*` CSS custom properties) with light and dark modes and contrast-checked colour pairings
- Native-element components (`<dialog>`, `popover`, `<details>`, `<select>`), plus a tiny vanilla-JS helper for tabs

Start with [docs/design-system-plan.md](docs/design-system-plan.md). The earlier OpenUI plan is superseded and kept for the record.

## Files
- `jg.css`: tokens (neutral starter set; brand values go here only), focus ring, reduced motion. Light and dark via `light-dark()`; force one with `<html data-theme="light|dark">`.
- `contrast.mjs`: `node contrast.mjs` checks every allowed colour pairing in both modes against WCAG AA.

Apps vendor a copy of `jg.css` and alias their own variables to `--jg-*`. Used by Image Lab and Audio Lab since 2026-10-16.
