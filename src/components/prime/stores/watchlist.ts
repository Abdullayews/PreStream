"use client";

import { create } from "zustand";
import type { MediaItem, MediaType } from "@/lib/primewire/types";

const MAX_ITEMS = 100;
/** Debounce window for watchlist pushes (ms) — rapid toggles coalesce. */
const SYNC_DEBOUNCE_MS = 800;

/** Minimal runtime validation for items coming back from the server cache. */
function isValidItem(v: unknown): v is MediaItem {
  if (typeof v !== "object" || v === null) return false;
  const it = v as Record<string, unknown>;
  return (
    typeof it.id === "number" &&
    Number.isFinite(it.id) &&
    (it.type === "movie" || it.type === "tv") &&
    typeof it.title === "string" &&
    typeof it.slug === "string"
  );
}

interface WatchlistState {
  items: MediaItem[];
  /** Toggle an item; returns true when it was added, false when removed. */
  toggle: (item: MediaItem) => boolean;
  remove: (id: number, type: MediaType) => void;
  clear: () => void;
  /** Reset to the empty state and detach the server sync (logout). */
  reset: () => void;
  /** Seed from the account cache after sign-in (validated, no sync back). */
  hydrate: (items: unknown) => void;
}

/**
 * Per-account watchlist — seeded from the profile cache on sign-in, then
 * mirrored to /api/users/profile (debounced) so it survives reloads,
 * redeploys and other devices. Most-recently-added first, capped at 100.
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
      scheduleSync();
      return false;
    }
    set({ items: [item, ...get().items].slice(0, MAX_ITEMS) });
    scheduleSync();
    return true;
  },

  remove: (id, type) => {
    set({ items: get().items.filter((i) => !(i.id === id && i.type === type)) });
    scheduleSync();
  },

  clear: () => {
    set({ items: [] });
    scheduleSync();
  },

  reset: () => {
    set({ items: [] });
    syncKey = null;
  },

  hydrate: (items) => {
    const list = Array.isArray(items) ? items.filter(isValidItem) : [];
    // server keeps newest-first order — cap defensively
    set({ items: list.slice(0, MAX_ITEMS) });
    // the seed IS the server state — nothing to push
    skipNextSync = true;
  },
}));

/* ------------------------------------------------------------------ */
/* Server sync (fire-and-forget, debounced)                            */
/* ------------------------------------------------------------------ */

/** Our API key while signed in; null while signed out (sync disabled). */
let syncKey: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
/** Set when items were just seeded from the server (skip the echo push). */
let skipNextSync = false;

/** Attach/detach the sync key — called by the user store on login/logout. */
export function setWatchlistSyncKey(key: string | null): void {
  syncKey = key;
  if (!key && syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function scheduleSync(): void {
  if (skipNextSync) {
    skipNextSync = false;
    return;
  }
  if (!syncKey) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const key = syncKey;
    if (!key) return;
    // fire-and-forget — a failed push must never block the UI; the next
    // mutation (or the next sign-in seed) reconciles the server state
    fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key, watchlist: useWatchlist.getState().items }),
    }).catch(() => {});
  }, SYNC_DEBOUNCE_MS);
}

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
