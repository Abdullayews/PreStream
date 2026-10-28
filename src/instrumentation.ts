/**
 * Server bootstrap — Next.js calls register() once per server process
 * (dev AND production standalone). This file is ALSO bundled for the Edge
 * runtime, so Node-only imports (dns/net/undici) must stay DYNAMIC —
 * imported after the NEXT_RUNTIME==='nodejs' guard below.
 *
 * 1. Installs the DoH-backed global fetch dispatcher (see ./lib/resolver)
 *    before any route handler gets a chance to fetch.
 *
 * 2. Keep-alive self-ping: free-tier PaaS instances spin down after ~15
 *    minutes without traffic (Render free web services). This loop pings
 *    the service's own PUBLIC health endpoint once per minute so it never
 *    idles out.
 *
 *  ⚠ The ping must go through the public URL — PaaS idle detection counts
 *  external traffic only; a 127.0.0.1 self-ping would NOT keep it awake.
 *
 * Target resolution (first match wins):
 *   1. PRESTREAM_SELF_PING_URL — explicit override, e.g. https://example.com
 *   2. RENDER_EXTERNAL_URL     — set automatically by Render at runtime
 *   unset  → keep-alive disabled (local dev stays quiet)
 * Set PRESTREAM_SELF_PING=off to force-disable even when a URL is known.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Install the DoH-backed global fetch dispatcher before any route
  // handler gets a chance to fetch. Dynamic import keeps Edge happy.
  const { installResolver } = await import('./lib/resolver');
  installResolver();

  const base = (
    process.env.PRESTREAM_SELF_PING_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  if (!base || process.env.PRESTREAM_SELF_PING === 'off') return;

  const url = `${base}/api/health`;
  const INTERVAL_MS = 60_000; // once per minute — far below Render's 15-min idle window
  const PING_TIMEOUT_MS = 10_000;

  const ping = async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) console.warn(`[keep-alive] ${url} responded ${res.status}`);
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      // transient network hiccup — the next tick retries; only log it
      console.warn(`[keep-alive] ping failed: ${(err as Error).message}`);
    }
  };

  // first ping shortly after boot (register() runs before the socket is
  // listening), then a steady once-a-minute cadence forever after
  const kick = setTimeout(() => {
    void ping();
    const loop: ReturnType<typeof setInterval> = setInterval(() => void ping(), INTERVAL_MS);
    // never hold the event loop open on server shutdown
    (loop as { unref?: () => void }).unref?.();
  }, 20_000);
  (kick as { unref?: () => void }).unref?.();

  console.log(`[keep-alive] self-ping ${url} every ${INTERVAL_MS / 1000}s`);
}
