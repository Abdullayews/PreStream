import type { ThemeDefinition, ThemePalette, ThemeStyle } from "../core/types";

/**
 * CATEGORY B — GRADIENT THEMES (8).
 * Full-atmosphere color fields: layered gradient backgrounds on the page,
 * frosted surfaces, and ambient motion. Backgrounds are edge-weighted and
 * dimmed in the content band so text contrast is preserved.
 */

const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

type Pal = ThemePalette & ThemeStyle;

const darkBase = (p: Partial<Pal>): Pal => ({
  bg: "#0d1220", bgAlt: "#151c2e", surface: "#111827", surfaceRaised: "#182136",
  border: "#27304a", text: "#eef2fa", textMuted: "#a6b2c8",
  primary: "#8fd3ff", primaryHover: "#b3e2ff", primaryFg: "#06131f",
  accent: "#7b61ff", accentFg: "#f4f2ff",
  success: "#4ade80", warning: "#fbbf24", danger: "#f87171",
  link: "#a9c8ff", focusRing: "#8fd3ff",
  shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
  shadowMd: "0 10px 32px rgba(0,0,0,0.42)",
  shadowLg: "0 26px 64px rgba(0,0,0,0.55)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "26px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0.03, animSpeed: 1,
  ...p,
});

const lightBase = (p: Partial<Pal>): Pal => ({
  bg: "#f7f9fc", bgAlt: "#edf1f8", surface: "#ffffff", surfaceRaised: "#ffffff",
  border: "#dbe3ef", text: "#131a28", textMuted: "#54607a",
  primary: "#2f5bd8", primaryHover: "#2549b8", primaryFg: "#f6f9ff",
  accent: "#7c3aed", accentFg: "#f5f3ff",
  success: "#15803d", warning: "#a16207", danger: "#b91c1c",
  link: "#2549b8", focusRing: "#2f5bd8",
  shadowSm: "0 1px 2px rgba(19,26,40,0.08)",
  shadowMd: "0 8px 28px rgba(19,26,40,0.12)",
  shadowLg: "0 22px 56px rgba(19,26,40,0.16)",
  radiusSm: "8px", radiusMd: "16px", radiusLg: "26px",
  fontHeading: SANS, fontBody: SANS, fontMono: MONO,
  noiseOpacity: 0, animSpeed: 1,
  ...p,
});

