"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
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
 * Cinematic hero carousel for the home page — layered ambience + crisp
 * poster, auto-advancing every 7s (paused on hover).
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
      className="group relative h-[70vh] max-h-[640px] min-h-[480px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {/* background layers: blurred ambience + crisp poster */}
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
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`poster-${item.id}-${item.type}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={TRANSITION}
          className="absolute inset-0 hidden sm:block"
          aria-hidden
        >
          {imgUrl(item.poster, "w500") && (
            <img
              src={imgUrl(item.poster, "w500") ?? undefined}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[40%] object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_45%)]"
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
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={TRANSITION}
            className="max-w-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Featured on PrimeWire
            </p>
            <h1 className="text-balance mt-4 text-4xl font-bold tracking-tight md:text-6xl">
              {item.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {item.year != null && (
                <span className="text-sm font-medium text-muted-foreground">
                  {item.year}
                </span>
              )}
              {item.rating != null && item.rating > 0 && (
                <span className="flex items-center gap-2">
                  <StarRating value={item.rating} />
                  <span className="text-sm font-medium text-foreground">
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
                    className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-foreground"
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
                className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/20 hover:bg-primary/85"
                onClick={() => toPlayer(router, item)}
              >
                <Play className="size-4 fill-current" aria-hidden />
                Watch Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-7 text-sm font-semibold"
                onClick={() => toDetail(router, item)}
              >
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

      {/* indicator dots */}
      {count > 1 && (
        <div
          className="absolute bottom-6 right-4 z-20 flex items-center gap-2 sm:right-6"
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
                "h-2 rounded-full transition-all duration-300",
                i === safeIndex
                  ? "w-6 bg-foreground"
                  : "w-2 bg-foreground/30 hover:bg-foreground/50",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
