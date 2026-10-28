/**
 * Single-flight coalescer — the ONLY shared helper for upstream loads.
 *
 * POLICY: movie/catalog data must NEVER be cached in any form. The ONLY
 * cache allowed anywhere in the app is USER data (account/profile/theme
 * in the user store and the browser's react-query user hooks).
 *
 * What this module now does — and the only thing it does:
 *  - CONCURRENT DEDUP: if two requests for the same key arrive while a
 *    first upstream load is still in flight, they all await that ONE
 *    in-flight promise (thundering-herd protection). The instant the
 *    load settles, the promise is dropped — NOTHING is stored, so the
 *    next request always fetches live data.
 *
 * Characterization contract (tests/cache.test.ts rewritten to match):
 *   two concurrent loads for one key → exactly ONE loader execution;
 *   two sequential loads → TWO loader executions (no storage).
 */

/** In-flight loaders — concurrent requests for the same key share one load. */
const inflight = new Map<string, Promise<unknown>>();

/**
 * Run `loader()` for `key`, coalescing only CONCURRENT calls. Nothing is
 * ever stored: once the load settles the next request goes upstream again.
 */
export async function coalesce<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const p = (async () => {
    try {
      return await loader();
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}
