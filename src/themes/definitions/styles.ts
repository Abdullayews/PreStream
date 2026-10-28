import type { ThemeDefinition, ThemePalette, ThemeStyle } from "../core/types";

/**
 * CATEGORY D — STYLE / AESTHETIC THEMES (10).
 * Distinct visual worlds. The high-contrast-accessible theme forgoes all
 * decoration by design (maximum legibility, WCAG AAA target).
 */

const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

type Pal = ThemePalette & ThemeStyle;

const darkBase = (p: Partial<Pal>): Pal => ({
  bg: "#0c0c14", bgAlt: "#16161f", surface: "#12121a", surfaceRaised: "#191924",
  border: "#282834", text: "#eeeef4", textMuted: "#a2a2b2",
  primary: "#d8d8e8", primaryHover: "#ffffff", primaryFg: "#101018",
  accent: "#d8d8e8", accentFg: "#101018",
  success: "#4ade80", warning: "#fbbf24", danger: "#f87171",
  link: "#c8c8dc", focusRing: "#b8b8cc",
  shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
  shadowMd: "0 10px 32px rgba(0,0,0,0.42)",
  shadowLg: "0 26px 64px rgba(0,0,0,0.55)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0.03, animSpeed: 1,
  ...p,
});

const lightBase = (p: Partial<Pal>): Pal => ({
  bg: "#f8f8fb", bgAlt: "#eeeef2", surface: "#ffffff", surfaceRaised: "#ffffff",
  border: "#dcdee6", text: "#14141c", textMuted: "#54546a",
  primary: "#1c1c28", primaryHover: "#000000", primaryFg: "#fafafa",
  accent: "#1c1c28", accentFg: "#fafafa",
  success: "#15803d", warning: "#a16207", danger: "#b91c1c",
  link: "#1c1c28", focusRing: "#4a4a5c",
  shadowSm: "0 1px 2px rgba(20,20,28,0.08)",
  shadowMd: "0 8px 28px rgba(20,20,28,0.12)",
  shadowLg: "0 22px 56px rgba(20,20,28,0.16)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "24px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0, animSpeed: 1,
  ...p,
});

