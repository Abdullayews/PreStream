/**
 * External embeddable providers — "other sources" beyond PrimeWire's own
 * host list, in the same embeddable-player format.
 *
 * All of these providers address titles by TMDB id — the very id PrimeWire
 * ships in its embed params (`/embed/movie?s_id=…&tmdb_id=…`), which
 * getPlayer() surfaces as `tmdbId`. Every provider below:
 *  - serves HTTP 200 on the exact movie AND TV episode URLs
 *  - no X-Frame-Options / no restrictive frame-ancestors → built to be iframed
 *  - a real player page (jwplayer / <video> / multi-server picker)
 *
 * IFRAME SANDBOX POLICY (the "sandbox environment" workaround):
 * Most of these players ship an explicit sandbox DETECTOR — they walk the
 * ancestor frames, and if ANY of them carries a `sandbox` attribute they
 * refuse to play, replacing the page with "Sandbox not allowed / Please
 * Disable Sandbox" (2Embed's wrapper, videm.xyz, vidsrc.buzz and VidLink
 * and VidFast all do `frameElement.hasAttribute('sandbox')`, plus
 * document-domain / PDF-object / popup fallback probes). The detection is
 * presence-based — ANY sandbox attribute, however permissive, is rejected —
 * so those providers must be embedded WITHOUT the attribute at all. That
 * is also how the providers' own share snippets and the wider embed
 * ecosystem do it. The price: their pages can open ad popups on click, the
 * same as visiting them directly. PrimeWire's own player (primesrc.me) is
 * the exception — it was built sandbox-tolerant and keeps its sandbox
 * (scripts + same-origin + forms, pop-ups off).
 *
 * Like PrimeWire's own hosts, these are third-party services that rotate
 * and die — healthProbe() re-checks the EXACT urls (5-min cache) so the
 * picker can badge providers live, same as PrimeWire host rows. (Nunflix
 * was removed from this registry on 2026-04 after its domain became a
 * parked `/lander` redirect stub; 111movies / autoembed / vidsrc.xyz /
 * vidora / superembed were probed and are parked, blank or dead too.)
 */

import { coalesce } from './cache';

export type ProviderStatus = 'ready' | 'dead' | 'unknown';

export interface ExternalProvider {
  /** Stable id used in selection state + the watch log. */
  id: string;
  /** Display name shown in the picker. */
  name: string;
  /** One-line description of what the provider is. */
  note: string;
  /** Movie embed URL by TMDB id. */
  movieUrl: (tmdb: number) => string;
  /** TV episode embed URL by TMDB id + season/episode. */
  tvUrl: (tmdb: number, season: number, episode: number) => string;
  /**
   * The iframe `sandbox` attribute to use, or null to embed with NO
   * sandbox attribute (see the header comment: several providers detect
   * and refuse ANY sandbox). Shipped to the client through ProviderHealth
   * so the player renders the right iframe per provider.
   */
  sandbox: string | null;
}

/**
 * The verified provider registry.
 *
 *  - VidSrc — the largest aggregator (wraps vsembed.ru; its wrapper page is
 *    challenge-free and has NO sandbox detector, so it keeps the sandbox
 *    attribute, which also keeps its wrapper's pop-under ads stripped).
 *  - VidLink — jwplayer based, resolves one good source automatically.
 *    (Sandbox detector: "Please Disable Sandbox" — embedded without it.)
 *  - VidFast — fully self-contained <video> player (no nested iframes).
 *    (Sandbox detector: "Please Disable Sandbox" — embedded without it.)
 *  - 2Embed — a multi-SERVER picker in one embed (Vsrc · Videm · Vcr) —
 *    the closest analogue to PrimeWire's own host list.
 *    (Sandbox detector: "Sandbox not allowed" overlay on its play button.)
 *  - Videm — 2Embed's strongest standalone server, as a direct embed —
 *    its own adaptive multi-CDN player (7+ servers raced per title).
 *    (Sandbox detector: walks ancestors + popup probe — embedded without
 *    it. Also refuses TOP-LEVEL visits: 403 unless loaded as an iframe.)
 *  - Videasy — alternate aggregator (replaced Nunflix after its domain
 *    parked; no sandbox detector found in its shell or chunks, but it is
 *    embedded without the attribute like its peers for consistency).
 */
export const EXTERNAL_PROVIDERS: ExternalProvider[] = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    note: 'Largest multi-host aggregator',
    movieUrl: (tmdb) => `https://vidsrc.to/embed/movie/${tmdb}`,
    tvUrl: (tmdb, s, e) => `https://vidsrc.to/embed/tv/${tmdb}/${s}-${e}`,
    // No sandbox detector in the wrapper (verified) — keep the sandbox:
    // the wrapper's own pop-under ad scripts stay blocked by it.
    sandbox: 'allow-scripts allow-same-origin allow-forms',
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    note: 'Auto-resolving jwplayer',
    movieUrl: (tmdb) => `https://vidlink.pro/movie/${tmdb}`,
    tvUrl: (tmdb, s, e) => `https://vidlink.pro/tv/${tmdb}/${s}/${e}`,
    sandbox: null,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    note: 'Self-contained player, no nested hosts',
    movieUrl: (tmdb) => `https://vidfast.vc/movie/${tmdb}`,
    tvUrl: (tmdb, s, e) => `https://vidfast.vc/tv/${tmdb}/${s}/${e}`,
    sandbox: null,
  },
  {
    id: '2embed',
    name: '2Embed',
    note: 'Multi-server picker (Vsrc · Videm · Vcr)',
    movieUrl: (tmdb) => `https://www.2embed.cc/embed/${tmdb}`,
    // NOTE: the &s=&e= tail is literal — 2Embed's own embedtv path format.
    tvUrl: (tmdb, s, e) => `https://www.2embed.cc/embedtv/${tmdb}&s=${s}&e=${e}`,
    sandbox: null,
  },
  {
    id: 'videm',
    name: 'Videm',
    note: 'Adaptive multi-CDN player (2Embed server)',
    movieUrl: (tmdb) => `https://videm.xyz/embed/movie/${tmdb}`,
    tvUrl: (tmdb, s, e) => `https://videm.xyz/embed/tv/${tmdb}/${s}/${e}`,
    sandbox: null,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    note: 'Alternate aggregator',
    movieUrl: (tmdb) => `https://player.videasy.to/movie/${tmdb}`,
    tvUrl: (tmdb, s, e) => `https://player.videasy.to/tv/${tmdb}/${s}/${e}`,
    sandbox: null,
  },
];

