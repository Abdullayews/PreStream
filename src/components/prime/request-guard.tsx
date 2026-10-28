"use client";

import { useEffect } from "react";

/**
 * RequestGuard — makes sure the origin's network request-filter service
 * worker (public/sw.js) is registered and stays registered. Runs as part
 * of the page shell; renders nothing and reports nothing.
 */
export function RequestGuard() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
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
