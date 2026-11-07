"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { imgUrl } from "./hooks/use-primewire";
import { toDetail, toPlayer } from "./nav";
import { StarRating } from "./star-rating";
import type { HeroItem } from "@/lib/primewire/types";

const SLIDE_MS = 7000;
const TRANSITION = { duration: 0.5, ease: "easeOut" as const };

/**
 * Cinematic hero carousel for the home page — the Aurora opening shot.
 * Layered ambience (blurred poster wash) + a crisp poster that floats in
 * from the right with a gentle parallax drift, display-voice typography
 * with a gradient eyebrow, and progress-bar indicators that fill as each
 * slide advances (auto-advance every 7s, paused on hover).
 */
export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const item = items[safeIndex];

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      SLIDE_MS,
    );
    return () => clearInterval(timer);
  }, [paused, count]);

  if (!item) return null;

  const go = (next: number) =>
    setIndex(((next % count) + count) % count);

  return (
    <section
      className="group relative h-[72vh] max-h-[680px] min-h-[500px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {/* background layers: blurred ambience + deep scrims */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${item.id}-${item.type}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
          aria-hidden
        >
          {imgUrl(item.poster, "w780") && (
            <img
              src={imgUrl(item.poster, "w780") ?? undefined}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[85%] scale-125 object-cover opacity-40 blur-2xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
          {/* bottom vignette so the rows below melt into the stage */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* crisp poster — floats in, then drifts with a slow breathing motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`poster-${item.id}-${item.type}`}
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -48 }}
          transition={TRANSITION}
          className="absolute inset-0 hidden sm:block"
          aria-hidden
        >
          {imgUrl(item.poster, "w500") && (
            <motion.img
              src={imgUrl(item.poster, "w500") ?? undefined}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[40%] object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_45%)]"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="absolute inset-y-0 right-0 h-full w-[40%] bg-gradient-to-t from-background/70 via-transparent to-transparent [mask-image:linear-gradient(to_right,transparent,black_45%)]" />
        </motion.div>
      </AnimatePresence>

      {/* content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${item.id}-${item.type}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={TRANSITION}
            className="max-w-xl"
          >
            <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-gradient-to-r from-primary to-transparent" aria-hidden />
              <span className="text-brand-gradient">Featured</span>
              <span>on PrimeWire</span>
            </p>
            <h1
              className="text-balance mt-4 text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl"
              style={{ fontFamily: "var(--font-heading, var(--font-space-grotesk)), sans-serif" }}
            >
              {item.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {item.year != null && (
                <span className="text-sm font-medium tabular-nums text-foreground/90">
                  {item.year}
                </span>
              )}
              <span className="rounded-full border border-border/80 bg-card/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                {item.type === "movie" ? "Movie" : "TV Series"}
              </span>
              {item.rating != null && item.rating > 0 && (
                <span className="flex items-center gap-2">
                  <StarRating value={item.rating} />
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {item.rating.toFixed(1)}
                  </span>
                </span>
              )}
              {item.tmdbRating != null && item.tmdbRating > 0 && (
                <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                  TMDB {item.tmdbRating.toFixed(1)}
                </span>
              )}
            </div>

            {item.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-border/70 bg-card/40 px-3 py-1 text-xs text-foreground/85 backdrop-blur-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {item.description && (
              <p className="mt-5 line-clamp-3 max-w-xl leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-[1.03] hover:brightness-110 active:scale-100"
                onClick={() => toPlayer(router, item)}
              >
                <Play className="size-4 fill-current" aria-hidden />
                Watch Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="glass h-12 rounded-full border-border/60 px-7 text-sm font-semibold hover:bg-glass/40"
                onClick={() => toDetail(router, item)}
              >
                <Info className="size-4" aria-hidden />
                Details
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* prev / next — revealed on hover */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(safeIndex - 1)}
            aria-label="Previous featured title"
            className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/60 text-foreground opacity-0 backdrop-blur transition-all hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 md:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(safeIndex + 1)}
            aria-label="Next featured title"
            className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/60 text-foreground opacity-0 backdrop-blur transition-all hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 md:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </>
      )}

      {/* progress indicators — one bar per slide, the active one fills */}
      {count > 1 && (
        <div
          className="absolute right-4 bottom-6 z-20 flex items-center gap-1.5 sm:right-6"
          role="tablist"
          aria-label="Choose featured title"
        >
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Featured title ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "group/bar h-1.5 overflow-hidden rounded-full transition-all duration-300",
                i === safeIndex
                  ? "w-9 bg-primary/30"
                  : "w-4 bg-foreground/25 hover:bg-foreground/45",
              )}
            >
              {i === safeIndex && (
                <motion.span
                  key={`fill-${safeIndex}-${paused}`}
                  className="block h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: paused ? "0%" : "100%" }}
                  transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