export const STYLE_THEMES: ThemeDefinition[] = [
  /* 29. cyberpunk-city */
  {
    id: "cyberpunk-city",
    name: "Cyberpunk City",
    description: "Rain-slick neon skyline, holographic signage and angular panels.",
    category: "style",
    inspiration:
      "Cyberpunk 2077/Blade-Runner street scenes — rain streaks, holographic pink/cyan signage, hard angular chrome. Rain is reduced on low-power devices.",
    dark: darkBase({
      bg: "#080812", bgAlt: "#12122a", surface: "#0d0d1e", surfaceRaised: "#141432",
      border: "#2c2c55", text: "#f1f1f8", textMuted: "#9d9dc4",
      primary: "#ff2a6d", primaryHover: "#ff5c92", primaryFg: "#2b020e",
      accent: "#05d9e8", accentFg: "#021b1f",
      link: "#7de9f2", focusRing: "#05d9e8",
      radiusSm: "2px", radiusMd: "6px", radiusLg: "10px",
      bgImage:
        "radial-gradient(115% 46% at 78% -10%, rgba(255,42,109,0.17), transparent 52%)," +
        "radial-gradient(95% 40% at 14% -6%, rgba(5,217,232,0.12), transparent 50%)," +
        "repeating-linear-gradient(180deg, rgba(5,217,232,0.02) 0 1px, transparent 1px 22px)",
      noiseOpacity: 0.045,
    }),
    light: lightBase({
      bg: "#f7f4fb", bgAlt: "#eae4f4", surface: "#ffffff", border: "#ddd2ea",
      text: "#160a20", textMuted: "#5c4774",
      primary: "#bc1044", primaryHover: "#9d0e39", primaryFg: "#fff0f5",
      accent: "#0b7285", accentFg: "#e3fafc", link: "#9d0e39", focusRing: "#0b7285",
      radiusSm: "2px", radiusMd: "6px", radiusLg: "10px",
      bgImage:
        "radial-gradient(105% 42% at 78% -10%, rgba(188,16,68,0.09), transparent 52%)," +
        "radial-gradient(90% 38% at 14% -6%, rgba(11,114,133,0.08), transparent 50%)",
    }),
    decor: [
      { kind: "rain", tint: "rgba(5, 217, 232, 0.10)" },
    ],
    flourishCss: `
.glass { border-color: rgba(5, 217, 232, 0.24); box-shadow: 0 0 16px rgba(255, 42, 109, 0.10); }
h1, h2, h3 { text-transform: none; letter-spacing: 0.02em; }`,
  },

  /* 30. retro-synthwave */
  {
    id: "retro-synthwave",
    name: "Retro Synthwave",
    description: "Perspective grid horizon, striped sun and chrome headings.",
    category: "style",
    inspiration:
      "1980s synthwave/outrun album art — magenta-to-cyan gradient sun over an infinite perspective grid, CRT scanlines.",
    dark: darkBase({
      bg: "#1a0b2e", bgAlt: "#2a1048", surface: "#200d3a", surfaceRaised: "#2d1450",
      border: "#4b2380", text: "#f3e8ff", textMuted: "#b9a1d4",
      primary: "#ff3cac", primaryHover: "#ff6cc4", primaryFg: "#2b0518",
      accent: "#784ba0", accentFg: "#f6effc",
      link: "#ffe66d", focusRing: "#ff3cac",
      fontHeading: "'Eurostile', 'Bank Gothic', 'Avenir Next', 'Segoe UI', sans-serif",
      bgImage:
        "linear-gradient(180deg, #1a0b2e 0%, #2a1048 34%, rgba(26,11,46,0) 40%)," +
        "repeating-linear-gradient(180deg, rgba(120,75,160,0.10) 0 2px, transparent 2px 6px)," +
        "radial-gradient(60% 26% at 50% 108%, rgba(43,134,197,0.35), transparent 62%)," +
        "radial-gradient(46% 20% at 50% 104%, rgba(255,60,172,0.22), transparent 60%)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#fdf3fb", bgAlt: "#f6e3f4", surface: "#ffffff", border: "#ecd2ea",
      text: "#24082e", textMuted: "#6d3a78",
      primary: "#b01d74", primaryHover: "#931763", primaryFg: "#fdf2fa",
      accent: "#5b3fa8", accentFg: "#f3effc", link: "#931763", focusRing: "#b01d74",
      fontHeading: "'Eurostile', 'Bank Gothic', 'Avenir Next', 'Segoe UI', sans-serif",
      bgImage:
        "radial-gradient(60% 26% at 50% 108%, rgba(43,134,197,0.14), transparent 62%)," +
        "radial-gradient(46% 20% at 50% 104%, rgba(255,60,172,0.12), transparent 60%)",
    }),
    decor: [{ kind: "fog", tints: ["rgba(255, 60, 172, 0.05)", "rgba(43, 134, 197, 0.05)"], bands: 2 }],
    flourishCss: `
h1, h2, h3 {
  background: linear-gradient(180deg, #ffe66d 0%, #ff3cac 55%, #784ba0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
footer h3, [data-slot="dialog-title"], [data-slot="sheet-title"] {
  -webkit-text-fill-color: var(--text);
  background: none;
}
.glass { border-bottom-color: rgba(255, 60, 172, 0.24); }`,
  },

  /* 31. terminal-hacker */
  {
    id: "terminal-hacker",
    name: "Terminal Hacker",
    description: "Phosphor-green monospace, ASCII dividers and faint code rain.",
    category: "style",
    inspiration:
      "Classic CRT terminals (green phosphor) + The Matrix code rain — everything monospace, scanline shimmer kept extremely faint.",
    dark: darkBase({
      bg: "#000000", bgAlt: "#07110a", surface: "#04120a", surfaceRaised: "#081c10",
      border: "#123d22", text: "#c9ffd9", textMuted: "#5fae74",
      primary: "#00ff66", primaryHover: "#4dff9c", primaryFg: "#001a08",
      accent: "#ffb000", accentFg: "#241700",
      link: "#66ffa3", focusRing: "#00ff66",
      radiusSm: "0px", radiusMd: "2px", radiusLg: "4px",
      fontHeading: MONO, fontBody: MONO, fontMono: MONO,
      bgImage:
        "radial-gradient(100% 42% at 50% -10%, rgba(0,255,102,0.07), transparent 55%)," +
        "repeating-linear-gradient(180deg, rgba(0,255,102,0.015) 0 1px, transparent 1px 4px)",
      noiseOpacity: 0.05,
    }),
    light: lightBase({
      bg: "#f2f7f2", bgAlt: "#e4eee4", surface: "#fbfdfb", border: "#cddccd",
      text: "#0a1f10", textMuted: "#3f5c47",
      primary: "#047857", primaryHover: "#065f46", primaryFg: "#ecfdf5",
      accent: "#92400e", accentFg: "#fffbeb", link: "#065f46", focusRing: "#047857",
      radiusSm: "0px", radiusMd: "2px", radiusLg: "4px",
      fontHeading: MONO, fontBody: MONO, fontMono: MONO,
      bgImage: "repeating-linear-gradient(180deg, rgba(4,120,87,0.02) 0 1px, transparent 1px 4px)",
    }),
    decor: [
      { kind: "coderain", color: "#00ff66", columns: 14, glyphs: ["0", "1", ">", "$", "#", "λ", "01", "10"] },
    ],
    flourishCss: `
h1, h2, h3, body { font-family: var(--font-mono); }
h1, h2, h3::before { content: "> "; color: var(--text-muted); }
h1, h2, h3 { opacity: 1; }
.glass { border-color: rgba(0, 255, 102, 0.18); }
.bg-primary { box-shadow: 0 0 18px rgba(0, 255, 102, 0.25); }`,
  },

  /* 32. glassmorphism */
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Frosted glass panels floating over drifting prismatic blobs.",
    category: "style",
    inspiration:
      "Apple visionOS / glassmorphism design language — translucent panels, heavy backdrop blur, soft parallax color blobs behind the glass.",
    dark: darkBase({
      bg: "#0c0f2e", bgAlt: "#1a1742", surface: "rgba(22, 20, 56, 0.55)", surfaceRaised: "rgba(30, 27, 72, 0.62)",
      border: "rgba(255, 255, 255, 0.14)", text: "#f4f2ff", textMuted: "#b4afe0",
      primary: "#a68bff", primaryHover: "#c0a8ff", primaryFg: "#130b2e",
      accent: "#ff7ab8", accentFg: "#2b0817",
      link: "#c9b8ff", focusRing: "#a68bff",
      shadowMd: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
      bgImage:
        "radial-gradient(62% 38% at 12% 10%, rgba(91,124,250,0.20), transparent 55%)," +
        "radial-gradient(58% 34% at 88% 16%, rgba(162,91,250,0.18), transparent 52%)," +
        "radial-gradient(62% 36% at 76% 94%, rgba(250,91,158,0.15), transparent 54%)",
      noiseOpacity: 0.02,
    }),
    light: lightBase({
      bg: "#eef1ff", bgAlt: "#e2e6fb", surface: "rgba(255, 255, 255, 0.72)", surfaceRaised: "rgba(255, 255, 255, 0.8)",
      border: "rgba(91, 124, 250, 0.18)", text: "#161338", textMuted: "#4e4878",
      primary: "#5b5ce6", primaryHover: "#4a4bd0", primaryFg: "#f5f5ff",
      accent: "#d76a9f", accentFg: "#2b0a1c", link: "#4a4bd0", focusRing: "#5b5ce6",
      shadowMd: "0 12px 40px rgba(91, 124, 250, 0.16), inset 0 1px 0 rgba(255,255,255,0.7)",
      bgImage:
        "radial-gradient(58% 34% at 12% 8%, rgba(91,124,250,0.18), transparent 55%)," +
        "radial-gradient(54% 32% at 88% 14%, rgba(162,91,250,0.16), transparent 52%)," +
        "radial-gradient(58% 34% at 76% 96%, rgba(250,91,158,0.13), transparent 54%)",
    }),
    decor: [
      { kind: "mesh", colors: ["#5b7cfa", "#a25bfa", "#fa5b9e", "#5bcefa"], blobs: 4 },
    ],
    flourishCss: `
.glass {
  -webkit-backdrop-filter: blur(26px) saturate(180%);
  backdrop-filter: blur(26px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
h1, h2, h3 { letter-spacing: -0.01em; }`,
  },

  /* 33. neumorphism-soft */
  {
    id: "neumorphism-soft",
    name: "Neumorphism Soft",
    description: "Soft extruded surfaces, press-in buttons, gentle pastel light.",
    category: "style",
    inspiration:
      "Neumorphic design — same-color extruded/inset shadows on a soft putty background. Classic weakness (low contrast) deliberately fixed: text and focus rings are high-contrast.",
    dark: darkBase({
      bg: "#20242e", bgAlt: "#262b37", surface: "#20242e", surfaceRaised: "#262b37",
      border: "#2e3442", text: "#eef1f8", textMuted: "#9aa3b8",
      primary: "#8fa7ff", primaryHover: "#a7baff", primaryFg: "#0e1224",
      accent: "#ff9fb8", accentFg: "#2b0812",
      link: "#a7baff", focusRing: "#8fa7ff",
      shadowSm: "4px 4px 10px rgba(0,0,0,0.45), -4px -4px 10px rgba(255,255,255,0.03)",
      shadowMd: "10px 10px 24px rgba(0,0,0,0.5), -8px -8px 20px rgba(255,255,255,0.035)",
      shadowLg: "18px 18px 44px rgba(0,0,0,0.55), -12px -12px 32px rgba(255,255,255,0.04)",
      radiusSm: "12px", radiusMd: "20px", radiusLg: "28px",
      noiseOpacity: 0,
    }),
    light: lightBase({
      bg: "#e6eaf0", bgAlt: "#e6eaf0", surface: "#e6eaf0", surfaceRaised: "#eceff5",
      border: "#d3d9e3", text: "#2d3748", textMuted: "#55617a",
      primary: "#4a5ac4", primaryHover: "#4a5ac4", primaryFg: "#f5f7ff",
      accent: "#e0698e", accentFg: "#2b0812", link: "#4a5ac4", focusRing: "#5b6cd8",
      shadowSm: "5px 5px 12px rgba(163,177,198,0.6), -5px -5px 12px rgba(255,255,255,0.9)",
      shadowMd: "10px 10px 24px rgba(163,177,198,0.65), -10px -10px 24px rgba(255,255,255,0.95)",
      shadowLg: "18px 18px 40px rgba(163,177,198,0.7), -14px -14px 34px rgba(255,255,255,1)",
      radiusSm: "12px", radiusMd: "20px", radiusLg: "28px",
    }),
    flourishCss: `
.bg-card, .bg-popover { box-shadow: var(--shadow-sm); }
[data-slot="button"]:active:not(:disabled) { transform: scale(0.985); }
h1, h2, h3 { color: var(--text); }`,
  },

  /* 34. zen-minimal */
  {
    id: "zen-minimal",
    name: "Zen Minimal",
    description: "Washi paper texture, ink-brush strokes and generous quiet space.",
    category: "style",
    inspiration:
      "Japanese zen aesthetics — washi paper, sumi ink, enso circle accents, restrained typography (refined serif headings, light body).",
    dark: darkBase({
      bg: "#171614", bgAlt: "#21201c", surface: "#1c1b18", surfaceRaised: "#252420",
      border: "#37352e", text: "#edeae2", textMuted: "#a9a494",
      primary: "#e8e4d8", primaryHover: "#ffffff", primaryFg: "#1c1b16",
      accent: "#c96f5a", accentFg: "#2b0d06",
      link: "#d8cfc0", focusRing: "#c96f5a",
      radiusSm: "4px", radiusMd: "10px", radiusLg: "18px",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(52% 24% at 86% 10%, rgba(201,111,90,0.06), transparent 55%)," +
        "radial-gradient(46% 20% at 10% 92%, rgba(232,228,216,0.035), transparent 55%)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#f4f1ea", bgAlt: "#ece8de", surface: "#fbf9f4", border: "#ddd6c8",
      text: "#1f1f1f", textMuted: "#5c594e",
      primary: "#2f4f4f", primaryHover: "#243d3d", primaryFg: "#f4f1ea",
      accent: "#b5483a", accentFg: "#fdf5f2",
      link: "#243d3d", focusRing: "#b5483a",
      radiusSm: "4px", radiusMd: "10px", radiusLg: "18px",
      fontHeading: SERIF,
      bgImage:
        "radial-gradient(52% 24% at 86% 10%, rgba(181,72,58,0.05), transparent 55%)," +
        "radial-gradient(46% 20% at 10% 92%, rgba(47,79,79,0.04), transparent 55%)",
      noiseOpacity: 0.02,
    }),
    flourishCss: `
h1, h2, h3 { letter-spacing: 0.01em; font-weight: 500; }
.glass { border-radius: var(--radius-md); }`,
  },

  /* 35. space-galaxy */
  {
    id: "space-galaxy",
    name: "Space Galaxy",
    description: "Nebula layers, parallax star drift and the rare shooting star.",
    category: "style",
    inspiration:
      "Hubble deep-field photography — layered nebulae in violet/pink over near-black, dense star fields, orbit-line geometry.",
    dark: darkBase({
      bg: "#02030a", bgAlt: "#0a0d24", surface: "#070a1c", surfaceRaised: "#0d1130",
      border: "#232a52", text: "#eaeaff", textMuted: "#9c9cd0",
      primary: "#7c5cff", primaryHover: "#9b82ff", primaryFg: "#0c0620",
      accent: "#ff7ad9", accentFg: "#2b0321",
      link: "#b3a3ff", focusRing: "#7c5cff",
      bgImage:
        "radial-gradient(70% 40% at 18% 12%, rgba(124,92,255,0.14), transparent 55%)," +
        "radial-gradient(60% 34% at 84% 20%, rgba(255,122,217,0.10), transparent 52%)," +
        "radial-gradient(64% 36% at 62% 96%, rgba(56,130,246,0.09), transparent 54%)",
      noiseOpacity: 0.05,
    }),
    light: lightBase({
      bg: "#f5f4ff", bgAlt: "#e9e6fc", surface: "#ffffff", border: "#dbd5f4",
      text: "#120c2b", textMuted: "#514a7e",
      primary: "#5b3ec9", primaryHover: "#4c33ad", primaryFg: "#f5f3ff",
      accent: "#b52e9a", accentFg: "#fdf2fa", link: "#4c33ad", focusRing: "#5b3ec9",
      bgImage:
        "radial-gradient(64% 36% at 18% 10%, rgba(91,62,201,0.10), transparent 55%)," +
        "radial-gradient(56% 32% at 84% 18%, rgba(181,46,154,0.07), transparent 52%)",
    }),
    decor: [
      { kind: "stars", count: 64, colors: ["#ffffff", "#c9c2ff", "#ffc7ee", "#aee3ff"], shootingStarPerMin: 1.6 },
      { kind: "fog", tints: ["rgba(124, 92, 255, 0.05)", "rgba(255, 122, 217, 0.04)"], bands: 2 },
    ],
    flourishCss: `
.glass { border-top-color: rgba(124, 92, 255, 0.22); }`,
  },

  /* 36. vintage-paper */
  {
    id: "vintage-paper",
    name: "Vintage Paper",
    description: "Aged paper grain, ink stamps and ornate corner brackets.",
    category: "style",
    inspiration:
      "Antique ledgers and library books — foxed cream paper, iron-gall ink browns, typewriter accents, ornate corner rules.",
    dark: darkBase({
      bg: "#2b2318", bgAlt: "#3a2f1f", surface: "#312819", surfaceRaised: "#443723",
      border: "#5c4a2e", text: "#f3e9d2", textMuted: "#c2b091",
      primary: "#e0b352", primaryHover: "#ecc670", primaryFg: "#2b1f05",
      accent: "#b8860b", accentFg: "#1d1403",
      link: "#e0c48f", focusRing: "#e0b352",
      fontHeading: "'Book Antiqua', 'Palatino Linotype', Georgia, serif",
      fontBody: "'Book Antiqua', Georgia, serif",
      bgImage:
        "radial-gradient(85% 40% at 50% -10%, rgba(224,179,82,0.08), transparent 52%)," +
        "radial-gradient(120% 70% at 50% 50%, transparent 55%, rgba(43,35,24,0.55) 100%)," +
        "repeating-linear-gradient(92deg, rgba(92,74,46,0.05) 0 2px, transparent 2px 7px)",
      noiseOpacity: 0.06,
    }),
    light: lightBase({
      bg: "#f3e9d2", bgAlt: "#eaddc0", surface: "#fbf4e2", surfaceRaised: "#fdf8ec",
      border: "#d9c9a3", text: "#3b2a1a", textMuted: "#6e5a3a",
      primary: "#8b4513", primaryHover: "#73390f", primaryFg: "#fbf4e2",
      accent: "#a0522d", accentFg: "#fdf5ec",
      link: "#73390f", focusRing: "#8b4513",
      shadowSm: "0 1px 2px rgba(59,42,26,0.10)",
      shadowMd: "0 8px 26px rgba(59,42,26,0.14)",
      shadowLg: "0 20px 52px rgba(59,42,26,0.18)",
      fontHeading: "'Book Antiqua', 'Palatino Linotype', Georgia, serif",
      fontBody: "'Book Antiqua', Georgia, serif",
      bgImage:
        "radial-gradient(120% 70% at 50% 50%, transparent 55%, rgba(139,69,19,0.10) 100%)," +
        "repeating-linear-gradient(92deg, rgba(139,69,19,0.03) 0 2px, transparent 2px 7px)",
      noiseOpacity: 0.05,
    }),
    flourishCss: `
h1, h2, h3 { font-weight: 600; }
.glass { border-top-color: rgba(139, 69, 19, 0.22); }`,
  },

  /* 37. steampunk */
  {
    id: "steampunk",
    name: "Steampunk",
    description: "Brass pipes, riveted panels and slowly turning gears.",
    category: "style",
    inspiration:
      "Victorian steampunk machinery — brass/copper/bronze tones, riveted panel edges, exposed gears at the far corners (decorative only).",
    dark: darkBase({
      bg: "#1b130c", bgAlt: "#2a1e13", surface: "#221812", surfaceRaised: "#312317",
      border: "#54371c", text: "#f2e6cf", textMuted: "#c0a582",
      primary: "#d4af37", primaryHover: "#e5c455", primaryFg: "#241a02",
      accent: "#b87333", accentFg: "#201206",
      link: "#e0c48f", focusRing: "#d4af37",
      fontHeading: "'Playfair Display', 'Palatino Linotype', Georgia, serif",
      bgImage:
        "radial-gradient(95% 40% at 72% -8%, rgba(212,175,55,0.10), transparent 52%)," +
        "repeating-linear-gradient(180deg, rgba(184,115,51,0.05) 0 2px, transparent 2px 5px, rgba(0,0,0,0.05) 5px 6px, transparent 6px 22px)",
      noiseOpacity: 0.05,
    }),
    light: lightBase({
      bg: "#f2e8d8", bgAlt: "#e8d9c0", surface: "#faf3e6", border: "#d5c2a0",
      text: "#33230f", textMuted: "#6b5638",
      primary: "#8b5a19", primaryHover: "#744914", primaryFg: "#fbf3e2",
      accent: "#9c5312", accentFg: "#fef6ea",
      link: "#744914", focusRing: "#8b5a19",
      fontHeading: "'Playfair Display', 'Palatino Linotype', Georgia, serif",
      bgImage:
        "radial-gradient(90% 38% at 72% -8%, rgba(139,90,25,0.09), transparent 52%)," +
        "repeating-linear-gradient(180deg, rgba(156,83,18,0.03) 0 2px, transparent 2px 5px, rgba(0,0,0,0.03) 5px 6px, transparent 6px 22px)",
    }),
    decor: [
      { kind: "gears", tint: "#b87333", count: 3 },
    ],
    flourishCss: `
.glass { border-top-color: rgba(212, 175, 55, 0.28); }
h1, h2, h3 { letter-spacing: 0.015em; }`,
  },

  /* 38. high-contrast-accessible */
  {
    id: "high-contrast-accessible",
    name: "High Contrast (Accessible)",
    description: "Maximum legibility: pure black/white, thick borders, no motion, no decoration.",
    category: "style",
    inspiration:
      "WCAG AAA design guidance and OS high-contrast modes — pure black and white, yellow focus, thick outlines, zero decorative layers and zero motion (by design, not omission).",
    dark: darkBase({
      bg: "#000000", bgAlt: "#000000", surface: "#000000", surfaceRaised: "#0a0a0a",
      border: "#ffffff", text: "#ffffff", textMuted: "#ffffff",
      primary: "#ffff00", primaryHover: "#ffff66", primaryFg: "#000000",
      accent: "#00ffff", accentFg: "#000000",
      success: "#00ff00", warning: "#ffff00", danger: "#ff6b6b",
      link: "#00ffff", focusRing: "#ffff00",
      shadowSm: "none", shadowMd: "none", shadowLg: "none",
      radiusSm: "0px", radiusMd: "0px", radiusLg: "0px",
      noiseOpacity: 0, animSpeed: 1000,
    }),
    light: lightBase({
      bg: "#ffffff", bgAlt: "#ffffff", surface: "#ffffff", surfaceRaised: "#ffffff",
      border: "#000000", text: "#000000", textMuted: "#000000",
      primary: "#000000", primaryHover: "#1a1a1a", primaryFg: "#ffff00",
      accent: "#0000cc", accentFg: "#ffffff",
      success: "#006600", warning: "#664400", danger: "#990000",
      link: "#0000cc", focusRing: "#000000",
      shadowSm: "none", shadowMd: "none", shadowLg: "none",
      radiusSm: "0px", radiusMd: "0px", radiusLg: "0px",
      noiseOpacity: 0, animSpeed: 1000,
    }),
    decor: [],
    flourishCss: `
* { border-width: 2px !important; }
[data-slot="button"]:focus-visible, a:focus-visible, input:focus-visible, [tabindex]:focus-visible {
  outline: 4px solid var(--focus-ring) !important;
  outline-offset: 2px !important;
}
a { text-decoration: underline !important; }`,
  },
];
