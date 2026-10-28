"use client";

import { create } from "zustand";
import { useUser } from "./user";
import type { MediaType } from "@/lib/primewire/types";

/**
 * External watch log — the per-user record of plays that happened on
 * OTHER providers (VidSrc, 2Embed, …), kept beside the PrimeWire account
 * record itself.
 *
 * When a video is opened from another source we sync it to the user's
 * PrimeWire account (episode watched + library status — that's the record
 * PrimeWire natively offers). PrimeWire has no field for "which source it
 * was watched from", so this log keeps the source attribution locally,
 * per user, persisted in localStorage (same per-user pattern as the
 * account cache).
 */

export interface ExternalWatchEntry {
  /** Epoch ms. */
  at: number;
  type: MediaType;
  /** PrimeWire show id (library/status writes go against it). */
  pwId: number;
  tmdbId: number | null;
  title: string;
  season: number | null;
  number: number | null;
  /** Provider id (vidsrc / 2embed / …) — null when the panel was used for a PrimeWire-host play. */
  provider: string | null;
  /** Whether the PrimeWire account write succeeded. */
  synced: boolean;
}

const MAX_ENTRIES = 40;
const storageKey = (username: string) => `prestream:ext-watch-log:${username}`;

function load(username: string): ExternalWatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExternalWatchEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

interface ExternalWatchLogState {
  username: string | null;
  entries: ExternalWatchEntry[];
  /** Bind to the signed-in user (loads their persisted log). */
  attach: (username: string | null) => void;
  /** Record a watch; returns the stored entries. */
  log: (entry: Omit<ExternalWatchEntry, "at">) => void;
  /** Drop one entry. */
  remove: (at: number) => void;
  reset: () => void;
}

export const useExternalWatchLog = create<ExternalWatchLogState>()((set, get) => ({
  username: null,
  entries: [],
  attach: (username) => {
    if (get().username === username) return;
    set({ username, entries: username ? load(username) : [] });
  },
  log: (entry) => {
    const { username } = get();
    const full: ExternalWatchEntry = { ...entry, at: Date.now() };
    const entries = [full, ...get().entries].slice(0, MAX_ENTRIES);
    set({ entries });
    if (username && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey(username), JSON.stringify(entries));
      } catch {
        // storage full/unavailable — in-memory log still works this session
      }
    }
  },
  remove: (at) => {
    const { username } = get();
    const entries = get().entries.filter((e) => e.at !== at);
    set({ entries });
    if (username && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey(username), JSON.stringify(entries));
      } catch {
        // ignore
      }
    }
  },
  reset: () => set({ username: null, entries: [] }),
}));

/** Keep the log bound to the signed-in identity (covers login + logout). */
if (typeof window !== "undefined") {
  useExternalWatchLog.getState().attach(useUser.getState().username);
  useUser.subscribe((state) => {
    useExternalWatchLog.getState().attach(state.username);
  });
}

/** Provider display name for log rows. */
export function providerName(id: string | null): string {
  if (!id) return "PrimeWire";
  const map: Record<string, string> = {
    vidsrc: "VidSrc",
    "2embed": "2Embed",
    vidlink: "VidLink",
    vidfast: "VidFast",
    videm: "Videm",
    videasy: "Videasy",
    // Removed from the registry (parked domain) — kept so older log rows
    // still render their provider chip.
    nunflix: "Nunflix",
  };
  return map[id] ?? id;
}
