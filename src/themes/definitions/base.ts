import type { ThemeDefinition, ThemePalette, ThemeStyle } from "../core/types";

/**
 * CATEGORY A — BASE COLOR THEMES (8).
 * Each has its own palette, typography pairing, texture, border/shadow
 * language and motifs; layered backgrounds are authored dim and
 * edge-weighted so centered text never sits on busy imagery.
 */

const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

type Pal = ThemePalette & ThemeStyle;

const darkBase = (p: Partial<Pal>): Pal => ({
  bg: "#0a0a0c", bgAlt: "#16161a", surface: "#121216", surfaceRaised: "#18181d",
  border: "#26262c", text: "#ececf2", textMuted: "#a4a4b0",
  primary: "#e8e8f0", primaryHover: "#ffffff", primaryFg: "#101014",
  accent: "#e8e8f0", accentFg: "#101014",
  success: "#4ade80", warning: "#fbbf24", danger: "#f87171",
  link: "#d6d6e2", focusRing: "#b0b0bc",
  shadowSm: "0 1px 2px rgba(0,0,0,0.45)",
  shadowMd: "0 8px 28px rgba(0,0,0,0.35)",
  shadowLg: "0 24px 60px rgba(0,0,0,0.5)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0, animSpeed: 1,
  ...p,
});

const lightBase = (p: Partial<Pal>): Pal => ({
  bg: "#fafafc", bgAlt: "#f0f1f4", surface: "#ffffff", surfaceRaised: "#ffffff",
  border: "#dcdce2", text: "#16161c", textMuted: "#5c5c68",
  primary: "#17171d", primaryHover: "#000000", primaryFg: "#fafafa",
  accent: "#17171d", accentFg: "#fafafa",
  success: "#15803d", warning: "#a16207", danger: "#b91c1c",
  link: "#17171d", focusRing: "#52525c",
  shadowSm: "0 1px 2px rgba(0,0,0,0.08)",
  shadowMd: "0 8px 28px rgba(0,0,0,0.12)",
  shadowLg: "0 24px 60px rgba(0,0,0,0.16)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0, animSpeed: 1,
  ...p,
});

/* ------------------------------------------------------------------ */

