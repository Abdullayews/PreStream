import type { ThemeDefinition, ThemeCategory, SeasonalWindow } from "./core/types";
import { SAFETY_CSS } from "./core/types";
import { neutral } from "./definitions/neutral";

/**
 * Theme registry — the single source of truth.
 *
 * Contract (Phase 3): every theme defines the same token set, applies via
 * ONE attribute (data-theme on <html>), switches instantly and leaves no
 * residue; the neutral default must always keep the site fully usable.
 *
 * `LEGACY_THEME_IDS` migrates ids saved before the rebuild (the user's
 * stored choice is never silently reset — it maps to the closest new id).
 */

export { neutral, SAFETY_CSS };

export const DEFAULT_THEME_ID = "neutral";

/** "Auto" pseudo-theme: no data-theme attribute → the neutral default
 *  follows the system light/dark scheme (handled by next-themes). */
export const AUTO_THEME_ID = "auto";

export interface ThemeCategoryMeta {
  id: ThemeCategory;
  label: string;
  blurb: string;
}

export const THEME_CATEGORIES: ThemeCategoryMeta[] = [
  { id: "base", label: "Base Colors", blurb: "Solid palettes with their own texture and motifs." },
  { id: "gradient", label: "Gradients", blurb: "Layered atmospheric color fields." },
  { id: "holiday", label: "Holidays", blurb: "Full seasonal scenes — motifs, weather and lights." },
  { id: "style", label: "Styles", blurb: "Distinct aesthetics and moods." },
];

/* ------------------------------------------------------------------ */
/* Definitions (assembled per category in Phase 6)                     */
/* ------------------------------------------------------------------ */

import { BASE_THEMES } from "./definitions/base";
import { GRADIENT_THEMES } from "./definitions/gradients";
import { HOLIDAY_THEMES } from "./definitions/holidays";
import { STYLE_THEMES } from "./definitions/styles";

/** All themes, registry order (switcher groups by category). */
export const THEMES: ThemeDefinition[] = [
  neutral,
  ...BASE_THEMES,
  ...GRADIENT_THEMES,
  ...HOLIDAY_THEMES,
  ...STYLE_THEMES,
];

/** Old (pre-rebuild) ids → closest new ids, so a saved choice survives. */
export const LEGACY_THEME_IDS: Record<string, string> = {
  mono: "neutral",
  crimson: "crimson-red",
  emerald: "forest-green",
  amber: "amber-gold",
  violet: "royal-purple",
  rose: "valentines-day",
  teal: "deep-ocean",
  orange: "lava-flow",
  lime: "forest-green",
  fuchsia: "royal-purple",
  sky: "ocean-blue",
  bronze: "amber-gold",
  mint: "forest-green",
  cherry: "crimson-red",
  halloween: "halloween",
  christmas: "christmas",
  valentine: "valentines-day",
  newyear: "new-year-eve",
  frosty: "winter-frost",
  stpatricks: "st-patricks",
  easter: "easter-spring",
  ironman: "crimson-red",
  hulk: "forest-green",
  thor: "northern-mist",
  cap: "independence-day-usa",
  panther: "royal-purple",
  spidey: "crimson-red",
  deadpool: "crimson-red",
};

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

/** Resolve a stored id (incl. legacy ids and "auto") to a usable theme. */
export function getTheme(id: string | null | undefined): ThemeDefinition | null {
  if (!id || id === AUTO_THEME_ID) return null; // auto = neutral default + system scheme
  return BY_ID.get(id) ?? BY_ID.get(LEGACY_THEME_IDS[id] ?? "") ?? null;
}

/** True when the id names a registered theme (after legacy migration). */
export function isThemeId(id: string | null | undefined): boolean {
  if (!id) return false;
  return BY_ID.has(id) || id in LEGACY_THEME_IDS || id === AUTO_THEME_ID;
}

/** Canonical id for storing (migrates legacy ids; validates). */
export function canonicalThemeId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id === AUTO_THEME_ID) return AUTO_THEME_ID;
  if (BY_ID.has(id)) return id;
  const mapped = LEGACY_THEME_IDS[id];
  return mapped && BY_ID.has(mapped) ? mapped : null;
}

/* ------------------------------------------------------------------ */
/* Seasonal suggestion (never auto-applied — user consent required)    */
/* ------------------------------------------------------------------ */

/** True when [month, day] falls inside the window (ranges may wrap the year). */
export function inSeasonalWindow(
  now: { getMonth(): number; getDate(): number },
  w: SeasonalWindow,
): boolean {
  const m = now.getMonth() + 1; // 1–12
  const d = now.getDate();
  const from = w.from[0] * 100 + w.from[1];
  const to = w.to[0] * 100 + w.to[1];
  const cur = m * 100 + d;
  return from <= to ? cur >= from && cur <= to : cur >= from || cur <= to;
}

/**
 * The seasonal suggestion for a date (or null). Pure function of the date —
 * never hardcodes a year; the switcher surfaces it as a one-tap "Try it".
 * When several windows overlap, the one that started most recently wins
 * (the most topical festival).
 */
export function seasonalSuggestion(now: Date = new Date()): {
  theme: ThemeDefinition;
  note: string;
} | null {
  const dayOfYear = (d: Date) =>
    Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const cur = dayOfYear(now);
  const daysInYear = (y: number) => (((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365);

  let best: { theme: ThemeDefinition; note: string; since: number } | null = null;
  for (const t of THEMES) {
    if (!t.seasonal) continue;
    if (!inSeasonalWindow(now, t.seasonal)) continue;
    const startY = new Date(now.getFullYear(), t.seasonal.from[0] - 1, t.seasonal.from[1]);
    let since = cur - dayOfYear(startY);
    if (since < 0) since += daysInYear(now.getFullYear()); // window wrapped the year
    if (!best || since < best.since) {
      best = { theme: t, note: t.seasonal.note, since };
    }
  }
  return best ? { theme: best.theme, note: best.note } : null;
}

/** Exported for the CSS generator + preview thumbnails. */
export function themesByCategory(cat: ThemeCategory): ThemeDefinition[] {
  return THEMES.filter((t) => t.category === cat);
}
