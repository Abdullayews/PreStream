"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { imgUrl } from "./hooks/use-primewire";
import type { MediaItem } from "@/lib/primewire/types";

/**
 * Watchlist notifications — a stack of cards that slides in from the RIGHT
 * edge (the same motion language as the watchlist sheet) whenever a title
 * is added to or removed from the watchlist: poster thumb, the action text
 * and the title's meta line. Click anywhere on a card to dismiss it early.
 */

interface WatchlistToastEntry {
  id: number;
  added: boolean;
  item: MediaItem;
}

interface WatchlistToastState {
  toasts: WatchlistToastEntry[];
  push: (entry: WatchlistToastEntry) => void;
  dismiss: (id: number) => void;
}

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4600;

let nextId = 1;

export const useWatchlistToasts = create<WatchlistToastState>((set, get) => ({
  toasts: [],
  push: (entry) => {
    // Never more than MAX_TOASTS on screen — the oldest slides back out.
    set({ toasts: [...get().toasts, entry].slice(-MAX_TOASTS) });
    setTimeout(() => get().dismiss(entry.id), AUTO_DISMISS_MS);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Fire the slide-in notification for a watchlist add (or remove). */
export function notifyWatchlist(added: boolean, item: MediaItem) {
  useWatchlistToasts.getState().push({ id: nextId++, added, item });
}

/** Global host — mounted once in Providers, floats above the dock lane. */
export function WatchlistToastHost() {
  const toasts = useWatchlistToasts((s) => s.toasts);
  const dismiss = useWatchlistToasts((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed right-0 z-[95] flex flex-col items-end gap-2.5",
        "bottom-[calc(var(--dock-clearance)+1rem)] pr-4 sm:pr-6",
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const poster = imgUrl(t.item.poster, "w200");
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              initial={{ x: "115%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "115%", opacity: 0 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "glass pointer-events-auto flex w-[min(92vw,380px)] items-center gap-3 rounded-2xl p-3 text-left",
                "shadow-2xl transition-colors focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {/* poster thumb — same treatment as the drawer rows */}
              <span className="block w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {poster ? (
                  <img
                    src={poster}
                    alt={`${t.item.title} poster`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] leading-snug font-semibold text-foreground">
                  {t.added ? "Added to your watchlist" : "Removed from your watchlist"}
                </span>
                <span className="mt-0.5 block truncate text-[12px] leading-snug text-muted-foreground">
                  {t.item.title}
                  {t.item.year != null ? ` · ${t.item.year}` : ""} ·{" "}
                  {t.item.type === "movie" ? "Movie" : "TV"}
                </span>
              </span>

              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]",
                  t.added ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Bookmark
                  className={cn("size-4", t.added && "fill-current")}
                  aria-hidden
                />
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