export function findExternalProvider(id: string): ExternalProvider | undefined {
  return EXTERNAL_PROVIDERS.find((p) => p.id === id);
}

/** Resolve the exact embed URL for one provider + title. */
export function externalProviderUrl(
  provider: ExternalProvider,
  args: { type: 'movie' | 'tv'; tmdb: number; season?: number | null; number?: number | null },
): string {
  if (args.type === 'tv') {
    return provider.tvUrl(args.tmdb, args.season ?? 1, args.number ?? 1);
  }
  return provider.movieUrl(args.tmdb);
}

/* ------------------------------------------------------------------ */
/* Health prober                                                       */
/* ------------------------------------------------------------------ */

export interface ProviderHealth {
  id: string;
  name: string;
  /** One-line description from the registry. */
  note: string;
  url: string;
  status: ProviderStatus;
  /**
   * The iframe sandbox attribute for this provider, or null = embed with
   * NO sandbox attribute (providers that detect and refuse any sandbox).
   */
  sandbox: string | null;
  checkedAt: string;
}

const PROBE_TIMEOUT_MS = 6000;

/**
 * Probe with REAL iframe-navigation headers. Plain UA+Accept is not
 * enough: videm.xyz and vidsrc.buzz 403 requests that lack the
 * Sec-Fetch-iframe trio (their hotlink protection), which used to badge
 * them "unverified" even though they serve browsers fine.
 */
const PROBE_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'iframe',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'cross-site',
  'Upgrade-Insecure-Requests': '1',
};

const PARKED_REDIRECT_RE = /location\.(href|replace)\s*[=(]/i;

async function probeProviderOnce(
  provider: ExternalProvider,
  url: string,
): Promise<ProviderHealth> {
  const now = new Date().toISOString();
  const base = { id: provider.id, name: provider.name, note: provider.note, url, sandbox: provider.sandbox };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: PROBE_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (res.status >= 401 && res.status <= 429) {
      // Bot-gate / rate-limit interstitial — the provider may still play in
      // a real browser; carry no framing verdict.
      return { ...base, status: 'unknown', checkedAt: now };
    }
    if (res.status >= 400) {
      return { ...base, status: 'dead', checkedAt: now };
    }

    // Parked-domain detection: a healthy embed page is a real player page
    // (dozens of KB). A tiny HTML body whose only content is a JS redirect
    // (e.g. nunflix.com → /lander, 111movies' blank stub) is a parked page
    // — badge it dead no matter the 200.
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    if (ct.includes('text/html')) {
      const lenHeader = parseInt(res.headers.get('content-length') ?? '', 10);
      if (!Number.isFinite(lenHeader) || lenHeader < 1024) {
        const body = (await res.text()).slice(0, 2048);
        if (body.length < 1024 && PARKED_REDIRECT_RE.test(body) && !body.includes('<video')) {
          return { ...base, status: 'dead', checkedAt: now };
        }
      }
    }

    const xfo = (res.headers.get('x-frame-options') ?? '')
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);
    const csp = (res.headers.get('content-security-policy') ?? '').toLowerCase();
    const fa = /frame-ancestors\s+([^;]+)/.exec(csp)?.[1]?.trim() ?? '';
    const blocked =
      xfo.some((v) => v === 'DENY' || v === 'SAMEORIGIN' || v.startsWith('SAMEORIGIN')) ||
      (fa.length > 0 && fa !== '*');
    return {
      ...base,
      status: blocked ? 'dead' : 'ready',
      checkedAt: now,
    };
  } catch {
    return { ...base, status: 'dead', checkedAt: now };
  }
}

/**
 * Health of every provider for one exact title — probed LIVE on every
 * call (movie-related data is never cached anywhere;
 * concurrent probes for the same URL are only coalesced in-flight).
 */
export async function checkExternalProviders(args: {
  type: 'movie' | 'tv';
  tmdb: number;
  season?: number | null;
  number?: number | null;
}): Promise<ProviderHealth[]> {
  return Promise.all(
    EXTERNAL_PROVIDERS.map((provider) => {
      const url = externalProviderUrl(provider, args);
      // Shared coalescer: concurrent identical probes share ONE live
      // upstream check; nothing is stored between requests.
      return coalesce<ProviderHealth>(`health:${url}`, async () => {
        let entry = await probeProviderOnce(provider, url);
        if (entry.status !== 'ready') {
          // one retry — transient blips (bot-gates, rate limits) shouldn't
          // badge a provider offline or unverified
          await new Promise((r) => setTimeout(r, 700));
          entry = await probeProviderOnce(provider, url);
        }
        return entry;
      });
    }),
  );
}
