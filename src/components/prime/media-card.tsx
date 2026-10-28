"use client";

import type { MouseEvent, KeyboardEvent } from "react";
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
 * The workhorse poster card — used in home rows, browse grids and search
 * results. Monochrome Shiopa-style: rounded-2xl poster with the title and
 * meta line beneath it. Whole card opens the detail view; the bookmark
 * button (44px target) toggles the watchlist.
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

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={open}
      onKeyDown={onCardKeyDown}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group relative w-full cursor-pointer text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl",
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300 group-hover:ring-foreground/30 group-hover:shadow-lg group-hover:shadow-black/20 dark:ring-white/5 dark:group-hover:ring-white/25">
        {poster ? (
          <img
            src={poster}
            alt={`${item.title} poster`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
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
              ? "bg-primary text-primary-foreground opacity-100"
              : "glass text-glass-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <Bookmark
            className={cn("size-4", inWatchlist && "fill-current")}
            aria-hidden
          />
        </button>

        {/* play overlay — centered glass circle, revealed on hover/focus */}
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${item.title}`}
          className={cn(
            "absolute top-1/2 left-1/2 z-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <span className="glass flex size-14 items-center justify-center rounded-full text-glass-foreground">
            <Play className="size-5 fill-current" aria-hidden />
          </span>
        </button>
      </div>

      {/* title + meta beneath the poster — clean editorial layout */}
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
            <span className="ml-auto flex shrink-0 items-center gap-1 text-foreground/80">
              <Star className="size-3 fill-foreground text-foreground" aria-hidden />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
