import type { ThemeDefinition } from "../core/types";

/**
 * Neutral default — the "no theme applied" baseline look (Shiopa-inspired
 * monochrome). Mirrors the :root / .dark tokens in globals.css exactly, so
 * `data-theme="neutral"` ≡ no theme at all. The site must always work with
 * ONLY this theme present (Phase 2 gate).
 */
export const neutral: ThemeDefinition = {
  id: "neutral",
  name: "Monochrome",
  description: "The default — pure black & white, contrast as the accent.",
  category: "base",
  inspiration:
    "Shiopa.com (original site reference) — monochrome oklch scale, glass surfaces, white primary buttons.",
  dark: {
    bg: "#101012",
    bgAlt: "#1b1b1f",
    surface: "#191a1d",
    surfaceRaised: "#191a1d",
    border: "#33343a",
    text: "#f2f2f2",
    textMuted: "#a6a6a6",
    primary: "#f2f2f2",
    primaryHover: "#ffffff",
    primaryFg: "#101012",
    accent: "#f2f2f2",
    accentFg: "#101012",
    success: "#4ade80",
    warning: "#facc15",
    danger: "#f87171",
    link: "#e8e8e8",
    focusRing: "#c4c4c8",
    shadowSm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    shadowMd: "0 8px 32px rgba(0, 0, 0, 0.28)",
    shadowLg: "0 24px 64px rgba(0, 0, 0, 0.45)",
    radiusSm: "8px",
    radiusMd: "16px",
    radiusLg: "24px",
    fontHeading:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontBody:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    noiseOpacity: 0,
    animSpeed: 1,
  },
  light: {
    bg: "#fafafa",
    bgAlt: "#f2f2f3",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    border: "#dcdcdf",
    text: "#1c1c20",
    textMuted: "#6e6e75",
    primary: "#1c1c20",
    primaryHover: "#000000",
    primaryFg: "#fafafa",
    accent: "#1c1c20",
    accentFg: "#fafafa",
    success: "#15803d",
    warning: "#a16207",
    danger: "#b91c1c",
    link: "#1c1c20",
    focusRing: "#4b4b52",
    shadowSm: "0 1px 2px rgba(0, 0, 0, 0.08)",
    shadowMd: "0 8px 32px rgba(0, 0, 0, 0.12)",
    shadowLg: "0 24px 64px rgba(0, 0, 0, 0.16)",
    radiusSm: "8px",
    radiusMd: "16px",
    radiusLg: "24px",
    fontHeading:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontBody:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    noiseOpacity: 0,
    animSpeed: 1,
  },
};
