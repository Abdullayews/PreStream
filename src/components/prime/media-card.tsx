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
 * The workhorse poster card — Basement cut. Used in home rows, browse
 * grids and search results.
 *
 * Anatomy (matching the reference media card): a rounded-[13.6px] artwork
 * well on the card surface; a dark rating pill at the TOP-LEFT; a dark
 * round bookmark at the TOP-RIGHT (44px target); beneath the artwork a
 * two-line copy block — title in 600 weight bone, meta "2026 · Movie" in
 * dim. Whole card opens the detail view; a quiet play disc appears on
 * hover. Posters fade in on load.
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
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative w-full cursor-pointer text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[14px]",
        className,
      )}
    >
      {/* artwork well */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full overflow-hidden rounded-[14px] bg-card",
          "transition-colors duration-200 group-hover:bg-accent",
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
                "h-full w-full object-cover transition-opacity duration-500 ease-out",
                "group-hover:brightness-110",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
            {/* loading shimmer underneath */}
            {!loaded && (
              <span
                aria-hidden
                className="absolute inset-0 overflow-hidden bg-card"
              >
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent"
                  style={{ animation: "shimmer-sweep 1.6s ease-in-out infinite" }}
                />
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-3 text-center">
            <Film className="size-8 text-muted-foreground/50" aria-hidden />
            <span className="line-clamp-3 text-xs text-muted-foreground">
              {item.title}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground/60">
              {item.type === "movie" ? "Movie" : "TV"}
              {item.year != null ? ` · ${item.year}` : ""}
            </span>
          </div>
        )}

        {/* rating pill — top-left, dark translucent */}
        {item.rating != null && item.rating > 0 && (
          <span
            aria-label={`Rated ${item.rating.toFixed(1)} out of 5`}
            className="absolute top-2 left-2 flex h-6 items-center gap-1 rounded-full bg-background/75 px-2.5 text-[11px] font-bold text-foreground backdrop-blur-sm"
          >
            <Star className="size-3 fill-star text-star" aria-hidden />
            {item.rating.toFixed(1)}
          </span>
        )}

        {/* watchlist toggle — dark round, top-right, 44px target */}
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
            "absolute top-1 right-1 z-10 flex size-11 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inWatchlist
              ? "text-foreground"
              : "text-foreground/85 hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full bg-background/65 backdrop-blur-sm transition-opacity",
              inWatchlist ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          >
            <Bookmark
              className={cn("size-[15px]", inWatchlist && "fill-current")}
              aria-hidden
            />
          </span>
        </button>

        {/* play disc — quiet, revealed on hover/focus */}
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${item.title}`}
          className={cn(
            "absolute top-1/2 left-1/2 z-0 flex size-12 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "opacity-0 group-hover:scale-100 group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-background/75 text-foreground backdrop-blur-sm">
            <Play className="size-[18px] fill-current" aria-hidden />
          </span>
        </button>
      </div>

      {/* copy block beneath the artwork */}
      <div className="px-0.5 pt-2">
        <p className="truncate text-[13.5px] leading-snug font-semibold text-foreground">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] leading-snug text-muted-foreground">
          {item.year != null ? `${item.year} · ` : ""}
          {item.type === "movie" ? "Movie" : "TV"}
        </p>
      </div>
    </motion.div>
  );
}
