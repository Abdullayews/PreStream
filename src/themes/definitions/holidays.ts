import type { ThemeDefinition, ThemePalette, ThemeStyle } from "../core/types";

/**
 * CATEGORY C — HOLIDAY THEMES (12 required + winter-frost, the migration
 * target for the pre-rebuild "frosty" theme).
 *
 * Each theme documents its inspiration and the cultural-accuracy decisions
 * made (Phase 5): symbols were chosen from widely-recognized, respectful
 * imagery; sacred text and people are never depicted; lunar-calendar
 * holidays use approximate Gregorian windows (noted per theme).
 */

const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

type Pal = ThemePalette & ThemeStyle;

const darkBase = (p: Partial<Pal>): Pal => ({
  bg: "#0d0a10", bgAlt: "#191320", surface: "#130f1a", surfaceRaised: "#1a1424",
  border: "#2c2334", text: "#f5f0e8", textMuted: "#b0a6b8",
  primary: "#e8b76a", primaryHover: "#f3cd8f", primaryFg: "#241503",
  accent: "#e8b76a", accentFg: "#241503",
  success: "#4ade80", warning: "#fbbf24", danger: "#f87171",
  link: "#f0d5a8", focusRing: "#e8b76a",
  shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
  shadowMd: "0 10px 32px rgba(0,0,0,0.42)",
  shadowLg: "0 26px 64px rgba(0,0,0,0.55)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SERIF, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0.03, animSpeed: 1,
  ...p,
});

const lightBase = (p: Partial<Pal>): Pal => ({
  bg: "#faf8f4", bgAlt: "#f1ece2", surface: "#ffffff", surfaceRaised: "#ffffff",
  border: "#e5dccc", text: "#211a10", textMuted: "#6b5d48",
  primary: "#92400e", primaryHover: "#78350d", primaryFg: "#fffbeb",
  accent: "#b45309", accentFg: "#fffbeb",
  success: "#15803d", warning: "#a16207", danger: "#b91c1c",
  link: "#78350d", focusRing: "#92400e",
  shadowSm: "0 1px 2px rgba(33,26,16,0.08)",
  shadowMd: "0 8px 28px rgba(33,26,16,0.12)",
  shadowLg: "0 22px 56px rgba(33,26,16,0.16)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SERIF, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0, animSpeed: 1,
  ...p,
});

