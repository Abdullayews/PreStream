"use client";

import { useState } from "react";
import type { MouseEvent, KeyboardEvent, SyntheticEvent } from "react";
import { motion } from "framer-motion";
import { Bookmark, Film, Play, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { imgUrl } from "./hooks/use-primewire";
import { toDetail, toPlayer } from "./nav";
import { useWatchlist, useWatchlistHas } from "./stores/watchlist";
import type { MediaItem } from "@/lib/primewire/types";

/**
 * The workhorse poster card — Aurora cut. Used in home rows, browse grids
 * and search results.
 *
 * Anatomy: rounded-xl poster that lifts on hover while an info panel
 * (rating, year, type) dissolves in over a bottom gradient scrim; the
 * play affordance scales in from the center. Poster images fade in on
 * load so shelves never flash empty gray. The title + meta line live
 * beneath the art in the quiet editorial zone. Whole card opens the
 * detail view; the bookmark (44px target) toggles the watchlist.
 */
export function MediaCard({
  item,
  className,
}: {
  item: MediaItem;
  className?: string;
}) {
  const router = useRouter();
  const inWatchlist = useWatchlistHas(item.id, item.type);
  const toggle = useWatchlist((s) => s.toggle);
  const poster = imgUrl(item.poster, "w500");
  const [loaded, setLoaded] = useState(false);

  const open = () => toDetail(router, item);

  const onCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const onToggleWatchlist = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const added = toggle(item);
    toast.success(added ? "Added to watchlist" : "Removed from watchlist", {
      description: item.title,
    });
  };

  const onPlay = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toPlayer(router, item);
  };

  const onImgLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth > 0) setLoaded(true);
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={open}
      onKeyDown={onCardKeyDown}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group relative w-full cursor-pointer text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-card",
          "ring-1 ring-foreground/10 transition-all duration-300",
          "group-hover:ring-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:shadow-black/30",
          "dark:ring-white/8 dark:group-hover:ring-primary/60",
        )}
      >
        {poster ? (
          <>
            {/* poster — fades in once decoded */}
            <img
              src={poster}
              alt={`${item.title} poster`}
              loading="lazy"
              decoding="async"
              onLoad={onImgLoad}
              onError={() => setLoaded(true)}
              className={cn(
                "h-full w-full object-cover transition-all duration-500 ease-out",
                "group-hover:scale-[1.07]",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
            {/* loading shimmer underneath */}
            {!loaded && (
              <span
                aria-hidden
                className="absolute inset-0 overflow-hidden bg-muted"
              >
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
                  style={{ animation: "shimmer-sweep 1.6s ease-in-out infinite" }}
                />
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted p-3 text-center">
            <Film className="size-8 text-muted-foreground/50" aria-hidden />
            <span className="line-clamp-3 text-xs text-muted-foreground">
              {item.title}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground/60">
              {item.type === "movie" ? "Movie" : "TV"}
              {item.year != null ? ` • ${item.year}` : ""}
            </span>
          </div>
        )}

        {/* hover scrim + quick info — dissolves in over the poster bottom */}
        {poster && (
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2.5 pt-8 pb-2.5",
              "translate-y-2 opacity-0 transition-all duration-300 ease-out",
              "group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
            )}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/95">
              {item.year != null && <span>{item.year}</span>}
              {item.year != null && (
                <span className="text-white/40">•</span>
              )}
              <span className="uppercase tracking-wide">
                {item.type === "movie" ? "Movie" : "TV"}
              </span>
            </span>
            {item.rating != null && item.rating > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-white/95">
                <Star className="size-3 fill-current text-amber-300" aria-hidden />
                {item.rating.toFixed(1)}
                <span className="font-normal text-white/60">/ 5</span>
              </span>
            )}
          </div>
        )}

        {/* watchlist toggle — 44px target, revealed on hover/focus, always visible when saved */}
        <button
          type="button"
          onClick={onToggleWatchlist}
          aria-pressed={inWatchlist}
          aria-label={
            inWatchlist
              ? `Remove ${item.title} from watchlist`
              : `Add ${item.title} to watchlist`
          }
          className={cn(
            "absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inWatchlist
              ? "bg-primary text-primary-foreground opacity-100 shadow-lg shadow-primary/30"
              : "bg-black/45 text-white opacity-0 backdrop-blur-md group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/70",
          )}
        >
          <Bookmark
            className={cn("size-4", inWatchlist && "fill-current")}
            aria-hidden
          />
        </button>

        {/* play overlay — center disc, scales in on hover/focus */}
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${item.title}`}
          className={cn(
            "absolute top-1/2 left-1/2 z-0 flex size-14 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "opacity-0 group-hover:scale-100 group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100",
          )}
        >
          <span className="glass-rim glass flex size-14 items-center justify-center rounded-full text-glass-foreground shadow-2xl">
            <Play className="size-5 fill-current" aria-hidden />
          </span>
        </button>
      </div>

      {/* title + meta beneath the poster — quiet editorial zone */}
      <div className="px-0.5 pt-2.5">
        <p className="truncate text-sm font-medium text-foreground">
          {item.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {item.year != null && <span>{item.year}</span>}
          {item.year != null && (
            <span aria-hidden className="text-muted-foreground/40">
              •
            </span>
          )}
          <span className="uppercase tracking-wide">
            {item.type === "movie" ? "Movie" : "TV"}
          </span>
          {item.rating != null && item.rating > 0 && (
            <span className="ml-auto flex shrink-0 items-center gap-1 font-semibold text-foreground/90">
              <Star className="size-3 fill-star text-star" aria-hidden />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
