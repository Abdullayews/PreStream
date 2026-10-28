/**
 * PrimeWire HTTP client — mirror failover, browser-like headers, timeouts.
 * Notes:
 *  - Working mirrors: primewire.pw (primary), primewire.zip (fallback)
 *  - No JS challenge on these mirrors; plain HTTP works
 *  - Title search requires `ds` param = sha1(s + SALT).slice(0, 10)
 */
import { createHash } from 'crypto';

const MIRRORS = ['https://primewire.pw', 'https://primewire.zip'] as const;

/** Salt used by PrimeWire's own JS to sign search terms. */
const SEARCH_SALT = 'JyjId97F9PVqUPuMO0';

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export class PrimeWireError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'PrimeWireError';
    this.status = status;
  }
}

/** ds signature for title search (sha1(s + salt), first 10 hex chars). */
export function searchSignature(term: string): string {
  return createHash('sha1').update(term + SEARCH_SALT, 'utf8').digest('hex').slice(0, 10);
}

interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
}

/**
 * Fetch a PrimeWire page as HTML text, trying mirrors in order.
 * `path` must start with "/". Query params should already be encoded.
 */
export async function fetchPage(
  path: string,
  { timeoutMs = 12000, retries = 1 }: FetchOptions = {},
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const base of MIRRORS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(base + path, {
          headers: HEADERS,
          redirect: 'follow',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timer);

        if (res.status === 401) {
          throw new PrimeWireError('PrimeWire rejected the request (unauthorized)', 502);
        }
        if (res.status === 404) {
          throw new PrimeWireError('Not found on PrimeWire', 404);
        }
        if (!res.ok) {
          throw new PrimeWireError(`PrimeWire responded ${res.status}`, 502);
        }
        const html = await res.text();
        // JSON payloads (autocomplete endpoints) can be tiny — only enforce
        // the minimum length for HTML documents
        const contentType = res.headers.get('content-type') ?? '';
        const isJson = contentType.includes('json') || html.trimStart().startsWith('{');
        if (!html || (!isJson && html.length < 500)) {
          throw new PrimeWireError('PrimeWire returned an empty page', 502);
        }
        return html;
      } catch (err) {
        if (err instanceof PrimeWireError && err.status === 404) throw err;
        lastError = err;
        // try next mirror
      }
    }
  }
  throw new PrimeWireError(
    `All PrimeWire mirrors failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`,
    504,
  );
}

/** Build the PrimeWire source URL (for "Watch on PrimeWire" links). */
export function sourceUrl(type: 'movie' | 'tv', id: number, slug: string): string {
  return `${MIRRORS[0]}/${type}/${id}-${slug}`;
}

/** Canonical path for a detail page (id + slug; PrimeWire redirects dummy slugs to canonical). */
export function detailPath(type: 'movie' | 'tv', id: number, slug: string): string {
  return `/${type}/${id}-${slug || 'x'}`;
}

export const PRIMARY_MIRROR = MIRRORS[0];