export const HOLIDAY_THEMES: ThemeDefinition[] = [
  /* 17. halloween */
  {
    id: "halloween",
    name: "Halloween",
    description: "Haunted skyline, full moon, drifting fog and swooping bats.",
    category: "holiday",
    seasonal: { from: [10, 1], to: [11, 1], note: "Spooky season — pumpkins, fog and bats." },
    inspiration:
      "TemplateMonster Halloween-templates category (atmosphere reference): haunted skyline silhouettes, bare trees, full moon, cobweb corners. Own design: violet-black night, pumpkin-orange actions, poison-green accents.",
    dark: darkBase({
      bg: "#0d0711", bgAlt: "#1a0f22", surface: "#140b1c", surfaceRaised: "#1c1126",
      border: "#33203f", text: "#f6ebdd", textMuted: "#b9a5c4",
      primary: "#ff7518", primaryHover: "#ff9448", primaryFg: "#1d0b00",
      accent: "#8cff3c", accentFg: "#0a1c00",
      link: "#ffb37d", focusRing: "#ff7518",
      fontHeading: "'Palatino Linotype', Palatino, Georgia, serif",
      bgImage:
        "radial-gradient(60% 26% at 78% 6%, rgba(255,214,143,0.15), transparent 52%)," +
        "radial-gradient(56% 24% at 80% 7%, rgba(13,7,17,0.98) 0%, rgba(13,7,17,0.55) 42%, transparent 72%)," +
        "radial-gradient(85% 30% at 16% 108%, rgba(26,15,34,0.98) 0%, transparent 60%)," +
        "radial-gradient(75% 26% at 86% 112%, rgba(26,15,34,0.96) 0%, transparent 58%)," +
        "linear-gradient(180deg, rgba(140,255,60,0.03), transparent 30%)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#faf4ec", bgAlt: "#f1e6d8", surface: "#ffffff", border: "#e8d9c4",
      text: "#241310", textMuted: "#7c5a48",
      primary: "#c2410c", primaryHover: "#9a3412", primaryFg: "#fff7ed",
      accent: "#3f6212", accentFg: "#f7fee7", link: "#9a3412", focusRing: "#c2410c",
      fontHeading: "'Palatino Linotype', Palatino, Georgia, serif",
      bgImage:
        "radial-gradient(60% 26% at 78% 4%, rgba(251,191,36,0.14), transparent 54%)," +
        "radial-gradient(85% 30% at 14% 108%, rgba(194,65,12,0.08), transparent 58%)",
    }),
    decor: [
      { kind: "fog", tints: ["rgba(154, 122, 168, 0.07)", "rgba(90, 70, 110, 0.06)"], bands: 3 },
      { kind: "glyphs", count: 7, glyphs: ["🦇"], anim: "fly", duration: [14, 26], size: [0.7, 1.2], colors: ["#1a1024"], opacity: [0.5, 0.8] },
      { kind: "glyphs", count: 5, glyphs: ["🎃"], anim: "rise", duration: [22, 40], size: [0.9, 1.5], opacity: [0.35, 0.6] },
    ],
    flourishCss: `
.glass { border-color: rgba(255, 117, 24, 0.16); }
h1, h2, h3 { font-weight: 700; }`,
  },

  /* 18. christmas */
  {
    id: "christmas",
    name: "Christmas",
    description: "Evergreen night, string lights, ribbon dividers and soft falling snow.",
    category: "holiday",
    seasonal: { from: [12, 1], to: [12, 26], note: "Evergreen, string lights and snow." },
    inspiration:
      "Classic Christmas-card motifs: evergreen branches, warm string lights, deep pine night sky. Own design: pine-green surfaces, holly-red actions, gold accents; lights strung under the header.",
    dark: darkBase({
      bg: "#0b1f17", bgAlt: "#12301f", surface: "#0f271b", surfaceRaised: "#163526",
      border: "#264b33", text: "#f7fff8", textMuted: "#a8c4ae",
      primary: "#c73e3e", primaryHover: "#f07575", primaryFg: "#fff5f5",
      accent: "#f2c14e", accentFg: "#241a02",
      link: "#9fe3b2", focusRing: "#e05252",
      bgImage:
        "radial-gradient(110% 42% at 50% -10%, rgba(18,48,31,0.9), transparent 56%)," +
        "radial-gradient(80% 28% at 12% 110%, rgba(11,31,23,0.98) 0%, transparent 58%)," +
        "radial-gradient(70% 24% at 88% 112%, rgba(11,31,23,0.96) 0%, transparent 56%)," +
        "linear-gradient(180deg, rgba(242,193,78,0.04), transparent 24%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f6fbf6", bgAlt: "#e8f2e9", surface: "#ffffff", border: "#d6e5d8",
      text: "#122817", textMuted: "#4f6b55",
      primary: "#b91c1c", primaryHover: "#991b1b", primaryFg: "#fef2f2",
      accent: "#a16207", accentFg: "#fefce8", link: "#991b1b", focusRing: "#b91c1c",
      bgImage:
        "radial-gradient(100% 40% at 50% -10%, rgba(185,28,28,0.05), transparent 56%)," +
        "radial-gradient(80% 28% at 10% 110%, rgba(21,128,61,0.08), transparent 58%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 16, colors: ["#ffffff", "#e0f2fe"], anim: "fall",
        blur: [1, 5], size: [4, 13], duration: [16, 30], opacity: [0.08, 0.2],
      },
      { kind: "glyphs", count: 16, glyphs: ["❄", "❅", "❆", "✻"], anim: "fall", duration: [11, 24], size: [0.6, 1.4] },
      { kind: "garland", colors: ["#e05252", "#3fae62", "#f2c14e", "#7cc5ea"] },
    ],
    flourishCss: `
.glass { border-top-color: rgba(242, 193, 78, 0.22); }`,
  },

  /* 19. new-year-eve */
  {
    id: "new-year-eve",
    name: "New Year's Eve",
    description: "Art Deco gold, champagne bubbles and slow firework bursts.",
    category: "holiday",
    seasonal: { from: [12, 27], to: [1, 7], note: "Champagne gold and fireworks for the new year." },
    inspiration:
      "1920s Art Deco New-Year posters — geometric gold fan patterns, midnight navy, champagne bubbles. Typography: Didot/Bodoni-style display serif with wide tracking.",
    dark: darkBase({
      bg: "#05060f", bgAlt: "#0f1226", surface: "#0a0d1d", surfaceRaised: "#11142c",
      border: "#2a2e52", text: "#ffffff", textMuted: "#a8adc8",
      primary: "#f5d061", primaryHover: "#ffe08a", primaryFg: "#211a02",
      accent: "#c0c8ff", accentFg: "#0a0c1f",
      link: "#ffe9ab", focusRing: "#f5d061",
      fontHeading: "'Didot', 'Bodoni MT', 'Playfair Display', Georgia, serif",
      bgImage:
        "radial-gradient(120% 44% at 50% -12%, rgba(15,18,38,0.95), transparent 52%)," +
        "repeating-conic-gradient(from 210deg at 50% -60px, rgba(245,208,97,0.05) 0deg 6deg, transparent 6deg 30deg)," +
        "radial-gradient(80% 30% at 50% 116%, rgba(192,200,255,0.08), transparent 55%)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#faf9f4", bgAlt: "#efecdf", surface: "#ffffff", border: "#e3ddc8",
      text: "#181302", textMuted: "#6b6248",
      primary: "#854d0e", primaryHover: "#713f12", primaryFg: "#fefce8",
      accent: "#3730a3", accentFg: "#eef2ff", link: "#713f12", focusRing: "#854d0e",
      fontHeading: "'Didot', 'Bodoni MT', 'Playfair Display', Georgia, serif",
      bgImage:
        "repeating-conic-gradient(from 210deg at 50% -60px, rgba(133,77,14,0.04) 0deg 6deg, transparent 6deg 30deg)," +
        "radial-gradient(80% 30% at 50% 116%, rgba(55,48,163,0.05), transparent 55%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 14, colors: ["#f5d061", "#ffe9ab", "#ffffff"], anim: "rise",
        blur: [1, 6], size: [3, 10], duration: [10, 22], opacity: [0.1, 0.24],
      },
      { kind: "sparks", bursts: 3, colors: ["#f5d061", "#ffffff", "#c0c8ff"] },
    ],
    flourishCss: `
h1, h2, h3 { letter-spacing: 0.06em; font-weight: 600; }
.glass { border-top-color: rgba(245, 208, 97, 0.28); }`,
  },

  /* 20. valentines-day */
  {
    id: "valentines-day",
    name: "Valentine's Day",
    description: "Rose petals, lace borders and a soft heartbeat glow.",
    category: "holiday",
    seasonal: { from: [2, 1], to: [2, 15], note: "Rose petals and hearts for Valentine's Day." },
    inspiration:
      "Vintage valentine cards — lace doilies, rose petals, deep berry reds and pinks. Headings use a script-capable stack (falls back to an elegant serif where no script font exists); heart glyph particles drift upward.",
    dark: darkBase({
      bg: "#1f0a14", bgAlt: "#35101f", surface: "#290d1a", surfaceRaised: "#3d1526",
      border: "#5e2338", text: "#fff0f5", textMuted: "#d3a3b4",
      primary: "#ff4d8d", primaryHover: "#ff77a8", primaryFg: "#2b030f",
      accent: "#ffb3c7", accentFg: "#33121e",
      link: "#ff9ebc", focusRing: "#ff4d8d",
      fontHeading: "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Palatino Linotype', cursive, serif",
      bgImage:
        "radial-gradient(110% 44% at 50% -10%, rgba(255,77,141,0.14), transparent 52%)," +
        "radial-gradient(85% 30% at 50% 114%, rgba(31,10,20,0.98) 0%, transparent 60%)," +
        "repeating-radial-gradient(circle at 50% 132%, transparent 0 34px, rgba(255,179,199,0.03) 34px 36px)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#fff5f8", bgAlt: "#fde8ef", surface: "#ffffff", border: "#f6d4de",
      text: "#2b0a16", textMuted: "#7c4358",
      primary: "#be185d", primaryHover: "#9d174d", primaryFg: "#fdf2f8",
      accent: "#9f1239", accentFg: "#fff1f2", link: "#9d174d", focusRing: "#be185d",
      fontHeading: "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Palatino Linotype', cursive, serif",
      bgImage:
        "radial-gradient(100% 42% at 50% -10%, rgba(190,24,93,0.07), transparent 54%)," +
        "repeating-radial-gradient(circle at 50% 132%, transparent 0 34px, rgba(190,24,93,0.025) 34px 36px)",
    }),
    decor: [
      { kind: "glyphs", count: 14, glyphs: ["♥", "❤", "❥"], anim: "rise", duration: [12, 24], size: [0.7, 1.4], colors: ["#ff4d8d", "#ffb3c7", "#e75480"], opacity: [0.12, 0.3] },
      {
        kind: "bokeh", count: 12, colors: ["#ff9ebc", "#ffb3c7", "#fde8ef"], anim: "rise",
        blur: [2, 8], size: [5, 16], duration: [16, 30], opacity: [0.07, 0.16],
      },
      { kind: "garland", colors: ["#ff4d8d", "#ff77a8", "#ffb3c7", "#e75480"] },
    ],
    flourishCss: `
.bg-primary { box-shadow: 0 0 26px rgba(255, 77, 141, 0.28); }`,
  },

  /* 21. easter-spring */
  {
    id: "easter-spring",
    name: "Easter Spring",
    description: "Pastel eggs, drifting petals and fresh spring light.",
    category: "holiday",
    seasonal: { from: [3, 20], to: [4, 20], note: "Spring blossoms and pastel eggs (Easter moves — approximate window)." },
    inspiration:
      "Easter secular imagery: dyed eggs, spring blossoms, fresh green grass. The window approximates the moving Easter date (always between Mar 22 and Apr 25); the palette is fresh pastel — light mode is the natural mode here.",
    dark: darkBase({
      bg: "#132018", bgAlt: "#1e3324", surface: "#182a1e", surfaceRaised: "#22382a",
      border: "#37503c", text: "#f2fbf4", textMuted: "#a9c4ad",
      primary: "#7bd389", primaryHover: "#9fe8ab", primaryFg: "#06230c",
      accent: "#ffb5e8", accentFg: "#330b25",
      link: "#ffd9f1", focusRing: "#7bd389",
      radiusSm: "12px", radiusMd: "22px", radiusLg: "30px",
      fontHeading: "ui-rounded, 'Hiragino Maru Gothic ProN', 'Segoe UI', system-ui, sans-serif",
      bgImage:
        "radial-gradient(105% 42% at 50% -10%, rgba(123,211,137,0.13), transparent 54%)," +
        "radial-gradient(85% 30% at 50% 114%, rgba(255,181,232,0.09), transparent 55%)",
      noiseOpacity: 0.02,
    }),
    light: lightBase({
      bg: "#f7fff4", bgAlt: "#edf8ea", surface: "#ffffff", border: "#dcecd9",
      text: "#1c2e20", textMuted: "#4f6b55",
      primary: "#237946", primaryHover: "#1d683c", primaryFg: "#f0fdf4",
      accent: "#bd3b74", accentFg: "#fdf2f8",
      link: "#1d683c", focusRing: "#237946",
      radiusSm: "12px", radiusMd: "22px", radiusLg: "30px",
      fontHeading: "ui-rounded, 'Hiragino Maru Gothic ProN', 'Segoe UI', system-ui, sans-serif",
      bgImage:
        "radial-gradient(100% 40% at 50% -8%, rgba(35,121,70,0.08), transparent 54%)," +
        "radial-gradient(80% 28% at 50% 114%, rgba(189,59,116,0.07), transparent 55%)",
    }),
    decor: [
      { kind: "glyphs", count: 12, glyphs: ["✿", "❀", "✤"], anim: "fall", duration: [16, 30], size: [0.6, 1.2], colors: ["#ffb5e8", "#ffd9f1", "#a7f3d0"], opacity: [0.16, 0.34] },
      {
        kind: "bokeh", count: 10, colors: ["#ffb5e8", "#a7f3d0", "#fde68a"], anim: "rise",
        blur: [2, 8], size: [4, 14], duration: [18, 34], opacity: [0.08, 0.18],
      },
    ],
    flourishCss: `
h1, h2, h3 { font-weight: 700; }`,
  },

  /* 22. autumn-harvest */
  {
    id: "autumn-harvest",
    name: "Autumn Harvest",
    description: "Falling leaves, wheat motifs and warm wood-grain light.",
    category: "holiday",
    seasonal: { from: [11, 1], to: [11, 30], note: "Harvest tones — falling leaves and warm light (Thanksgiving window)." },
    inspiration:
      "North-American autumn/Thanksgiving: falling maple leaves, wheat sheaves, warm wood tones. Kept to season and harvest imagery (no stereotyped depictions of people); hearth-warm browns with pumpkin orange.",
    dark: darkBase({
      bg: "#1c1008", bgAlt: "#2b1a0d", surface: "#23150a", surfaceRaised: "#32200f",
      border: "#54371b", text: "#fff1dc", textMuted: "#cfae85",
      primary: "#d2691e", primaryHover: "#ec8637", primaryFg: "#1f0d01",
      accent: "#e0a63b", accentFg: "#241703",
      link: "#f0c089", focusRing: "#d2691e",
      bgImage:
        "radial-gradient(95% 38% at 72% -8%, rgba(224,166,59,0.10), transparent 52%)," +
        "radial-gradient(85% 30% at 50% 114%, rgba(28,16,8,0.98) 0%, transparent 60%)," +
        "repeating-linear-gradient(94deg, rgba(84,55,27,0.07) 0 2px, transparent 2px 12px)",
      noiseOpacity: 0.045,
    }),
    light: lightBase({
      bg: "#fdf6ea", bgAlt: "#f6e9d2", surface: "#fffdf8", border: "#ecdcc0",
      text: "#2b1a0b", textMuted: "#77583a",
      primary: "#9a3412", primaryHover: "#7c2d12", primaryFg: "#fff7ed",
      accent: "#854d0e", accentFg: "#fefce8", link: "#7c2d12", focusRing: "#9a3412",
      bgImage:
        "radial-gradient(90% 36% at 72% -8%, rgba(224,166,59,0.10), transparent 52%)," +
        "repeating-linear-gradient(94deg, rgba(133,77,14,0.03) 0 2px, transparent 2px 12px)",
    }),
    decor: [
      { kind: "glyphs", count: 12, glyphs: ["❦", "✤", "❧", "✣"], anim: "fall", duration: [14, 28], size: [0.7, 1.4], colors: ["#d2691e", "#e0a63b", "#b45309"], opacity: [0.2, 0.4] },
      {
        kind: "bokeh", count: 8, colors: ["#e0a63b", "#fbbf24"], anim: "rise",
        blur: [3, 9], size: [4, 12], duration: [20, 38], opacity: [0.05, 0.12],
      },
    ],
  },

  /* 23. st-patricks */
  {
    id: "st-patricks",
    name: "St. Patrick's",
    description: "Clover fields, gold dust and a rainbow arc.",
    category: "holiday",
    seasonal: { from: [3, 1], to: [3, 20], note: "Shamrocks and gold for St. Patrick's Day." },
    inspiration:
      "St. Patrick's Day secular symbols: shamrock/clover, pot-of-gold, rainbow. Restrained Celtic-knot-inspired hairlines (original geometry); no caricatured imagery — deep Irish green + leprechaun gold.",
    dark: darkBase({
      bg: "#06150b", bgAlt: "#0d2616", surface: "#0a1e11", surfaceRaised: "#112e1c",
      border: "#1e4527", text: "#f1fff5", textMuted: "#9dc4a6",
      primary: "#1faf5a", primaryHover: "#3cc97a", primaryFg: "#03140a",
      accent: "#f4c430", accentFg: "#241a02",
      link: "#8fe8ae", focusRing: "#1faf5a",
      bgImage:
        "radial-gradient(120% 46% at 50% -12%, rgba(31,175,90,0.13), transparent 52%)," +
        "radial-gradient(90% 34% at 22% 108%, rgba(6,21,11,0.98) 0%, transparent 60%)," +
        "radial-gradient(80% 30% at 82% 110%, rgba(6,21,11,0.96) 0%, transparent 58%)," +
        "repeating-radial-gradient(circle at 50% 148%, transparent 0 60px, rgba(244,196,48,0.02) 60px 62px)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f4fbf5", bgAlt: "#e5f4e8", surface: "#ffffff", border: "#d2e8d6",
      text: "#0b1f10", textMuted: "#4a6b52",
      primary: "#15803d", primaryHover: "#166534", primaryFg: "#f0fdf4",
      accent: "#a16207", accentFg: "#fefce8", link: "#166534", focusRing: "#15803d",
      bgImage:
        "radial-gradient(110% 42% at 50% -10%, rgba(21,128,61,0.09), transparent 54%)," +
        "repeating-radial-gradient(circle at 50% 148%, transparent 0 60px, rgba(161,98,7,0.02) 60px 62px)",
    }),
    decor: [
      { kind: "glyphs", count: 10, glyphs: ["☘", "❋", "✦"], anim: "fall", duration: [16, 30], size: [0.7, 1.3], colors: ["#1faf5a", "#3cc97a", "#f4c430"], opacity: [0.18, 0.36] },
      {
        kind: "bokeh", count: 10, colors: ["#f4c430", "#fde68a"], anim: "rise",
        blur: [1, 6], size: [2, 8], duration: [16, 32], opacity: [0.08, 0.2],
      },
    ],
  },

  /* 24. independence-day-usa */
  {
    id: "independence-day-usa",
    name: "Independence Day",
    description: "Star-spangled night sky with firework bursts and bunting stripes.",
    category: "holiday",
    seasonal: { from: [6, 25], to: [7, 10], note: "Stars, stripes and fireworks for the Fourth of July." },
    inspiration:
      "Fourth-of-July Americana: star field, red/white/blue bunting, fireworks over a night harbor. Bold slab-style headings; stripe accents confined to hairlines so text contrast is untouched.",
    dark: darkBase({
      bg: "#070b1f", bgAlt: "#101a3d", surface: "#0b132e", surfaceRaised: "#122045",
      border: "#26335e", text: "#f5f8ff", textMuted: "#a3b1d4",
      primary: "#c93042", primaryHover: "#d43a4c", primaryFg: "#fff5f5",
      accent: "#6b93f5", accentFg: "#060c22",
      link: "#9db7f0", focusRing: "#3c6df0",
      fontHeading: "'Rockwell', 'Roboto Slab', Georgia, serif",
      bgImage:
        "radial-gradient(120% 46% at 76% -12%, rgba(60,109,240,0.16), transparent 52%)," +
        "radial-gradient(100% 40% at 18% -6%, rgba(178,34,52,0.13), transparent 50%)," +
        "repeating-linear-gradient(180deg, rgba(245,248,255,0.018) 0 2px, transparent 2px 34px)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f8fafd", bgAlt: "#eaef9", surface: "#ffffff", border: "#d9e0ea",
      text: "#0e1631", textMuted: "#4b5878",
      primary: "#b22234", primaryHover: "#991b2b", primaryFg: "#fff5f5",
      accent: "#1d4ed8", accentFg: "#eff6ff", link: "#991b2b", focusRing: "#1d4ed8",
      fontHeading: "'Rockwell', 'Roboto Slab', Georgia, serif",
      bgImage:
        "radial-gradient(110% 42% at 76% -10%, rgba(29,78,216,0.07), transparent 54%)," +
        "repeating-linear-gradient(180deg, rgba(29,78,216,0.025) 0 2px, transparent 2px 34px)",
    }),
    decor: [
      { kind: "stars", count: 40, colors: ["#ffffff", "#c9d8ff", "#f5c6c6"], shootingStarPerMin: 0 },
      { kind: "sparks", bursts: 3, colors: ["#b22234", "#ffffff", "#3c6df0"] },
    ],
    flourishCss: `
.glass { border-top: 2px solid; border-image: linear-gradient(90deg, #b22234, rgba(255,255,255,0.2), #3c6df0) 1; }
h1, h2, h3 { font-weight: 700; }`,
  },

  /* 25. lunar-new-year */
  {
    id: "lunar-new-year",
    name: "Lunar New Year",
    description: "Red lanterns, gold sparkle and paper-cut cloud patterns.",
    category: "holiday",
    seasonal: { from: [1, 15], to: [2, 10], note: "Lanterns and red-gold festivity (Lunar New Year moves — approximate window)." },
    inspiration:
      "Lunar New Year vernacular: red lanterns, red envelopes, gold calligraphy, paper-cut cloud motifs (xiangyun). Symbols kept to lanterns, sparkle and clouds — accurate and respectful; the Gregorian window is approximate (lunar calendar, late Jan–mid Feb).",
    dark: darkBase({
      bg: "#1a0505", bgAlt: "#2b0a0a", surface: "#220707", surfaceRaised: "#320d0d",
      border: "#5c1d1d", text: "#fff4dc", textMuted: "#d4a58f",
      primary: "#d4202c", primaryHover: "#ef3a44", primaryFg: "#fff4f4",
      accent: "#f7c948", accentFg: "#2b1c02",
      link: "#ffd98f", focusRing: "#d4202c",
      fontHeading: "'Kaiti SC', 'KaiTi', 'STKaiti', Georgia, serif",
      bgImage:
        "radial-gradient(110% 44% at 50% -12%, rgba(212,32,44,0.17), transparent 52%)," +
        "repeating-radial-gradient(circle at 12% 16%, transparent 0 52px, rgba(247,201,72,0.03) 52px 54px)," +
        "repeating-radial-gradient(circle at 88% 84%, transparent 0 64px, rgba(247,201,72,0.022) 64px 66px)," +
        "radial-gradient(85% 30% at 50% 114%, rgba(26,5,5,0.98) 0%, transparent 60%)",
      noiseOpacity: 0.035,
    }),
    light: lightBase({
      bg: "#fff8ef", bgAlt: "#fdeddb", surface: "#ffffff", border: "#f2d9c4",
      text: "#2b0a0a", textMuted: "#7c4a3a",
      primary: "#b91c1c", primaryHover: "#991b1b", primaryFg: "#fef2f2",
      accent: "#b45309", accentFg: "#fffbeb", link: "#991b1b", focusRing: "#b91c1c",
      fontHeading: "'Kaiti SC', 'KaiTi', 'STKaiti', Georgia, serif",
      bgImage:
        "radial-gradient(100% 40% at 50% -10%, rgba(185,28,28,0.07), transparent 54%)," +
        "repeating-radial-gradient(circle at 12% 16%, transparent 0 52px, rgba(180,83,9,0.03) 52px 54px)",
    }),
    decor: [
      { kind: "lanterns", colors: ["#d4202c", "#ef3a44", "#f7c948"], count: 6 },
      { kind: "glyphs", count: 10, glyphs: ["✦", "✧", "❋"], anim: "rise", duration: [14, 26], size: [0.5, 1.1], colors: ["#f7c948", "#ffe9ab"], opacity: [0.14, 0.3] },
    ],
    flourishCss: `
.glass { border-top-color: rgba(247, 201, 72, 0.30); }
h1, h2, h3 { letter-spacing: 0.02em; }`,
  },

  /* 26. diwali */
  {
    id: "diwali",
    name: "Diwali",
    description: "Diya glow, rangoli geometry and marigold warmth.",
    category: "holiday",
    seasonal: { from: [10, 10], to: [11, 15], note: "Festival of lights — diyas and rangoli (Diwali moves — approximate window)." },
    inspiration:
      "Diwali, the festival of lights: lit diyas (oil lamps), rangoli patterns, marigold garlands. Motifs verified against festival photography — lamps, geometry and flowers only (no deities, no people); the Gregorian window is approximate (lunar, mid-Oct–mid-Nov).",
    dark: darkBase({
      bg: "#12051f", bgAlt: "#1e0a33", surface: "#180729", surfaceRaised: "#230d3c",
      border: "#471c6b", text: "#fff3dc", textMuted: "#c3a3d4",
      primary: "#ff9f1c", primaryHover: "#ffb84d", primaryFg: "#241200",
      accent: "#e83f6f", accentFg: "#2b020e",
      link: "#ffc98f", focusRing: "#ff9f1c",
      bgImage:
        "radial-gradient(115% 46% at 50% -12%, rgba(255,159,28,0.15), transparent 52%)," +
        "repeating-conic-gradient(from 0deg at 88% 108%, rgba(232,63,111,0.05) 0deg 12deg, transparent 12deg 30deg)," +
        "repeating-conic-gradient(from 15deg at 8% 112%, rgba(255,159,28,0.045) 0deg 10deg, transparent 10deg 26deg)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#fff8f2", bgAlt: "#ffedd8", surface: "#ffffff", border: "#f5d9bd",
      text: "#2b1006", textMuted: "#7c5335",
      primary: "#a84a08", primaryHover: "#a34a08", primaryFg: "#fff7ed",
      accent: "#be1558", accentFg: "#fdf2f8", link: "#a34a08", focusRing: "#c2570a",
      bgImage:
        "radial-gradient(105% 42% at 50% -10%, rgba(194,87,10,0.09), transparent 54%)," +
        "repeating-conic-gradient(from 0deg at 88% 108%, rgba(190,21,88,0.05) 0deg 12deg, transparent 12deg 30deg)",
    }),
    decor: [
      {
        kind: "bokeh", count: 14, colors: ["#ff9f1c", "#ffd166", "#e83f6f"], anim: "rise",
        blur: [2, 9], size: [3, 12], duration: [12, 26], opacity: [0.1, 0.24],
      },
      { kind: "sparks", bursts: 2, colors: ["#ffd166", "#e83f6f", "#ffffff"] },
      { kind: "garland", colors: ["#ff9f1c", "#e83f6f", "#ffd166"] },
    ],
    flourishCss: `
.glass { border-top-color: rgba(255, 159, 28, 0.26); }`,
  },

  /* 27. eid-ramadan */
  {
    id: "eid-ramadan",
    name: "Eid & Ramadan",
    description: "Crescent night, fanous lanterns and geometric arabesque patterns.",
    category: "holiday",
    inspiration:
      "Ramadan/Eid imagery: crescent moon, fanous lanterns, geometric Islamic star patterns. Motifs verified: geometry, crescent and lanterns only — sacred text is never used decoratively and no people are depicted. No fixed seasonal window: the Hijri calendar moves ~11 days earlier each Gregorian year, so a fixed window would be wrong most years — this theme is always available from the switcher instead.",
    dark: darkBase({
      bg: "#06141c", bgAlt: "#0d2431", surface: "#0a1d28", surfaceRaised: "#102b3a",
      border: "#1f4a5c", text: "#f4fbf9", textMuted: "#9cc0bc",
      primary: "#d9b44a", primaryHover: "#e9cb70", primaryFg: "#241a02",
      accent: "#38b6a8", accentFg: "#03211d",
      link: "#a8e3d9", focusRing: "#d9b44a",
      fontHeading: "'Palatino Linotype', Palatino, Georgia, serif",
      bgImage:
        "radial-gradient(64% 30% at 82% 4%, rgba(217,180,74,0.13), transparent 50%)," +
        "radial-gradient(56% 26% at 84% 6%, rgba(6,20,28,0.98) 0%, rgba(6,20,28,0.5) 40%, transparent 70%)," +
        "repeating-conic-gradient(from 22.5deg at 50% 130%, rgba(56,182,168,0.04) 0deg 11.25deg, transparent 11.25deg 45deg)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f4fbf9", bgAlt: "#e2f1ee", surface: "#ffffff", border: "#cfe4e0",
      text: "#0a1f24", textMuted: "#42635e",
      primary: "#8a6d1f", primaryHover: "#755c1a", primaryFg: "#fefce8",
      accent: "#0f766e", accentFg: "#f0fdfa", link: "#755c1a", focusRing: "#0f766e",
      fontHeading: "'Palatino Linotype', Palatino, Georgia, serif",
      bgImage:
        "radial-gradient(60% 28% at 82% 4%, rgba(138,109,31,0.09), transparent 52%)," +
        "repeating-conic-gradient(from 22.5deg at 50% 130%, rgba(15,118,110,0.04) 0deg 11.25deg, transparent 11.25deg 45deg)",
    }),
    decor: [
      { kind: "stars", count: 30, colors: ["#ffffff", "#d9b44a", "#9de8de"], shootingStarPerMin: 0.4 },
      { kind: "lanterns", colors: ["#d9b44a", "#38b6a8"], count: 4 },
    ],
    flourishCss: `
.glass { border-top-color: rgba(217, 180, 74, 0.24); }`,
  },

  /* 28. nowruz-spring */
  {
    id: "nowruz-spring",
    name: "Nowruz Spring",
    description: "Sprouting green, spring blossoms and warm fire-festival glow.",
    category: "holiday",
    seasonal: { from: [3, 1], to: [3, 21], note: "Spring equinox — sprouts, blossoms and new-year warmth." },
    inspiration:
      "Nowruz (Persian New Year, spring equinox): sabzeh (green sprouts), spring blossoms, the haft-sin table's fresh green, and a nod to Chaharshanbe Suri's fire glow. Motifs kept to plants and warm light — accurate and respectful.",
    dark: darkBase({
      bg: "#0e1f17", bgAlt: "#17301f", surface: "#122819", surfaceRaised: "#1a3826",
      border: "#2d5236", text: "#fff8e6", textMuted: "#a8c4a8",
      primary: "#3fbf7f", primaryHover: "#62d89b", primaryFg: "#03170b",
      accent: "#f2c14e", accentFg: "#241a02",
      link: "#9fe8bd", focusRing: "#3fbf7f",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(110% 44% at 50% -12%, rgba(63,191,127,0.14), transparent 52%)," +
        "linear-gradient(180deg, rgba(242,193,78,0.05), transparent 22%)," +
        "radial-gradient(85% 30% at 50% 114%, rgba(14,31,23,0.98) 0%, transparent 60%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#fbfff5", bgAlt: "#eef7e6", surface: "#ffffff", border: "#ddeccd",
      text: "#152314", textMuted: "#4d6b48",
      primary: "#1d7a4a", primaryHover: "#196a41", primaryFg: "#f0fdf4",
      accent: "#b45309", accentFg: "#fffbeb", link: "#196a41", focusRing: "#1d7a4a",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(105% 42% at 50% -10%, rgba(29,122,74,0.09), transparent 54%)," +
        "linear-gradient(180deg, rgba(180,83,9,0.04), transparent 20%)",
    }),
    decor: [
      { kind: "glyphs", count: 12, glyphs: ["✿", "❀", "✾"], anim: "fall", duration: [16, 30], size: [0.6, 1.2], colors: ["#ffd9ec", "#fff8e6", "#b9f0cd"], opacity: [0.16, 0.32] },
      {
        kind: "bokeh", count: 10, colors: ["#3fbf7f", "#f2c14e"], anim: "rise",
        blur: [2, 8], size: [4, 13], duration: [18, 34], opacity: [0.06, 0.15],
      },
    ],
  },

  /* extra: winter-frost — migration target for the pre-rebuild "frosty" theme */
  {
    id: "winter-frost",
    name: "Winter Frost",
    description: "Aurora shimmer, hanging icicles and slow powder snow.",
    category: "holiday",
    seasonal: { from: [12, 1], to: [1, 31], note: "Deep-winter frost — aurora and powder snow." },
    inspiration:
      "Frosted winter nights: cyan aurora over black-blue ice, icicle light under the header, powder-snow drift. This is also the new home of the old 'frosty' theme.",
    dark: darkBase({
      bg: "#081019", bgAlt: "#0e1c2b", surface: "#0b1622", surfaceRaised: "#122234",
      border: "#22405a", text: "#ecfaff", textMuted: "#9cc0d8",
      primary: "#67e8f9", primaryHover: "#a5f3fc", primaryFg: "#03191e",
      accent: "#e0f2fe", accentFg: "#0a1a24",
      link: "#b5e3f5", focusRing: "#67e8f9",
      bgImage:
        "radial-gradient(120% 44% at 24% -10%, rgba(103,232,249,0.13), transparent 52%)," +
        "radial-gradient(100% 38% at 76% -6%, rgba(125,211,252,0.09), transparent 50%)," +
        "repeating-linear-gradient(102deg, rgba(224,242,254,0.03) 0 3px, transparent 3px 26px)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f4fbff", bgAlt: "#e3f3fb", surface: "#ffffff", border: "#d0e7f2",
      text: "#0b1a24", textMuted: "#46637a",
      primary: "#0e7490", primaryHover: "#0c657d", primaryFg: "#ecfeff",
      accent: "#0369a1", accentFg: "#f0f9ff", link: "#0c657d", focusRing: "#0e7490",
      bgImage:
        "radial-gradient(110% 42% at 24% -10%, rgba(14,116,144,0.09), transparent 54%)," +
        "repeating-linear-gradient(102deg, rgba(3,105,161,0.025) 0 3px, transparent 3px 26px)",
    }),
    decor: [
      {
        kind: "bokeh", count: 20, colors: ["#e0f2fe", "#cffafe", "#ffffff"], anim: "fall",
        blur: [1, 4], size: [3, 10], duration: [20, 36], opacity: [0.1, 0.22],
      },
      { kind: "glyphs", count: 13, glyphs: ["❄", "✧", "❆", "❈"], anim: "fall", duration: [12, 26], size: [0.6, 1.2], colors: ["#e0f2fe", "#a5f3fc"] },
    ],
    flourishCss: `
.glass { border-top-color: rgba(103, 232, 249, 0.24); }`,
  },
];
