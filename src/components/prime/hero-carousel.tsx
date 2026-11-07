"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { imgUrl } from "./hooks/use-primewire";
import { toDetail, toPlayer } from "./nav";
import { StarRating } from "./star-rating";
import type { HeroItem } from "@/lib/primewire/types";

const SLIDE_MS = 7000;
const TRANSITION = { duration: 0.5, ease: "easeOut" as const };

/**
 * Cinematic hero carousel — full-bleed cut. A viewport-height backdrop
 * with a scrim (100svh — pure viewport units, no px caps, so it fills the
 * screen exactly on every device), copy pinned to the BOTTOM-LEFT at 13%
 * of the hero height (percentage placement — it scales with the screen),
 * a bone-filled Play pill + dark translucent Details, thin bar pagination
 * at 3% from the bottom edge, and large invisible prev/next click zones on
 * the sides. Auto-advances every 7s (paused on hover). Runs beneath the
 * fixed transparent header.
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
      className="group relative h-svh w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {/* backdrop + scrim */}
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
          {imgUrl(item.poster, "original") && (
            <img
              src={imgUrl(item.poster, "original") ?? undefined}
              alt=""
              // above-the-fold LCP image: load immediately, ahead of everything else
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          )}
          {/* scrim: strong at the bottom-left where the copy sits */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/25 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* prev / next — large invisible click zones */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(safeIndex - 1)}
            aria-label="Previous featured title"
            className="group/zone absolute inset-y-0 left-0 z-10 w-16 cursor-w-resize focus-visible:outline-none md:w-32"
          >
            <span className="ml-4 flex size-9 items-center justify-center rounded-full bg-background/60 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover/zone:opacity-100 group/zone:focus-visible:opacity-100">
              <ChevronLeft className="size-4" aria-hidden />
            </span>
          </button>
          <button
            type="button"
            onClick={() => go(safeIndex + 1)}
            aria-label="Next featured title"
            className="group/zone absolute inset-y-0 right-0 z-10 w-16 cursor-e-resize focus-visible:outline-none md:w-32"
          >
            <span className="mr-4 ml-auto flex size-9 items-center justify-center rounded-full bg-background/60 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover/zone:opacity-100 group/zone:focus-visible:opacity-100">
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </button>
        </>
      )}

      {/* copy — anchored bottom-left, 13% up from the hero's bottom edge */}
      <div className="shell absolute inset-x-0 bottom-[13%] z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${item.id}-${item.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={TRANSITION}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Featured on PrimeWire
            </p>
            <h1
              className="font-display text-balance mt-3 max-w-xl text-4xl leading-[1.02] font-extrabold text-foreground sm:text-5xl md:text-6xl"
            >
              {item.title}
            </h1>

            {/* meta line — ratings, year, type */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] font-semibold text-foreground/80">
              {item.rating != null && item.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <StarRating value={item.rating} />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.tmdbRating != null && item.tmdbRating > 0 && (
                <span className="flex items-center gap-1">
                  TMDB {item.tmdbRating.toFixed(1)}
                </span>
              )}
              {item.year != null && (
                <span className="tabular-nums">{item.year}</span>
              )}
              <span>
                {item.type === "movie" ? "Movie" : "TV Series"}
              </span>
            </div>

            {item.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-foreground/[0.07] px-3 py-1 text-[11.5px] font-medium text-foreground/85"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {item.description && (
              <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-foreground/75">
                {item.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toPlayer(router, item)}
                className="flex h-12 items-center gap-2.5 rounded-full bg-primary pr-6 pl-5 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Play className="size-[18px] fill-current" aria-hidden />
                Play
              </button>
              <button
                type="button"
                onClick={() => toDetail(router, item)}
                className="flex h-12 items-center gap-2.5 rounded-full bg-background/45 px-6 text-[15px] font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="size-[18px]" aria-hidden />
                Details
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* pagination — thin bars, 3% up from the bottom edge */}
      {count > 1 && (
        <div
          className="absolute inset-x-0 bottom-[3%] z-20 flex justify-center gap-1.5"
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
                "h-2.5 overflow-hidden rounded-full transition-all duration-300",
                i === safeIndex
                  ? "w-9 bg-foreground/25"
                  : "w-2.5 bg-foreground/35 hover:bg-foreground/55",
              )}
            >
              {i === safeIndex && (
                <motion.span
                  key={`fill-${safeIndex}-${paused}`}
                  className="block h-full rounded-full bg-foreground"
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