export const BASE_THEMES: ThemeDefinition[] = [
  /* 1. midnight-black */
  {
    id: "midnight-black",
    name: "Midnight Black",
    description: "True OLED black, hairline grid, faint star-dust and soft inner glows.",
    category: "base",
    inspiration:
      "OLED-friendly dark UIs (Apple Pro Display / Linear-like) — pure #000 canvas, periwinkle actions, hairline 1px grid texture.",
    dark: darkBase({
      bg: "#000000", bgAlt: "#0d0d12", surface: "#0b0b0f", surfaceRaised: "#121218",
      border: "#23232b", text: "#e8e8f0", textMuted: "#a7a7b5",
      primary: "#7c9cff", primaryHover: "#9db6ff", primaryFg: "#06081c",
      accent: "#ffb86b", accentFg: "#241300",
      link: "#aebfff", focusRing: "#7c9cff",
      bgImage:
        "radial-gradient(1100px 520px at 85% -12%, rgba(124,156,255,0.10), transparent 62%)," +
        "repeating-linear-gradient(180deg, rgba(232,232,240,0.028) 0 1px, transparent 1px 56px)," +
        "repeating-linear-gradient(90deg, rgba(232,232,240,0.028) 0 1px, transparent 1px 56px)",
      noiseOpacity: 0.03, animSpeed: 1.2,
    }),
    light: lightBase({
      bg: "#fafafc", bgAlt: "#f0f1f6", surface: "#ffffff", border: "#dbdce6",
      text: "#101018", textMuted: "#5b5b68",
      primary: "#4055d6", primaryHover: "#3244b8", primaryFg: "#f5f7ff",
      accent: "#d97706", accentFg: "#1d0e00", link: "#3244b8", focusRing: "#4055d6",
      bgImage: "radial-gradient(900px 420px at 88% -10%, rgba(64,85,214,0.07), transparent 60%)",
    }),
    decor: [
      { kind: "stars", count: 42, colors: ["#c9d8ff", "#ffffff", "#8fa8ff"], shootingStarPerMin: 1.2 },
    ],
    flourishCss: `
.bg-primary, [data-slot="button"] > .bg-primary {
  box-shadow: 0 0 22px rgba(124, 156, 255, 0.22), 0 0 1px rgba(124, 156, 255, 0.6);
}
h1, h2, h3 { letter-spacing: -0.015em; }`,
  },

  /* 2. pure-light */
  {
    id: "pure-light",
    name: "Pure Light",
    description: "Crisp paper-white surfaces, thin dividers, generous spacing and soft elevation.",
    category: "base",
    inspiration:
      "Notion/Linear light modes — bright canvas, one confident blue action color, elevation instead of borders.",
    dark: darkBase({
      bg: "#0e1116", bgAlt: "#151a21", surface: "#12161d", surfaceRaised: "#171c24",
      border: "#232a35", text: "#f0f4f8", textMuted: "#9db0c2",
      primary: "#3b82f6", primaryHover: "#60a5fa", primaryFg: "#06131f",
      accent: "#f59e0b", accentFg: "#241603", link: "#7fb0f8", focusRing: "#3b82f6",
      bgImage: "radial-gradient(1000px 460px at 80% -12%, rgba(59,130,246,0.09), transparent 60%)",
    }),
    light: lightBase({
      bg: "#ffffff", bgAlt: "#f6f7f9", surface: "#ffffff", border: "#e5e7eb",
      text: "#111827", textMuted: "#4b5563",
      primary: "#2563eb", primaryHover: "#1d4ed8", primaryFg: "#ffffff",
      accent: "#d97706", accentFg: "#241300",
      success: "#15803d", warning: "#b45309", danger: "#b91c1c",
      link: "#1d4ed8", focusRing: "#2563eb",
      shadowSm: "0 1px 2px rgba(17,24,39,0.06)",
      shadowMd: "0 6px 24px rgba(17,24,39,0.08)",
      shadowLg: "0 20px 48px rgba(17,24,39,0.12)",
      bgImage: "radial-gradient(820px 400px at 108% -8%, rgba(37,99,235,0.055), transparent 58%)",
    }),
    flourishCss: `
h1, h2, h3 { letter-spacing: -0.01em; }`,
  },

  /* 3. ocean-blue */
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Deep-sea navy with caustic light rings, drifting bubbles and rounded type.",
    category: "base",
    inspiration:
      "Underwater photography (caustic light patterns) + coral-reef teal/cyan accents on abyssal navy.",
    dark: darkBase({
      bg: "#06182b", bgAlt: "#0c2a47", surface: "#0a2038", surfaceRaised: "#102b49",
      border: "#1e3d5c", text: "#e6f4ff", textMuted: "#9cc0dc",
      primary: "#1fa2ff", primaryHover: "#66bcff", primaryFg: "#041a2e",
      accent: "#7df9e6", accentFg: "#032620",
      link: "#7fc4ff", focusRing: "#1fa2ff",
      radiusSm: "10px", radiusMd: "20px", radiusLg: "28px",
      bgImage:
        "radial-gradient(120% 55% at 50% 120%, rgba(125,249,230,0.09), transparent 58%)," +
        "repeating-radial-gradient(circle at 118% 26%, transparent 0 44px, rgba(31,162,255,0.03) 44px 46px)," +
        "repeating-radial-gradient(circle at -18% 78%, transparent 0 52px, rgba(125,249,230,0.022) 52px 54px)",
      noiseOpacity: 0.02,
    }),
    light: lightBase({
      bg: "#f0f7ff", bgAlt: "#e1eefa", surface: "#ffffff", border: "#c9dcef",
      text: "#0a2239", textMuted: "#4a6785",
      primary: "#0369a1", primaryHover: "#075985", primaryFg: "#f0f9ff",
      accent: "#14b8a6", accentFg: "#022c26", link: "#075985", focusRing: "#0369a1",
      radiusSm: "10px", radiusMd: "20px", radiusLg: "28px",
      bgImage: "radial-gradient(110% 50% at 50% 118%, rgba(13,148,136,0.10), transparent 55%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 12, colors: ["#7df9e6", "#66bcff", "#bfeaff"], anim: "rise",
        blur: [2, 7], size: [5, 16], duration: [18, 34], opacity: [0.07, 0.16],
      },
      { kind: "rays", tint: "rgba(125, 249, 230, 0.05)" },
    ],
    flourishCss: `
h1, h2, h3 { font-weight: 650; }`,
  },

  /* 4. forest-green */
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Warm serif headings, layered treeline silhouettes and drifting light motes.",
    category: "base",
    inspiration:
      "Pacific-Northwest forests — canopy greens with a warm ochre accent, serif typography echoing field guides.",
    dark: darkBase({
      bg: "#0b1a12", bgAlt: "#12281b", surface: "#0f2016", surfaceRaised: "#16291c",
      border: "#23402c", text: "#e8f5ec", textMuted: "#a3c4ad",
      primary: "#3ddc84", primaryHover: "#6fe8a4", primaryFg: "#04230f",
      accent: "#d9b26f", accentFg: "#241a06",
      link: "#7fe3ac", focusRing: "#3ddc84",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(90% 34% at 50% 114%, rgba(18,40,27,0.95) 0%, rgba(11,26,18,0.4) 34%, transparent 70%)," +
        "radial-gradient(60% 22% at 12% 108%, rgba(15,32,22,0.9) 0%, transparent 64%)," +
        "radial-gradient(70% 26% at 88% 112%, rgba(15,32,22,0.9) 0%, transparent 62%)," +
        "linear-gradient(180deg, rgba(217,178,111,0.05), transparent 22%)",
      noiseOpacity: 0.035,
    }),
    light: lightBase({
      bg: "#f2f8f2", bgAlt: "#e4efe4", surface: "#ffffff", border: "#d3e4d3",
      text: "#122418", textMuted: "#4f6b55",
      primary: "#15803d", primaryHover: "#166534", primaryFg: "#f0fdf4",
      accent: "#b45309", accentFg: "#fffbeb", link: "#166534", focusRing: "#15803d",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(90% 30% at 50% 116%, rgba(21,128,61,0.12) 0%, transparent 62%)," +
        "linear-gradient(180deg, rgba(180,83,9,0.04), transparent 20%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 10, colors: ["#d9b26f", "#3ddc84", "#e8f5ec"], anim: "rise",
        blur: [3, 9], size: [4, 13], duration: [22, 40], opacity: [0.05, 0.12],
      },
      { kind: "rays", tint: "rgba(217, 178, 111, 0.045)" },
    ],
  },

  /* 5. crimson-red */
  {
    id: "crimson-red",
    name: "Crimson Red",
    description: "Velvet cinema reds, thin gold accents, bold display serif headings.",
    category: "base",
    inspiration:
      "Old theatre interiors — crimson velvet curtains with gilded trim; high-contrast Didot-style headings.",
    dark: darkBase({
      bg: "#14070a", bgAlt: "#230b10", surface: "#1b0a0e", surfaceRaised: "#261016",
      border: "#452028", text: "#fdecef", textMuted: "#d3a3ac",
      primary: "#d1153f", primaryHover: "#f43f5e", primaryFg: "#fff5f6",
      accent: "#f5c16c", accentFg: "#2a1b04",
      link: "#ff8fa6", focusRing: "#e11d48",
      fontHeading: "'Didot', 'Bodoni MT', 'Playfair Display', Georgia, serif",
      bgImage:
        "radial-gradient(130% 60% at 50% -18%, rgba(225,29,72,0.14), transparent 52%)," +
        "radial-gradient(90% 40% at 50% 118%, rgba(0,0,0,0.7), transparent 62%)," +
        "linear-gradient(180deg, rgba(245,193,108,0.05), transparent 3%)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#fdf5f6", bgAlt: "#f7e9ec", surface: "#ffffff", border: "#f0d3d8",
      text: "#22090e", textMuted: "#7a4650",
      primary: "#be123c", primaryHover: "#9f1239", primaryFg: "#fff5f6",
      accent: "#92400e", accentFg: "#fffaeb", link: "#9f1239", focusRing: "#be123c",
      fontHeading: "'Didot', 'Bodoni MT', 'Playfair Display', Georgia, serif",
      bgImage: "radial-gradient(110% 50% at 50% -16%, rgba(190,18,60,0.07), transparent 54%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 10, colors: ["#f5c16c", "#f43f5e", "#ff8fa6"], anim: "rise",
        blur: [3, 10], size: [3, 11], duration: [20, 38], opacity: [0.06, 0.14],
      },
    ],
    flourishCss: `
h1, h2, h3 { letter-spacing: 0.01em; }
.glass { border-top-color: rgba(245, 193, 108, 0.25); }`,
  },

  /* 6. royal-purple */
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Damask-inspired patterns, crystal facets and a shimmer sweep across cards.",
    category: "base",
    inspiration:
      "Regal interiors — damask wallpaper at low opacity, amethyst primary, pink-champagne accent.",
    dark: darkBase({
      bg: "#100a1f", bgAlt: "#1a1233", surface: "#150e29", surfaceRaised: "#1d1438",
      border: "#35275b", text: "#f1ecff", textMuted: "#b4a5d9",
      primary: "#a78bfa", primaryHover: "#c4b5fd", primaryFg: "#150826",
      accent: "#f0abfc", accentFg: "#26073a",
      link: "#c4b5fd", focusRing: "#a78bfa",
      fontHeading: SERIF,
      bgImage:
        "repeating-radial-gradient(circle at 24% 20%, transparent 0 90px, rgba(167,139,250,0.045) 90px 92px)," +
        "repeating-radial-gradient(circle at 76% 82%, transparent 0 110px, rgba(240,171,252,0.028) 110px 112px)," +
        "radial-gradient(1000px 480px at 82% -14%, rgba(167,139,250,0.10), transparent 58%)",
      noiseOpacity: 0.025,
    }),
    light: lightBase({
      bg: "#f7f4fe", bgAlt: "#efe9fc", surface: "#ffffff", border: "#e4dcf5",
      text: "#1a0f2e", textMuted: "#5c4a7a",
      primary: "#6d28d9", primaryHover: "#5b21b6", primaryFg: "#f5f3ff",
      accent: "#a21caf", accentFg: "#fdf4ff", link: "#5b21b6", focusRing: "#6d28d9",
      fontHeading: SERIF,
      bgImage: "repeating-radial-gradient(circle at 22% 16%, transparent 0 110px, rgba(109,40,217,0.035) 110px 112px)",
    }),
    decor: [
      {
        kind: "glyphs", count: 9, glyphs: ["✦", "✧", "❖"], anim: "rise",
        duration: [26, 46], size: [0.5, 1.0], colors: ["#f0abfc", "#a78bfa", "#ffffff"],
        opacity: [0.05, 0.13],
      },
    ],
    flourishCss: `
.glass, .bg-card { position: relative; overflow: hidden; }
.glass::before, .bg-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(240, 171, 252, 0.05) 46%, rgba(196, 181, 253, 0.10) 50%, rgba(240, 171, 252, 0.05) 54%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.9s ease;
}
.glass:hover::before, .bg-card:hover::before { transform: translateX(120%); }
h1, h2, h3 { letter-spacing: 0.005em; }`,
  },

  /* 7. amber-gold */
  {
    id: "amber-gold",
    name: "Amber Gold",
    description: "Brushed-metal gradients, embossed dividers and a slow light glint.",
    category: "base",
    inspiration:
      "Art-deco brass hardware — brushed gold surfaces, filigree hairlines, candle-warm base tones.",
    dark: darkBase({
      bg: "#17110a", bgAlt: "#241a0e", surface: "#1d1509", surfaceRaised: "#291d0f",
      border: "#4a371c", text: "#fff7e0", textMuted: "#cbb98d",
      primary: "#f59e0b", primaryHover: "#fbbf24", primaryFg: "#221503",
      accent: "#fde68a", accentFg: "#241d06",
      link: "#fbd38d", focusRing: "#f59e0b",
      fontHeading: "'Georgia', 'Times New Roman', serif",
      bgImage:
        "repeating-linear-gradient(100deg, rgba(253,230,138,0.028) 0 2px, transparent 2px 9px)," +
        "radial-gradient(1000px 460px at 78% -12%, rgba(245,158,11,0.12), transparent 56%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#fffbf0", bgAlt: "#f7efdc", surface: "#ffffff", border: "#ede0c4",
      text: "#241a06", textMuted: "#6e5a2e",
      primary: "#b45309", primaryHover: "#92400e", primaryFg: "#fffbeb",
      accent: "#92400e", accentFg: "#fffbeb", link: "#92400e", focusRing: "#b45309",
      fontHeading: "'Georgia', 'Times New Roman', serif",
      bgImage:
        "repeating-linear-gradient(100deg, rgba(180,83,9,0.022) 0 2px, transparent 2px 10px)," +
        "radial-gradient(900px 420px at 80% -10%, rgba(245,158,11,0.09), transparent 56%)",
    }),
    flourishCss: `
h1, h2, h3 {
  background: linear-gradient(180deg, #fde68a 0%, #f59e0b 55%, #b45309 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--text);
}
footer h3, [data-slot="dialog-title"], [data-slot="sheet-title"] {
  -webkit-text-fill-color: var(--text);
  background: none;
}`,
  },

  /* 8. slate-grey */
  {
    id: "slate-grey",
    name: "Slate Grey",
    description: "Concrete precision: technical sans, tabular figures, exact grid lines.",
    category: "base",
    inspiration:
      "Engineering blueprints / Vercel-style neutrality — graphite surfaces, exact 1px grids, restrained motion.",
    dark: darkBase({
      bg: "#14181d", bgAlt: "#1e242b", surface: "#191e24", surfaceRaised: "#20262e",
      border: "#313a45", text: "#e2e8f0", textMuted: "#9aa8b8",
      primary: "#94a3b8", primaryHover: "#b9c6d8", primaryFg: "#0d1217",
      accent: "#38bdf8", accentFg: "#031722",
      link: "#9db7ce", focusRing: "#38bdf8",
      radiusSm: "6px", radiusMd: "12px", radiusLg: "18px",
      bgImage:
        "repeating-linear-gradient(180deg, rgba(56,189,248,0.02) 0 1px, transparent 1px 44px)," +
        "repeating-linear-gradient(90deg, rgba(56,189,248,0.02) 0 1px, transparent 1px 44px)",
      animSpeed: 1.6,
    }),
    light: lightBase({
      bg: "#f4f6f8", bgAlt: "#eaedf1", surface: "#ffffff", border: "#dce2e9",
      text: "#14181d", textMuted: "#536273",
      primary: "#334155", primaryHover: "#1e293b", primaryFg: "#f8fafc",
      accent: "#0369a1", accentFg: "#f0f9ff", link: "#1e293b", focusRing: "#0284c7",
      radiusSm: "6px", radiusMd: "12px", radiusLg: "18px",
      bgImage:
        "repeating-linear-gradient(180deg, rgba(2,132,199,0.025) 0 1px, transparent 1px 44px)," +
        "repeating-linear-gradient(90deg, rgba(2,132,199,0.025) 0 1px, transparent 1px 44px)",
    }),
    flourishCss: `
body { font-variant-numeric: tabular-nums; }
h1, h2, h3 { text-transform: none; letter-spacing: -0.005em; }`,
  },
];
