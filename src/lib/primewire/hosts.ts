/**
 * PrimeWire video-host registry, health prober and priority ordering.
 *
 * Notes:
 *  - PrimeWire publishes its approved hosts at /approved_hosts with canonical
 *    domains (dood.watch, filemoon.sx, voe.sx, …).
 *  - The in-page player (PrimeSrc) is served from primewire.pw/embed/*,
 *    primewire.zip/embed/* (used by this app) and primesrc.me/embed/* (which
 *    is fronted by a Cloudflare managed challenge); all ship
 *    `frame-ancestors *`. It accepts `serverOrder=HostA,HostB` which
 *    re-orders its server menu and auto-plays the first host — our hook for
 *    per-host playback control.
 *  - IMPORTANT: PrimeWire's sources API returns each host's links in RANDOM
 *    order on every call, so the player auto-plays a random link of the
 *    chosen host. Exact per-link choice is only possible through the
 *    player's own in-frame server menu (its numbered rows) — which is why
 *    our player UI leaves that menu uncovered. A "broken" host pick is
 *    usually a dead file draw, not a broken host.
 *  - Host embed pages are loaded in a *nested* iframe created by the player,
 *    so a host that sends X-Frame-Options / restrictive frame-ancestors can
 *    NEVER play inside the player (it would render a blank frame on
 *    primewire.pw too). We probe for that and surface it in the UI.
 *  - Host domains rotate and die constantly; health is probed LIVE on
 *    every player view (nothing but user data is cached;
 *    concurrent probes only coalesce in-flight).
 */

import { coalesce } from './cache';

export type HostStatus = 'ready' | 'external' | 'dead' | 'unknown';

export interface HostHealth {
  host: string;
  /** Canonical domain from PrimeWire's approved-hosts registry (when known). */
  domain: string | null;
  status: HostStatus;
  /** ISO timestamp of the probe that produced this status. */
  checkedAt: string | null;
}

/** PrimeWire's approved hosts (https://primewire.pw/approved_hosts) + embed path pattern used for framing probes. */
export const APPROVED_HOSTS: Record<string, { domain: string; probePath: string }> = {
  'Abyssplayer': { domain: 'player.abyssplayer.com', probePath: '/e/x' },
  'Archive': { domain: 'archive.org', probePath: '/' },
  'Bigshare': { domain: 'bigshare.io', probePath: '/e/x' },
  'Dailymotion': { domain: 'dailymotion.com', probePath: '/video/x' },
  'Dood': { domain: 'dood.watch', probePath: '/e/x' },
  'Filelions': { domain: 'filelions.to', probePath: '/v/x' },
  'Filemoon': { domain: 'filemoon.sx', probePath: '/e/x' },
  'Luluvdoo': { domain: 'luluvdoo.com', probePath: '/e/x' },
  'Mixdrop': { domain: 'mixdrop.ag', probePath: '/e/x' },
  'PrimeVid': { domain: 'primevid.click', probePath: '/e/x' },
  'Savefiles': { domain: 'savefiles.com', probePath: '/' },
  'Streamplay': { domain: 'streamplay.to', probePath: '/v/x' },
  'Streamruby': { domain: 'streamruby.com', probePath: '/e/x' },
  'Streamtape': { domain: 'streamtape.com', probePath: '/e/x' },
  'Streamwish': { domain: 'streamwish.to', probePath: '/e/x' },
  'Upzur': { domain: 'upzur.com', probePath: '/e/x' },
  'Vidara': { domain: 'vidara.so', probePath: '/e/x' },
  'Vidmoly': { domain: 'vidmoly.me', probePath: '/e/x' },
  'Vidnest': { domain: 'vidnest.io', probePath: '/e/x' },
  'VidsST': { domain: 'vids.st', probePath: '/e/x' },
  'Vimeo': { domain: 'vimeo.com', probePath: '/' },
  'Vinovo': { domain: 'vinovo.to', probePath: '/e/x' },
  'Voe': { domain: 'voe.sx', probePath: '/e/x' },
  'Youtube': { domain: 'youtube.com', probePath: '/' },
};

/**
 * Hosts that send X-Frame-Options SAMEORIGIN/DENY (or restrictive
 * frame-ancestors) on their player pages — verified by direct probing.
 * These can NEVER be embedded in any PrimeSrc player; the UI marks them
 * "opens externally only".
 */
const STATIC_UNEMBEDDABLE = new Set(['Vidmoly', 'Streamruby']);

