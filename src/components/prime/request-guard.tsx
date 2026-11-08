"use client";

import { useEffect } from "react";
import { useUser } from "./stores/user";
import { setWatchlistSyncKey, useWatchlist } from "./stores/watchlist";

/**
 * RequestGuard — makes sure the origin's network request-filter service
 * worker (public/sw.js) is registered and stays registered, and re-seeds
 * the per-account watchlist from the profile cache after a page reload.
 * Runs as part of the page shell; renders nothing and reports nothing.
 */
export function RequestGuard() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    /* --- watchlist boot seed -------------------------------------- */
    // the watchlist store is in-memory; on reload the persisted apiKey
    // restores the session, but the items need fetching once from the
    // profile cache (guests keep an empty session watchlist)
    const { apiKey } = useUser.getState();
    if (apiKey && useWatchlist.getState().items.length === 0) {
      setWatchlistSyncKey(apiKey);
      fetch(`/api/users/profile?key=${encodeURIComponent(apiKey)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { watchlist?: unknown } | null) => {
          // only seed when the user hasn't toggled anything meanwhile
          if (data && useWatchlist.getState().items.length === 0) {
            useWatchlist.getState().hydrate(data.watchlist ?? []);
          }
        })
        .catch(() => {});
    } else if (apiKey) {
      setWatchlistSyncKey(apiKey);
    }

    /* --- service worker registration ------------------------------ */
    if (!("serviceWorker" in navigator)) return;

    const swUrl = new URL("sw.js", window.location.origin).href;
    const register = () =>
      navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .then((reg) => {
          // make sure an older dormant worker takes over immediately
          if (reg.waiting) reg.waiting.postMessage({ type: "ACTIVATE" });
        })
        .catch(() => {
          /* registration failures must never break the app */
        });
    register();
    // self-heal: some embedded pages try to unregister service workers —
    // re-register on a slow heartbeat if ours ever disappears
    const heartbeat = setInterval(() => {
      navigator.serviceWorker
        .getRegistration("/")
        .then((reg) => {
          if (!reg) register();
        })
        .catch(() => {});
    }, 20_000);
    return () => clearInterval(heartbeat);
  }, []);

  return null;
}
