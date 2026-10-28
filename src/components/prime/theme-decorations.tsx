"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { DecorLayer, ThemeDefinition } from "@/themes/core/types";
import { getTheme } from "@/themes/registry";
import { useUser } from "./stores/user";

/**
 * Ambient theme decorations.
 *
 * Renders the active theme's decorative layers INSIDE a fixed overlay that
 * the safety layer (themes.generated.css) pins to pointer-events:none and
 * z-index 0 — nothing here can ever intercept a click or cover UI.
 *
 * Gating (all verified in Phase 7):
 *  - prefers-reduced-motion → nothing renders at all;
 *  - hidden tab → all CSS animations paused (visibilitychange);
 *  - low-power devices (≤4 cores or ≤4GB) → particle counts halved;
 *  - every animated piece uses transform/opacity only (GPU-friendly).
 */

/* Deterministic pseudo-random — stable across re-renders. */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pick = <T,>(rand: () => number, arr: T[]): T => arr[Math.floor(rand() * arr.length) % arr.length];
const range = (rand: () => number, [min, max]: [number, number]) => min + rand() * (max - min);

/** Low-power heuristic (client-side only, read once). */
function lowPower(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (typeof cores === "number" && cores <= 4) || (typeof mem === "number" && mem <= 4);
}

const gearPath = (teeth = 10) => {
  // simple original gear silhouette
  const c: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i * 360) / teeth;
    const a1 = a0 + 360 / teeth;
    const r1 = 46;
    const r2 = 40;
    const p = (r: number, a: number) =>
      `${(r * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`;
    c.push(`L ${p(r1, a0)} L ${p(r1, a0 + 6)} L ${p(r2, a0 + 12)} L ${p(r2, a1 - 12)} L ${p(r1, a1 - 6)} L ${p(r1, a1)}`);
  }
  return `M 46,0 ${c.join(" ")} Z M 0,-12 A 12 12 0 1 0 0,12 A 12 12 0 1 0 0,-12 Z`;
};

/* ------------------------------------------------------------------ */
/* Layer renderers                                                     */
/* ------------------------------------------------------------------ */

