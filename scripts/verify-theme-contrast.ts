/**
 * Theme contrast verifier — computes WCAG 2.1 contrast ratios for every
 * theme (dark + light schemes) and fails the build if any check misses.
 *
 * Checks per scheme:
 *   text / bg            ≥ 4.5  (body text — AA)
 *   textMuted / bg       ≥ 4.5  (muted body text — AA; safest reading)
 *   primaryFg / primary  ≥ 4.5  (button text — AA)
 *   accentFg / accent    ≥ 4.5  (badge text — AA)
 *   link / bg            ≥ 4.5  (inline links are body-size)
 *   focusRing / bg       ≥ 3.0  (UI component — AA 1.4.11)
 *   success / bg         ≥ 3.0  (status text is usually large/bold)
 *   danger / bg          ≥ 3.0
 *   warning / bg         ≥ 3.0
 *
 * The high-contrast theme is additionally checked at AAA (7:1) for
 * text and textMuted.
 *
 * Run: bun run scripts/verify-theme-contrast.ts
 */
import { THEMES } from "../src/themes/registry";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(h);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Resolve a token against a base (composites rgba surfaces over the bg). */
function resolve(color: string, base: string): string {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(color);
  if (!m) return color;
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const [br, bgc, bb] = hexToRgb(base);
  const mix = (fg: number, bgv: number) => Math.round(fg * a + bgv * (1 - a));
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return "#" + to2(mix(r, br)) + to2(mix(g, bgc)) + to2(mix(b, bb));
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const ra = resolve(a, b);
  const rb = resolve(b, b); // base composites over itself (opaque)
  const la = luminance(ra);
  const lb = luminance(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_TEXT = 4.5;
const AA_UI = 3.0;
const AAA_TEXT = 7.0;

type Check = { label: string; fg: string; bg: string; min: number };

let failures = 0;
let total = 0;
const failedThemes = new Set<string>();

for (const theme of THEMES) {
  for (const scheme of ["dark", "light"] as const) {
    const p = theme[scheme];
    const highContrast = theme.id === "high-contrast-accessible";
    const checks: Check[] = [
      { label: "text/bg", fg: p.text, bg: p.bg, min: highContrast ? AAA_TEXT : AA_TEXT },
      { label: "textMuted/bg", fg: p.textMuted, bg: p.bg, min: highContrast ? AAA_TEXT : AA_TEXT },
      { label: "text/surface", fg: p.text, bg: p.surface, min: highContrast ? AAA_TEXT : AA_TEXT },
      { label: "primaryFg/primary", fg: p.primaryFg, bg: p.primary, min: AA_TEXT },
      { label: "accentFg/accent", fg: p.accentFg, bg: p.accent, min: AA_TEXT },
      { label: "link/bg", fg: p.link, bg: p.bg, min: AA_TEXT },
      { label: "focusRing/bg", fg: p.focusRing, bg: p.bg, min: AA_UI },
      { label: "success/bg", fg: p.success, bg: p.bg, min: AA_UI },
      { label: "danger/bg", fg: p.danger, bg: p.bg, min: AA_UI },
      { label: "warning/bg", fg: p.warning, bg: p.bg, min: AA_UI },
      { label: "primary/bg (UI)", fg: p.primary, bg: p.bg, min: AA_UI },
    ];
    for (const c of checks) {
      total++;
      const r = ratio(c.fg, c.bg);
      if (r < c.min) {
        failures++;
        failedThemes.add(theme.id);
        console.log(
          `FAIL ${theme.id}.${scheme}: ${c.label} = ${r.toFixed(2)} (min ${c.min})  ${c.fg} on ${c.bg}`,
        );
      }
    }
  }
}

console.log(`\n${total - failures}/${total} contrast checks passed across ${THEMES.length} themes.`);
if (failures > 0) {
  console.log(`Failing themes: ${[...failedThemes].join(", ")}`);
  process.exit(1);
} else {
  console.log("All themes meet WCAG AA (AAA for high-contrast-accessible).");
}
