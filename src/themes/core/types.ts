/**
 * Theme engine core — token types + safety constants.
 *
 * A theme is a pure data definition: the SAME token set for every theme,
 * in a dark variant and a light variant. Themes override tokens only —
 * they never restructure layout. All tokens are plain CSS color strings
 * (hex) so tooling (previews, contrast checks) can read them.
 *
 * The registry (../registry.ts) assembles definitions; a generator script
 * (scripts/gen-themes.ts) compiles them into src/themes/themes.generated.css
 * where each theme is a `html[data-theme="<id>"]` rule block — the single
 * application mechanism (attribute on the root element, flash-free).
 */

/* ------------------------------------------------------------------ */
/* Token sets                                                          */
/* ------------------------------------------------------------------ */

/** Colors every theme MUST define (per color scheme). */
export interface ThemePalette {
  /** Page base color. */
  bg: string;
  /** Slightly offset background (muted panels, secondary surfaces). */
  bgAlt: string;
  /** Card / panel surface. */
  surface: string;
  /** Raised surface (popovers, menus, dialogs). */
  surfaceRaised: string;
  /** Hairline border color. */
  border: string;
  /** Primary body text. */
  text: string;
  /** Secondary/muted text. */
  textMuted: string;
  /** Primary action color (buttons, active pills). */
  primary: string;
  /** Hover state of `primary`. */
  primaryHover: string;
  /** Text/icon color on top of `primary`. */
  primaryFg: string;
  /** The theme's signature accent (badges, highlights, decor). */
  accent: string;
  /** Readable text on top of `accent` surfaces. */
  accentFg: string;
  /** Success semantics. */
  success: string;
  /** Warning semantics. */
  warning: string;
  /** Danger / destructive semantics. */
  danger: string;
  /** Inline link color. */
  link: string;
  /** Focus ring / focus-visible outline color. */
  focusRing: string;
}

/** Non-color tokens (shared shape; themes may fine-tune). */
export interface ThemeStyle {
  /** Box shadows (sm/md/lg) as full CSS `box-shadow` values. */
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  /** Corner radii. `radiusMd` feeds the site's `--radius` base token. */
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  /** Font stacks (system stacks — no webfont downloads). */
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  /**
   * Layered page background (CSS `background` value WITHOUT the base
   * color — the generator prepends the solid `bg` so text always has a
   * solid fallback under gradients). Authored dim/edge-weighted so
   * centered text never sits on busy imagery.
   */
  bgImage?: string;
  /** Optional decorative overlay above the background, under content. */
  overlayImage?: string;
  /** Film-grain/noise overlay opacity (0–1; keep ≤ 0.06 for AA text). */
  noiseOpacity: number;
  /** Ambient animation speed multiplier (1 = normal; higher = calmer). */
  animSpeed: number;
}

/* ------------------------------------------------------------------ */
/* Ambient decoration layers (all rendered behind content)             */
/* ------------------------------------------------------------------ */

/** Soft blurred orbs drifting down ("fall") or up ("rise"). */
export interface BokehLayer {
  kind: "bokeh";
  count: number;
  colors: string[];
  anim: "fall" | "rise";
  /** blur radius px range */
  blur: [number, number];
  /** diameter px range */
  size: [number, number];
  /** seconds range */
  duration: [number, number];
  opacity: [number, number];
}

/** Glyph particles (snowflakes, hearts, bats, leaves…) falling/rising. */
export interface GlyphLayer {
  kind: "glyphs";
  count: number;
  glyphs: string[];
  anim: "fall" | "rise" | "fly";
  duration: [number, number];
  /** font-size rem range */
  size: [number, number];
  colors?: string[];
  opacity?: [number, number];
}

/** A string of glowing lights hung across the top. */
export interface GarlandLayer {
  kind: "garland";
  colors: string[];
}

/** Radial firework bursts in the upper half. */
export interface SparksLayer {
  kind: "sparks";
  bursts: number;
  colors: string[];
}

/** Parallax star field with an occasional shooting star. */
export interface StarsLayer {
  kind: "stars";
  count: number;
  colors: string[];
  /** expected shooting stars per minute (0 = never) */
  shootingStarPerMin: number;
}

/** Drifting fog / cloud bands (CSS layers). */
export interface FogLayer {
  kind: "fog";
  tints: string[];
  bands: number;
}

/** Vertical light shafts / rays (CSS). */
export interface RaysLayer {
  kind: "rays";
  tint: string;
}

/** Slow morphing gradient mesh blobs (CSS, transform-only, FPS-capped). */
export interface MeshLayer {
  kind: "mesh";
  colors: string[];
  blobs: number;
}

