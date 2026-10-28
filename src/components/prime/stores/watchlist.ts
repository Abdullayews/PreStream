"use client";

import { create } from "zustand";
import type { MediaItem, MediaType } from "@/lib/primewire/types";

const MAX_ITEMS = 100;

interface WatchlistState {
  items: MediaItem[];
  /** Toggle an item; returns true when it was added, false when removed. */
  toggle: (item: MediaItem) => boolean;
  remove: (id: number, type: MediaType) => void;
  clear: () => void;
  /** Reset to the empty state (used by the user store on logout). */
  reset: () => void;
}

/**
 * Session watchlist — in-memory only (NOT cached to the browser).
 * Data is fetched fresh from PrimeWire on every site opening; only account
 * info and settings persist in the browser (see stores/user.ts).
 * Most-recently-added first, capped at 100 items.
 */
export const useWatchlist = create<WatchlistState>()((set, get) => ({
  items: [],
  toggle: (item) => {
    const exists = get().items.some(
      (i) => i.id === item.id && i.type === item.type,
    );
    if (exists) {
      set({
        items: get().items.filter(
          (i) => !(i.id === item.id && i.type === item.type),
        ),
      });
      return false;
    }
    set({ items: [item, ...get().items].slice(0, MAX_ITEMS) });
    return true;
  },
  remove: (id, type) =>
    set({
      items: get().items.filter((i) => !(i.id === id && i.type === type)),
    }),
  clear: () => set({ items: [] }),
  reset: () => set({ items: [] }),
}));

/** Selector hook: is this exact title (id + type) in the watchlist? */
export function useWatchlistHas(id: number, type: MediaType): boolean {
  return useWatchlist((s) =>
    s.items.some((i) => i.id === id && i.type === type),
  );
}

/**
 * True on the client right away — the store is in-memory, so there is no
 * hydration wait (kept for API compatibility with existing components).
 */
export function useWatchlistHydrated(): boolean {
  return true;
}