export const GRADIENT_THEMES: ThemeDefinition[] = [
  /* 9. aurora */
  {
    id: "aurora",
    name: "Aurora",
    description: "Flowing ribbon light-bands over a polar night sky with a drifting star field.",
    category: "gradient",
    inspiration:
      "Aurora borealis photography (green → violet curtains) — frosted-glass surfaces over deep teal night.",
    dark: darkBase({
      bg: "#0f2027", bgAlt: "#16303a", surface: "#12242e", surfaceRaised: "#172c38",
      border: "#26414d", text: "#f2fffa", textMuted: "#9fc3b8",
      primary: "#00f5a0", primaryHover: "#4ffcb8", primaryFg: "#02150d",
      accent: "#7b61ff", accentFg: "#12092b",
      link: "#7de8c0", focusRing: "#00f5a0",
      bgImage:
        "radial-gradient(120% 46% at 26% -8%, rgba(0,245,160,0.16), transparent 55%)," +
        "radial-gradient(110% 40% at 74% -4%, rgba(123,97,255,0.14), transparent 52%)," +
        "radial-gradient(90% 34% at 50% 116%, rgba(44,83,100,0.65), transparent 60%)",
      noiseOpacity: 0.035,
    }),
    light: lightBase({
      bg: "#f2fbf7", bgAlt: "#e4f4ec", surface: "#ffffff", border: "#d3e8dd",
      text: "#0c2018", textMuted: "#4c6a5c",
      primary: "#047857", primaryHover: "#065f46", primaryFg: "#ecfdf5",
      accent: "#6d28d9", accentFg: "#f5f3ff", link: "#065f46", focusRing: "#047857",
      bgImage:
        "radial-gradient(110% 42% at 24% -8%, rgba(4,120,87,0.10), transparent 56%)," +
        "radial-gradient(100% 38% at 76% -6%, rgba(109,40,217,0.08), transparent 52%)",
    }),
    decor: [
      { kind: "stars", count: 36, colors: ["#d9fff1", "#ffffff", "#b9c8ff"], shootingStarPerMin: 0.8 },
      { kind: "fog", tints: ["rgba(0, 245, 160, 0.05)", "rgba(123, 97, 255, 0.045)"], bands: 2 },
    ],
    flourishCss: `
.glass { border-top-color: rgba(0, 245, 160, 0.18); }`,
  },

  /* 10. sunset-horizon */
  {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    description: "Layered mountain silhouettes under a drifting magenta-to-amber sky.",
    category: "gradient",
    inspiration:
      "Dusk photography over ridge lines — plum sky, coral sun-glow, silhouetted horizon bands.",
    dark: darkBase({
      bg: "#1b1035", bgAlt: "#2a1642", surface: "#221338", surfaceRaised: "#2c1a47",
      border: "#3f2a5e", text: "#fff4ec", textMuted: "#c0a9c9",
      primary: "#ff6b6b", primaryHover: "#ff8f7d", primaryFg: "#2a0a06",
      accent: "#ffb86b", accentFg: "#2a1400",
      link: "#ffbfae", focusRing: "#ff6b6b",
      bgImage:
        "radial-gradient(95% 34% at 72% 108%, rgba(27,16,53,0.98) 0%, rgba(27,16,53,0.55) 40%, transparent 72%)," +
        "radial-gradient(70% 22% at 30% 104%, rgba(122,42,107,0.85) 0%, transparent 66%)," +
        "radial-gradient(90% 44% at 68% -6%, rgba(255,107,107,0.16), transparent 54%)," +
        "radial-gradient(70% 30% at 18% -2%, rgba(255,184,107,0.10), transparent 50%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#fdf5f2", bgAlt: "#f9e8e4", surface: "#ffffff", border: "#f0d9d2",
      text: "#2b1024", textMuted: "#75516a",
      primary: "#c2410c", primaryHover: "#9a3412", primaryFg: "#fff7ed",
      accent: "#be185d", accentFg: "#fdf2f8", link: "#9a3412", focusRing: "#c2410c",
      bgImage:
        "radial-gradient(100% 42% at 70% -8%, rgba(255,107,107,0.10), transparent 54%)," +
        "radial-gradient(70% 30% at 18% -4%, rgba(255,184,107,0.10), transparent 50%)",
    }),
    decor: [
      { kind: "fog", tints: ["rgba(255, 107, 107, 0.05)", "rgba(255, 184, 107, 0.045)"], bands: 2 },
    ],
    flourishCss: `
.glass { border-top-color: rgba(255, 184, 107, 0.20); }`,
  },

  /* 11. neon-cyber */
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    description: "Electric outlines, magenta-cyan glow pulses and light streaks on a violet night.",
    category: "gradient",
    inspiration:
      "Cyber neon signage — hot magenta + cyan rim light over ultraviolet; outlined components.",
    dark: darkBase({
      bg: "#0a0014", bgAlt: "#1c0b2e", surface: "#140824", surfaceRaised: "#1d0e33",
      border: "#3d1f66", text: "#f5f0ff", textMuted: "#a894c8",
      primary: "#f72585", primaryHover: "#ff5ca8", primaryFg: "#2b0212",
      accent: "#4cc9f0", accentFg: "#04141c",
      link: "#ff9ac4", focusRing: "#4cc9f0",
      radiusSm: "6px", radiusMd: "14px", radiusLg: "22px",
      bgImage:
        "radial-gradient(110% 44% at 82% -8%, rgba(247,37,133,0.16), transparent 52%)," +
        "radial-gradient(100% 42% at 12% -4%, rgba(76,201,240,0.12), transparent 50%)," +
        "repeating-linear-gradient(90deg, rgba(76,201,240,0.02) 0 2px, transparent 2px 90px)",
      noiseOpacity: 0.04,
    }),
    light: lightBase({
      bg: "#fdf4ff", bgAlt: "#f6e6fb", surface: "#ffffff", border: "#ecd8f2",
      text: "#20042e", textMuted: "#6a3b7e",
      primary: "#a21563", primaryHover: "#8d1155", primaryFg: "#fdf2f8",
      accent: "#0e7490", accentFg: "#ecfeff", link: "#8d1155", focusRing: "#a21563",
      radiusSm: "6px", radiusMd: "14px", radiusLg: "22px",
      bgImage:
        "radial-gradient(100% 42% at 80% -8%, rgba(247,37,133,0.09), transparent 52%)," +
        "radial-gradient(90% 38% at 14% -4%, rgba(76,201,240,0.08), transparent 50%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 10, colors: ["#f72585", "#4cc9f0", "#b5179e"], anim: "rise",
        blur: [2, 8], size: [3, 12], duration: [16, 30], opacity: [0.08, 0.18],
      },
    ],
    flourishCss: `
.glass { border-color: rgba(76, 201, 240, 0.28); box-shadow: 0 0 18px rgba(247, 37, 133, 0.10), 0 0 1px rgba(76, 201, 240, 0.5); }
.bg-primary { box-shadow: 0 0 24px rgba(247, 37, 133, 0.30); }
a:not([data-slot="button"]):hover { text-shadow: 0 0 12px rgba(76, 201, 240, 0.55); }`,
  },

  /* 12. deep-ocean */
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Abyssal teal depth layers with bioluminescent drift and light shafts.",
    category: "gradient",
    inspiration:
      "Deep-sea dive footage — midnight blue-green gradient bands, bioluminescent plankton, god rays.",
    dark: darkBase({
      bg: "#001219", bgAlt: "#00323d", surface: "#00262f", surfaceRaised: "#003441",
      border: "#0b4a56", text: "#eafbf7", textMuted: "#8fc4bb",
      primary: "#0a9396", primaryHover: "#22b8ba", primaryFg: "#031a16",
      accent: "#94d2bd", accentFg: "#031a16",
      link: "#6fd3c7", focusRing: "#0a9396",
      bgImage:
        "linear-gradient(180deg, rgba(0,95,115,0.35) 0%, rgba(0,18,25,0) 34%)," +
        "radial-gradient(80% 36% at 50% 118%, rgba(10,147,150,0.16), transparent 58%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#effcf9", bgAlt: "#dcf2ed", surface: "#ffffff", border: "#c8e6df",
      text: "#04211c", textMuted: "#40706a",
      primary: "#0a7d84", primaryHover: "#076a70", primaryFg: "#ecfdfd",
      accent: "#22577a", accentFg: "#eff8ff", link: "#076a70", focusRing: "#0a7d84",
      bgImage: "linear-gradient(180deg, rgba(2,132,199,0.06) 0%, transparent 30%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 14, colors: ["#94d2bd", "#0a9396", "#c7f9ec"], anim: "rise",
        blur: [2, 8], size: [3, 12], duration: [20, 40], opacity: [0.06, 0.15],
      },
      { kind: "rays", tint: "rgba(148, 210, 189, 0.05)" },
    ],
  },

  /* 13. cotton-candy */
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    description: "Pastel clouds, pill-soft components and a gentle floating dream.",
    category: "gradient",
    inspiration:
      "Fairground cotton candy + pastel dreamscapes — light by nature; the dark variant is a 'night carnival'.",
    dark: darkBase({
      bg: "#241a33", bgAlt: "#332547", surface: "#2b1f3d", surfaceRaised: "#3a2a52",
      border: "#4d3a6b", text: "#f6f0ff", textMuted: "#c2b1d9",
      primary: "#e8a7f3", primaryHover: "#f3c2fa", primaryFg: "#2b0a33",
      accent: "#a5e7ff", accentFg: "#0a2333",
      link: "#e8a7f3", focusRing: "#e8a7f3",
      radiusSm: "12px", radiusMd: "22px", radiusLg: "32px",
      bgImage:
        "radial-gradient(90% 40% at 18% -8%, rgba(232,167,243,0.16), transparent 55%)," +
        "radial-gradient(85% 38% at 82% -6%, rgba(165,231,255,0.13), transparent 52%)," +
        "radial-gradient(80% 34% at 50% 116%, rgba(199,184,255,0.12), transparent 56%)",
      noiseOpacity: 0.02,
    }),
    light: lightBase({
      bg: "#ffd1f0", bgAlt: "#f3e9fb", surface: "#ffffff", surfaceRaised: "#ffffff",
      border: "#f0c4e4", text: "#2b2340", textMuted: "#6b5a85",
      primary: "#a83392", primaryHover: "#91287e", primaryFg: "#fdf2fb",
      accent: "#d97706", accentFg: "#241300",
      success: "#15803d", warning: "#b45309", danger: "#be123c",
      link: "#91287e", focusRing: "#a83392",
      radiusSm: "12px", radiusMd: "22px", radiusLg: "32px",
      shadowSm: "0 2px 4px rgba(168, 51, 146, 0.08)",
      shadowMd: "0 10px 30px rgba(168, 51, 146, 0.12)",
      shadowLg: "0 24px 56px rgba(168, 51, 146, 0.16)",
      bgImage:
        "radial-gradient(85% 36% at 14% -6%, rgba(255, 255, 255, 0.55), transparent 58%)," +
        "radial-gradient(80% 34% at 86% -4%, rgba(165, 231, 255, 0.42), transparent 55%)," +
        "radial-gradient(75% 32% at 50% 114%, rgba(199, 184, 255, 0.34), transparent 56%)",
    }),
    decor: [
      { kind: "fog", tints: ["rgba(255, 255, 255, 0.10)", "rgba(199, 184, 255, 0.08)"], bands: 2 },
    ],
    flourishCss: `
h1, h2, h3 { font-weight: 700; }`,
  },

  /* 14. lava-flow */
  {
    id: "lava-flow",
    name: "Lava Flow",
    description: "Cracked-rock borders, molten gradient motion and rising embers.",
    category: "gradient",
    inspiration:
      "Volcanic eruption photography — basalt black, magma orange, cooling-yellow crust patterns.",
    dark: darkBase({
      bg: "#1a0500", bgAlt: "#2b0c00", surface: "#220800", surfaceRaised: "#331000",
      border: "#5c2408", text: "#fff1e0", textMuted: "#d3a683",
      primary: "#ff4d00", primaryHover: "#ff7033", primaryFg: "#210600",
      accent: "#ffc300", accentFg: "#2b1a00",
      link: "#ffb27d", focusRing: "#ff4d00",
      bgImage:
        "radial-gradient(110% 46% at 50% 112%, rgba(255,77,0,0.20), transparent 52%)," +
        "radial-gradient(90% 38% at 16% -8%, rgba(255,195,0,0.08), transparent 50%)," +
        "repeating-linear-gradient(76deg, rgba(92,36,8,0.16) 0 2px, transparent 2px 14px)",
      noiseOpacity: 0.045,
    }),
    light: lightBase({
      bg: "#fff6ee", bgAlt: "#fde8d6", surface: "#ffffff", border: "#f4d7bd",
      text: "#2b1104", textMuted: "#7c5436",
      primary: "#c2410c", primaryHover: "#9a3412", primaryFg: "#fff7ed",
      accent: "#b45309", accentFg: "#fffbeb", link: "#9a3412", focusRing: "#c2410c",
      bgImage:
        "radial-gradient(100% 44% at 50% 114%, rgba(255,77,0,0.09), transparent 52%)," +
        "radial-gradient(80% 34% at 16% -6%, rgba(255,195,0,0.08), transparent 52%)",
    }),
    decor: [
      {
        kind: "bokeh", count: 13, colors: ["#ff4d00", "#ffc300", "#ff8f3d"], anim: "rise",
        blur: [2, 9], size: [3, 10], duration: [14, 28], opacity: [0.08, 0.2],
      },
    ],
    flourishCss: `
.glass { border-bottom-color: rgba(255, 77, 0, 0.22); }`,
  },

  /* 15. northern-mist */
  {
    id: "northern-mist",
    name: "Northern Mist",
    description: "Cold fjord night: drifting fog bands, pine silhouettes and a pale teal glow.",
    category: "gradient",
    inspiration:
      "Nordic fjords at dusk — deep blue-green tones, mist banks, distant tree lines.",
    dark: darkBase({
      bg: "#0b132b", bgAlt: "#1c2541", surface: "#111a35", surfaceRaised: "#17224a",
      border: "#2a365c", text: "#eaf7f7", textMuted: "#9db1c4",
      primary: "#5bc0be", primaryHover: "#7fd3d1", primaryFg: "#04211f",
      accent: "#6ffcd9", accentFg: "#032419",
      link: "#a5d8d7", focusRing: "#5bc0be",
      bgImage:
        "radial-gradient(85% 30% at 22% 112%, rgba(11,19,43,0.98) 0%, transparent 62%)," +
        "radial-gradient(70% 24% at 74% 110%, rgba(11,19,43,0.95) 0%, transparent 60%)," +
        "radial-gradient(110% 42% at 50% -10%, rgba(58,80,107,0.45), transparent 58%)," +
        "linear-gradient(180deg, rgba(91,192,190,0.06), transparent 26%)",
      noiseOpacity: 0.03,
    }),
    light: lightBase({
      bg: "#f2f8f9", bgAlt: "#e3eef0", surface: "#ffffff", border: "#d0e0e4",
      text: "#0d1b2b", textMuted: "#4c6373",
      primary: "#1d6f6e", primaryHover: "#175e5d", primaryFg: "#effcfc",
      accent: "#3a506b", accentFg: "#eef4fa", link: "#175e5d", focusRing: "#1d6f6e",
      bgImage:
        "radial-gradient(90% 36% at 50% -10%, rgba(58,80,107,0.10), transparent 56%)," +
        "linear-gradient(180deg, rgba(91,192,190,0.05), transparent 24%)",
    }),
    decor: [{ kind: "fog", tints: ["rgba(91, 192, 190, 0.06)", "rgba(122, 159, 190, 0.05)"], bands: 3 }],
  },

  /* 16. mesh-prism */
  {
    id: "mesh-prism",
    name: "Mesh Prism",
    description: "Slowly morphing prismatic blobs behind clean light surfaces.",
    category: "gradient",
    inspiration:
      "Modern gradient-mesh landing pages — animated mesh in candy hues on airy surfaces.",
    dark: darkBase({
      bg: "#12102b", bgAlt: "#1d1a3e", surface: "#171438", surfaceRaised: "#201c4c",
      border: "#363063", text: "#f2f0ff", textMuted: "#a8a1d4",
      primary: "#7873f5", primaryHover: "#9793ff", primaryFg: "#0b091f",
      accent: "#ff6ec7", accentFg: "#2b0518",
      link: "#ff6ec7", focusRing: "#7873f5",
      bgImage:
        "radial-gradient(60% 34% at 12% 8%, rgba(255,110,199,0.13), transparent 55%)," +
        "radial-gradient(55% 30% at 88% 12%, rgba(74,222,222,0.11), transparent 52%)," +
        "radial-gradient(60% 32% at 78% 96%, rgba(255,211,110,0.09), transparent 54%)",
      noiseOpacity: 0.02,
    }),
    light: lightBase({
      bg: "#f7f5ff", bgAlt: "#eae6fb", surface: "#ffffff", surfaceRaised: "#ffffff",
      border: "#e0d9f2", text: "#12102b", textMuted: "#544c7e",
      primary: "#5b4dc4", primaryHover: "#4c3fae", primaryFg: "#f6f5ff",
      accent: "#c2255c", accentFg: "#fff5f8",
      link: "#5b4dc4", focusRing: "#5b4dc4",
      bgImage:
        "radial-gradient(58% 32% at 12% 6%, rgba(255,110,199,0.14), transparent 55%)," +
        "radial-gradient(54% 30% at 88% 10%, rgba(74,222,222,0.13), transparent 52%)," +
        "radial-gradient(58% 32% at 78% 98%, rgba(255,211,110,0.13), transparent 54%)",
    }),
    decor: [
      { kind: "mesh", colors: ["#ff6ec7", "#7873f5", "#4dedde", "#ffd36e"], blobs: 4 },
    ],
    flourishCss: `
h1, h2, h3 { font-weight: 700; letter-spacing: -0.015em; }`,
  },
];