/** Falling code columns (terminal themes; very low opacity). */
export interface CodeRainLayer {
  kind: "coderain";
  color: string;
  columns: number;
  glyphs: string[];
}

/** Diagonal rain streaks (cyberpunk city). */
export interface RainLayer {
  kind: "rain";
  tint: string;
}

/** Slowly rotating gears at the far edges (steampunk). */
export interface GearsLayer {
  kind: "gears";
  tint: string;
  count: number;
}

/** Floating lantern lights (lunar new year). */
export interface LanternsLayer {
  kind: "lanterns";
  colors: string[];
  count: number;
}

export type DecorLayer =
  | BokehLayer
  | GlyphLayer
  | GarlandLayer
  | SparksLayer
  | StarsLayer
  | FogLayer
  | RaysLayer
  | MeshLayer
  | CodeRainLayer
  | RainLayer
  | GearsLayer
  | LanternsLayer;

/* ------------------------------------------------------------------ */
/* Theme definition                                                    */
/* ------------------------------------------------------------------ */

export type ThemeCategory = "base" | "gradient" | "holiday" | "style";

/** Seasonal suggestion window (month is 1–12; range may wrap the year). */
export interface SeasonalWindow {
  from: [month: number, day: number];
  to: [month: number, day: number];
  /** Short reason shown next to the suggestion. */
  note: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  dark: ThemePalette & ThemeStyle;
  light: ThemePalette & ThemeStyle;
  /** Ambient decoration layers (rendered behind content, never blocking). */
  decor?: DecorLayer[];
  /** Seasonal suggestion window (never auto-applied without consent). */
  seasonal?: SeasonalWindow;
  /** Inspiration + design decisions (per Phase 5). */
  inspiration?: string;
  /**
   * Extra per-theme CSS emitted inside the theme's block. Non-layout
   * only: patterns, glows, outlines, textures. The safety layer wraps
   * anything that could ever catch a pointer.
   */
  flourishCss?: string;
}

/* ------------------------------------------------------------------ */
/* Safety layer constants (shared by the generator + decor renderer)   */
/* ------------------------------------------------------------------ */

/**
 * NON-NEGOTIABLE rules every theme inherits (emitted by the generator
 * into themes.generated.css and by the decor renderer):
 *
 *  - decorative layers are position:fixed/absolute, pointer-events:none,
 *    and sit BELOW every interactive element (z-index 0, content above);
 *  - no theme may change display/order/positioning of original UI;
 *  - !important appears ONLY in this safety layer.
 */
export const SAFETY_CSS = `
/* ============ THEME SAFETY LAYER (applies to ALL themes) ============ */
/* Decorative theme layers may never intercept a pointer or cover UI.   */
.theme-decor {
  position: fixed;
  inset: 0;
  pointer-events: none !important;
  z-index: 0;
  overflow: hidden;
  contain: strict;
}
.theme-decor *,
.theme-decor *::before,
.theme-decor *::after {
  pointer-events: none !important;
}
/* Original UI always paints above ambient decor (layout-neutral:
   position:relative without offsets, only a stacking-context z-index).
   SCOPED to the app shell ONLY: portals (Radix sheets/dialogs/popovers,
   the toast toaster) mount as direct <body> children with their own
   position:fixed + z-index — a blanket body > * rule here used to strip
   their fixed positioning (the settings sheet rendered 4000px down the
   page instead of pinned right, which looked exactly like "the panel
   doesn't open"). Only .app-shell (the real content root) needs lifting. */
html[data-theme] body > .app-shell {
  position: relative;
  z-index: 1;
}
/* NOTE: the safety layer deliberately does NOT touch display/order/size of
   original elements — themes never set those properties in the first place
   (tokens + non-layout flourish only), and forcing display:revert here
   would itself alter layout (it broke the flex dock nav during testing). */
/* Text always has a solid or dimmed cushion under it. */
html[data-theme] body {
  background-color: var(--bg, var(--background));
}
/* Motion respects prefers-reduced-motion globally (safety net on top of
   the decor renderer's own gating). */
@media (prefers-reduced-motion: reduce) {
  .theme-decor,
  .theme-decor *,
  .theme-mesh,
  .theme-rays,
  .theme-fog,
  .theme-coderain,
  .theme-rain,
  .theme-gear {
    animation: none !important;
    transition: none !important;
  }
  .theme-decor .motion-piece {
    display: none !important;
  }
}
/* =========== END SAFETY LAYER =========== */
`;