function BokehPieces({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "bokeh" }>; scale: number; seedBase: number }) {
  const pieces = useMemo(() => {
    const rand = seeded(seedBase);
    const count = Math.max(2, Math.round(layer.count * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 100,
      size: range(rand, layer.size),
      blur: range(rand, layer.blur),
      color: pick(rand, layer.colors),
      dur: range(rand, layer.duration),
      delay: -rand() * range(rand, layer.duration),
      opacity: range(rand, layer.opacity),
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className={`decor-bokeh decor-fall ${layer.anim === "rise" ? "decor-rise" : ""}`}
          aria-hidden
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            /* pre-blurred orb: softness baked into the gradient (no filter) */
            background: `radial-gradient(circle, ${p.color} 0%, ${p.color} ${Math.max(8, 100 - p.blur * 8)}%, transparent 72%)`,
            opacity: p.opacity,
            ["--sway" as string]: `${(p.size % 7) + 2}px`,
            animationDuration: `${p.dur / (layer.anim === "rise" ? 1 : 1)}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function GlyphPieces({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "glyphs" }>; scale: number; seedBase: number }) {
  const pieces = useMemo(() => {
    const rand = seeded(seedBase + 7);
    const count = Math.max(2, Math.round(layer.count * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 100,
      glyph: pick(rand, layer.glyphs),
      size: range(rand, layer.size),
      dur: range(rand, layer.duration),
      delay: -rand() * range(rand, layer.duration),
      color: layer.colors ? pick(rand, layer.colors) : undefined,
      opacity: layer.opacity ? range(rand, layer.opacity) : undefined,
    }));
  }, [layer, scale, seedBase]);

  const animClass = layer.anim === "fly" ? "decor-fly" : layer.anim === "rise" ? "decor-rise" : "decor-fall";

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className={`motion-piece ${animClass}`}
          aria-hidden
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            color: p.color,
            opacity: p.opacity,
            ["--sway" as string]: `${Math.round(p.size * 14)}px`,
            ...(layer.anim === "fly"
              ? {
                  ["--fly-y1" as string]: `${10 + ((p.key * 37) % 40)}vh`,
                  ["--fly-y2" as string]: `${14 + ((p.key * 53) % 44)}vh`,
                }
              : {}),
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.glyph}
        </span>
      ))}
    </>
  );
}

function GarlandLights({ layer, seedBase }: { layer: Extract<DecorLayer, { kind: "garland" }>; seedBase: number }) {
  const lights = useMemo(() => {
    const rand = seeded(seedBase + 13);
    const count = 34;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const sag = Math.sin(t * Math.PI) * 26; // droop curve
      return {
        key: i,
        left: 1 + t * 98,
        top: sag,
        color: layer.colors[i % layer.colors.length],
        dur: range(rand, [1.6, 3.4]),
        delay: -rand() * 3,
      };
    });
  }, [layer, seedBase]);

  return (
    <div className="decor-garland motion-piece" aria-hidden>
      {lights.map((l) => (
        <span
          key={l.key}
          className="decor-light"
          style={{
            left: `${l.left}%`,
            top: `${l.top}px`,
            color: l.color,
            ["--tw" as string]: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function FireworkSparks({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "sparks" }>; scale: number; seedBase: number }) {
  const bursts = useMemo(() => {
    const rand = seeded(seedBase + 29);
    const count = Math.max(1, Math.round(layer.bursts * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: 12 + rand() * 76,
      top: 4 + rand() * 38,
      color: pick(rand, layer.colors),
      size: range(rand, [70, 120]),
      dur: range(rand, [7, 13]),
      delay: -rand() * 10,
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {bursts.map((b) => (
        <span
          key={b.key}
          className="decor-spark motion-piece"
          aria-hidden
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            ["--spark-color" as string]: b.color,
            ["--burst" as string]: `${b.size}px`,
            ["--spark-dur" as string]: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function StarField({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "stars" }>; scale: number; seedBase: number }) {
  const stars = useMemo(() => {
    const rand = seeded(seedBase + 41);
    const count = Math.max(8, Math.round(layer.count * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 100,
      top: rand() * 92,
      size: 1 + rand() * 2.2,
      color: pick(rand, layer.colors),
      dur: range(rand, [2.4, 7]),
      delay: -rand() * 6,
      opacity: 0.3 + rand() * 0.6,
    }));
  }, [layer, scale, seedBase]);

  const shooters = useMemo(() => {
    if (layer.shootingStarPerMin <= 0 || scale < 1) return [];
    const perMin = layer.shootingStarPerMin * scale;
    const avgSec = Math.max(6, 60 / Math.max(perMin, 0.1));
    const rand = seeded(seedBase + 97);
    // 2 staggered shooting-star tracks whose rare streak averages the rate
    return Array.from({ length: 2 }, (_, i) => ({
      key: i,
      left: 6 + rand() * 55,
      top: 4 + rand() * 34,
      dur: avgSec * (1.6 + rand() * 0.8),
      delay: -rand() * 20 - i * (avgSec / 2),
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {stars.map((s) => (
        <span
          key={s.key}
          className="decor-star motion-piece"
          aria-hidden
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            color: s.color,
            opacity: s.opacity,
            ["--tw" as string]: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {shooters.map((s) => (
        <span
          key={`sh-${s.key}`}
          className="decor-shooting-star motion-piece"
          aria-hidden
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            ["--shoot-dur" as string]: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function FogBands({ layer, seedBase }: { layer: Extract<DecorLayer, { kind: "fog" }>; seedBase: number }) {
  const bands = useMemo(() => {
    const rand = seeded(seedBase + 59);
    return Array.from({ length: layer.bands }, (_, i) => ({
      key: i,
      top: 8 + i * (70 / Math.max(layer.bands, 1)) + rand() * 10,
      tint: layer.tints[i % layer.tints.length],
      dur: range(rand, [70, 130]),
      delay: -rand() * 60,
      height: range(rand, [26, 44]),
    }));
  }, [layer, seedBase]);

  return (
    <>
      {bands.map((b) => (
        <span
          key={b.key}
          className="decor-fog motion-piece"
          aria-hidden
          style={{
            top: `${b.top}%`,
            height: `${b.height}vh`,
            background: `radial-gradient(50% 50% at 50% 50%, ${b.tint} 0%, transparent 72%)`,
            ["--fog-dur" as string]: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function LightRays({ layer }: { layer: Extract<DecorLayer, { kind: "rays" }> }) {
  return (
    <span
      className="decor-rays motion-piece"
      aria-hidden
      style={{ ["--rays-tint" as string]: layer.tint }}
    />
  );
}

function MeshBlobs({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "mesh" }>; scale: number; seedBase: number }) {
  const blobs = useMemo(() => {
    const rand = seeded(seedBase + 71);
    const count = Math.max(2, Math.round(layer.blobs * Math.min(scale, 1)));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 70,
      top: rand() * 70,
      color: layer.colors[i % layer.colors.length],
      size: range(rand, [44, 62]),
      dur: range(rand, [36, 64]),
      delay: -rand() * 40,
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {blobs.map((b) => (
        <span
          key={b.key}
          className="decor-mesh motion-piece"
          aria-hidden
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}vmax`,
            height: `${b.size}vmax`,
            /* pre-blurred blob (no runtime filter) */
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            opacity: 0.2,
            ["--mesh-dur" as string]: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function CodeRain({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "coderain" }>; scale: number; seedBase: number }) {
  const cols = useMemo(() => {
    const rand = seeded(seedBase + 83);
    const count = Math.max(4, Math.round(layer.columns * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: (i / count) * 100 + rand() * (80 / count),
      text: Array.from({ length: 26 }, () => pick(rand, layer.glyphs)).join(""),
      dur: range(rand, [12, 26]),
      delay: -rand() * 20,
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {cols.map((c) => (
        <span
          key={c.key}
          className="decor-rain-col motion-piece"
          aria-hidden
          style={{
            left: `${c.left}%`,
            ["--rain-dur" as string]: `${c.dur}s`,
            ["--rain-color" as string]: layer.color,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.text}
        </span>
      ))}
    </>
  );
}

function RainStreaks({ layer }: { layer: Extract<DecorLayer, { kind: "rain" }> }) {
  return (
    <span className="decor-rain-layer motion-piece" aria-hidden style={{ ["--rain-tint" as string]: layer.tint }} />
  );
}

function Gears({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "gears" }>; scale: number; seedBase: number }) {
  const gears = useMemo(() => {
    const rand = seeded(seedBase + 101);
    const count = Math.max(1, Math.round(layer.count * Math.min(scale, 1)));
    const spots = [
      { left: "-70px", bottom: "-70px" },
      { right: "-70px", bottom: "-70px" },
      { left: "-60px", top: "18%" },
    ];
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      spot: spots[i % spots.length],
      size: range(rand, [170, 260]),
      teeth: 8 + Math.floor(rand() * 5),
      rev: i % 2 === 1,
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {gears.map((g) => (
        <span
          key={g.key}
          className={`decor-gear motion-piece ${g.rev ? "decor-gear-spin-rev" : "decor-gear-spin"}`}
          aria-hidden
          style={{ ...g.spot, ["--gear-size" as string]: `${g.size}px`, color: layer.tint }}
        >
          <svg viewBox="-50 -50 100 100" aria-hidden>
            <path d={gearPath(g.teeth)} fill="currentColor" fillRule="evenodd" />
          </svg>
        </span>
      ))}
    </>
  );
}

function Lanterns({ layer, scale, seedBase }: { layer: Extract<DecorLayer, { kind: "lanterns" }>; scale: number; seedBase: number }) {
  const lanterns = useMemo(() => {
    const rand = seeded(seedBase + 113);
    const count = Math.max(2, Math.round(layer.count * scale));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: 4 + rand() * 92,
      color: pick(rand, layer.colors),
      dur: range(rand, [22, 44]),
      delay: -rand() * 30,
      size: range(rand, [13, 20]),
    }));
  }, [layer, scale, seedBase]);

  return (
    <>
      {lanterns.map((l) => (
        <span
          key={l.key}
          className="decor-lantern motion-piece"
          aria-hidden
          style={{
            left: `${l.left}%`,
            width: `${l.size}px`,
            height: `${l.size * 1.4}px`,
            ["--lantern-color" as string]: l.color,
            ["--sway" as string]: `${Math.round(l.size * 1.6)}px`,
            ["--lan-dur" as string]: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

function seedOf(themeId: string): number {
  let h = 0;
  for (let i = 0; i < themeId.length; i++) h = (h * 31 + themeId.charCodeAt(i)) | 0;
  return Math.abs(h) + 17;
}

/** Renders one theme's decorative layers (pure presentational). */
export function ThemeDecorations({ theme, paused = false }: { theme: ThemeDefinition; paused?: boolean }) {
  const scale = useMemo(() => (lowPower() ? 0.5 : 1), []);
  const seed = useMemo(() => seedOf(theme.id), [theme.id]);
  const layers = theme.decor ?? [];
  if (layers.length === 0) return null;
  const base = seed;

  return (
    <div className={`theme-decor${paused ? " decor-paused" : ""}`} aria-hidden="true">
      {layers.map((layer, i) => {
        const s = base + i * 211;
        switch (layer.kind) {
          case "bokeh": return <BokehPieces key={i} layer={layer} scale={scale} seedBase={s} />;
          case "glyphs": return <GlyphPieces key={i} layer={layer} scale={scale} seedBase={s} />;
          case "garland": return <GarlandLights key={i} layer={layer} seedBase={s} />;
          case "sparks": return <FireworkSparks key={i} layer={layer} scale={scale} seedBase={s} />;
          case "stars": return <StarField key={i} layer={layer} scale={scale} seedBase={s} />;
          case "fog": return <FogBands key={i} layer={layer} seedBase={s} />;
          case "rays": return <LightRays key={i} layer={layer} />;
          case "mesh": return <MeshBlobs key={i} layer={layer} scale={scale} seedBase={s} />;
          case "coderain": return <CodeRain key={i} layer={layer} scale={scale} seedBase={s} />;
          case "rain": return <RainStreaks key={i} layer={layer} />;
          case "gears": return <Gears key={i} layer={layer} scale={scale} seedBase={s} />;
          case "lanterns": return <Lanterns key={i} layer={layer} scale={scale} seedBase={s} />;
          default: return null;
        }
      })}
    </div>
  );
}

/**
 * Mounted inside Providers. Client-only (renders null until mounted),
 * nothing under prefers-reduced-motion, animations pause when hidden.
 * Uses useSyncExternalStore for all three gates (no setState-in-effect).
 */
const subscribeNothing = () => () => {};

export function ThemeDecorationsRoot() {
  const themeId = useUser((s) => s.themeId);
  const theme = getTheme(themeId);

  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const reduced = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const hidden = useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);
      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => document.visibilityState === "hidden",
    () => false,
  );

  if (!mounted || reduced || !theme || !theme.decor?.length) return null;

  return <ThemeDecorations theme={theme} paused={hidden} />;
}
