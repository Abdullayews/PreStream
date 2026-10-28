"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUTO_THEME_ID, canonicalThemeId, isThemeId } from "@/themes/registry";
import type { LoginResponse } from "@/lib/account-client-types";

interface UserState {
  /** OUR API token (ps_…) returned by /api/account/login. */
  apiKey: string | null;
  /** PrimeWire identity (all straight from PrimeWire, never user-entered). */
  username: string | null;
  avatar: string | null;
  /** The user's real PrimeWire API key (v1 API access). */
  pwApiKey: string | null;
  userId: number | null;
  themeId: string;
  /** Zen-browser style transparency: page background becomes see-through. */
  transparency: boolean;
  /** Epoch ms of the last successful watchlist push to the server. */
  watchlistSyncedAt: number | null;
  /** Store the identity from a successful PrimeWire sign-in. */
  setProfileFromLogin: (login: LoginResponse) => void;
  /** Update the cached avatar path (after an upload). */
  setAvatar: (avatar: string | null) => void;
  /** Update the cached PrimeWire API key (after a reset). */
  setPwApiKey: (key: string | null) => void;
  /** Switch the active theme locally + fire-and-forget sync to the server. */
  setTheme: (id: string) => void;
  /** Toggle Zen-style transparency (browser-cached preference). */
  setTransparency: (on: boolean) => void;
  /** Sign out: detach the PrimeWire session server-side, then clear local state. */
  logout: () => void;
}

/**
 * Per-user account state (localStorage via zustand persist).
 * Holds OUR API token plus the PrimeWire identity (username / avatar /
 * PrimeWire API key) that comes back from a PrimeWire sign-in.
 */
export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      username: null,
      avatar: null,
      pwApiKey: null,
      userId: null,
      themeId: AUTO_THEME_ID,
      transparency: false,
      watchlistSyncedAt: null,

      setProfileFromLogin: (login) => {
        const safeTheme =
          typeof login.themeId === "string" && isThemeId(login.themeId)
            ? login.themeId
            : AUTO_THEME_ID;
        set({
          apiKey: login.apiKey,
          username: login.user.username ?? null,
          avatar: login.user.avatar ?? null,
          pwApiKey: login.user.pwApiKey ?? null,
          userId: login.user.userId ?? null,
          themeId: safeTheme,
        });

        // The session watchlist stays in-memory only — data comes from the
        // site on every visit; just account info + settings are cached here.
      },

      setAvatar: (avatar) => set({ avatar }),
      setPwApiKey: (pwApiKey) => set({ pwApiKey }),

      setTransparency: (on) => set({ transparency: on }),

      setTheme: (id) => {
        const canonical = canonicalThemeId(id);
        if (!canonical) return;
        set({ themeId: canonical });
        const apiKey = get().apiKey;
        if (!apiKey) return;
        // fire-and-forget — theme choice must never block the UI
        fetch("/api/users/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, themeId: canonical }),
        }).catch(() => {});
      },

      logout: () => {
        const apiKey = get().apiKey;
        // Detach the PrimeWire session (fire-and-forget). Our profile row
        // keeps theme + watchlist cached for the next sign-in.
        if (apiKey) {
          fetch("/api/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
          }).catch(() => {});
        }
        set({
          apiKey: null,
          username: null,
          avatar: null,
          pwApiKey: null,
          userId: null,
          themeId: AUTO_THEME_ID,
          transparency: false,
          watchlistSyncedAt: null,
        });
      },
    }),
    { name: "primestream-user", version: 3, merge: (persisted, current) => ({
      ...current,
      ...(persisted as Partial<UserState>),
      // sensible defaults for newly added settings
      transparency: (persisted as UserState | undefined)?.transparency ?? false,
    }) },
  ),
);

/**
 * True once the persisted user store has rehydrated on the client.
 * SSR renders `false` — gate first-visit UI (onboarding) on this to
 * avoid hydration mismatches.
 */
export function useUserHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useUser.persist.onFinishHydration(onStoreChange),
    () => useUser.persist.hasHydrated(),
    () => false,
  );
}