/**
 * Playback priority — the default source is the first healthy host in this
 * order. Voe/Dood/Streamtape are the most reliable stream hosts. Filemoon is
 * deliberately LAST-but-one: its DOMAIN is healthy (verified — plays fine on
 * primewire.pw), but for older titles many of its individual files are
 * DMCA-rotted, and the player auto-plays a random file of the host — so it
 * stays at the bottom of the default order while remaining fully pickable.
 */
export const HOST_PRIORITY = [
  'Voe',
  'Dood',
  'Streamtape',
  'Filelions',
  'Streamwish',
  'Mixdrop',
  'PrimeVid',
  'Luluvdoo',
  'Vidara',
  'Vinovo',
  'Streamplay',
  'Savefiles',
  'Bigshare',
  'Upzur',
  'Vidnest',
  'Abyssplayer',
  'Archive',
  'Dailymotion',
  'Vimeo',
  'Youtube',
  'Filemoon',
  'Vidmoly',
  'Streamruby',
  'VidsST',
] as const;

/** Fallback priority rank for hosts missing from HOST_PRIORITY. */
export function hostPriorityRank(host: string): number {
  const idx = (HOST_PRIORITY as readonly string[]).indexOf(host);
  return idx === -1 ? HOST_PRIORITY.length : idx;
}

/* ------------------------------------------------------------------ */
/* Health prober                                                       */
/* ------------------------------------------------------------------ */

const PROBE_TIMEOUT_MS = 5000;
const PROBE_RETRIES = 1; // one retry before believing a dead verdict

const PROBE_HEADERS: Record<string, string> = {
  // NOTE: deliberately a plain browser UA; hosts vary in bot tolerance but
  // we only read response headers, so the body's bot-gate doesn't matter.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/** Probe one host's canonical domain once: alive, and does it allow framing? */
async function probeHostOnce(host: string): Promise<HostHealth> {
  const meta = APPROVED_HOSTS[host];
  const now = new Date().toISOString();
  if (!meta) {
    return { host, domain: null, status: 'unknown', checkedAt: now };
  }

  let alive = false;
  /** null = no signal (bot-gated), true = framable, false = framing denied. */
  let framable: boolean | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`https://${meta.domain}${meta.probePath}`, {
      method: 'GET',
      redirect: 'follow',
      headers: PROBE_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    alive = res.status < 500;

    // Framing headers only carry a verdict on a REAL page (2xx/3xx) or a
    // server-config-level 404. 401/403/429 are bot-gate interstitials whose
    // X-Frame-Options says nothing about the actual video pages.
    if (res.status < 401 || res.status === 404) {
      const xfo = (res.headers.get('x-frame-options') ?? '')
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);
      const csp = (res.headers.get('content-security-policy') ?? '').toLowerCase();
      const fa = /frame-ancestors\s+([^;]+)/.exec(csp)?.[1]?.trim() ?? '';
      // Any source list other than "*" excludes our origin.
      const faRestrictive = fa.length > 0 && fa !== '*';
      const xfoRestrictive =
        xfo.some((v) => v === 'DENY' || v === 'SAMEORIGIN' || v.startsWith('SAMEORIGIN')) ||
        xfo.some((v) => v === 'ALLOW-FROM');
      framable = !(xfoRestrictive || faRestrictive);
    }
  } catch {
    alive = false;
  }

  let status: HostStatus;
  if (!alive) status = 'dead';
  else if (framable === false || STATIC_UNEMBEDDABLE.has(host)) status = 'external';
  else if (framable === true) status = 'ready';
  else status = 'unknown'; // alive, but the host bot-gated our probe

  return { host, domain: meta.domain, status, checkedAt: now };
}

/** Probe one host, retrying failures so a transient blip can't fake a dead host. */
async function probeHost(host: string): Promise<HostHealth> {
  let result = await probeHostOnce(host);
  for (let attempt = 1; attempt <= PROBE_RETRIES && result.status === 'dead'; attempt++) {
    await new Promise((r) => setTimeout(r, 800 * attempt));
    result = await probeHostOnce(host);
  }
  return result;
}

/**
 * Health for a set of host names — probed LIVE on every call (never
 * stored; concurrent probes for the same host share one in-flight check).
 * Unknown host names (not in the approved registry) are returned as
 * "unknown" — the video may still play, we just can't verify the host's
 * domain.
 */
export async function checkHostHealth(hosts: string[]): Promise<HostHealth[]> {
  const unique = [...new Set(hosts)].slice(0, 20).filter(Boolean);
  return Promise.all(
    unique.map((host) =>
      coalesce<HostHealth>(`host:${host}`, () => probeHost(host)),
    ),
  );
}
