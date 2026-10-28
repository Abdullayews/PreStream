"use client";

import { create } from "zustand";

/**
 * Global re-login guard state. Any /api/account/* call that fails with a
 * 401 session error (session-expired / no-session / unknown-key) opens the
 * onboarding (PrimeWire sign-in) dialog with a notice line. The dialog
 * consumes this store; `use-account.ts` feeds it.
 *
 * The WRITE side goes through a window custom event (openRelogin) as well
 * as the store: after hot reloads the bundler can hold two copies of this
 * module, and the fetch layer and the dialog would then talk to different
 * store instances — the prompt would silently never open. `window` is
 * shared by every chunk copy, so the dialog ALSO listens for the event and
 * opens its own store copy. Belt and suspenders.
 */
interface ReloginState {
  open: boolean;
  /** Notice shown above the form, e.g. "Your PrimeWire session expired…". */
  reason: string | null;
  openWith: (reason?: string | null) => void;
  close: () => void;
}

export const RELOGIN_EVENT = "primestream:open-relogin";

/** Open the re-login prompt from anywhere (event + store, client-only). */
export function openRelogin(reason?: string | null) {
  useRelogin.getState().openWith(reason ?? null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<string | null>(RELOGIN_EVENT, { detail: reason ?? null }),
    );
  }
}

export const useRelogin = create<ReloginState>((set) => ({
  open: false,
  reason: null,
  openWith: (reason) => set({ open: true, reason: reason ?? null }),
  close: () => set({ open: false, reason: null }),
}));

/**
 * Convenience hook consumed by UI that needs to trigger / observe the
 * re-login guard (the onboarding dialog re-exports it).
 */
export function useReloginGuard() {
  return useRelogin();
}
