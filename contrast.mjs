// node contrast.mjs [jg.css] — checks every allowed pairing in both modes; exits 1 below AA.
import { readFileSync } from "node:fs";
const css = readFileSync(process.argv[2] ?? new URL("./jg.css", import.meta.url), "utf8");
const vars = Object.fromEntries([...css.matchAll(/(--jg-[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const resolve = (v, mode) => {
  v = v.trim();
  const ld = v.match(/^light-dark\((.+),\s*(.+)\)$/);
  if (ld) return resolve(mode === "light" ? ld[1] : ld[2], mode);
  const r = v.match(/^var\((--[\w-]+)\)$/);
  return r ? resolve(vars[r[1]], mode) : v;
};
const lum = hex => {
  const h = hex.replace("#", "").slice(0, 6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// pairing table: [foreground, background, minimum]
const TEXT = 4.5, UI = 3;
const surfaces = ["--jg-bg", "--jg-surface", "--jg-surface-2"];
const pairs = [
  ...surfaces.flatMap(s => ["--jg-text", "--jg-text-muted", "--jg-accent-strong", "--jg-danger", "--jg-ok", "--jg-info", "--jg-warn"].map(t => [t, s, TEXT])),
  ...surfaces.flatMap(s => [["--jg-text-dim", s, UI], ["--jg-accent", s, UI], ["--jg-line-strong", s, 1.3], ["--jg-focus-ring", s, UI]]),
  ["--jg-text", "--jg-sunken", TEXT], ["--jg-text", "--jg-accent-soft", TEXT],
  ["--jg-on-accent", "--jg-accent", TEXT], ["--jg-on-accent", "--jg-accent-strong", TEXT],
];
let fail = 0;
for (const mode of ["light", "dark"]) for (const [fg, bg, min] of pairs) {
  const r = ratio(resolve(vars[fg], mode), resolve(vars[bg], mode));
  if (r < min) { fail++; console.log(`FAIL ${mode} ${fg} on ${bg}: ${r.toFixed(2)} < ${min}`); }
}
console.log(fail ? `${fail} pairing(s) below target` : `all ${pairs.length * 2} pairings pass`);
process.exit(fail ? 1 : 0);
