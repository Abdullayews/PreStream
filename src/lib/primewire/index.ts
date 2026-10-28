/**
 * PrimeWire service — high-level LIVE functions used by the API routes.
 *
 * POLICY: NO caching of movie/catalog data —
 * every call scrapes PrimeWire fresh. `coalesce()` only merges concurrent
 * duplicate loads (in-flight dedup); it never stores results.
 */
import { coalesce } from './cache';
import { detailPath, fetchPage, searchSignature, sourceUrl, PRIMARY_MIRROR, PrimeWireError } from './client';
import {
  embedParams, parseDetailPage, parseEmbedPath, parseListPage, parsePlaylistDetailPage,
  parsePlaylistsPage, parseSchedulePage,
} from './parser';
import type {
  AutocompleteKind, AutocompleteResult, BrowseParams, BrowseResponse, Episode,
  HomeResponse, HomeRow, MediaDetail, MediaType, PlayerEpisodePointer, PlayerEpisodeRef,
  PlayerResponse, PlayerSource, PlaylistDetail, PlaylistsResponse, ScheduleResponse,
} from './types';

/* ------------------------------------------------------------------ */
/* Browse / search                                                     */
/* ------------------------------------------------------------------ */

function buildFilterPath(params: BrowseParams): string {
  const q = new URLSearchParams();
  q.set('e', 'v'); // present in PrimeWire's own pagination links; harmless

  if (params.q && params.q.trim()) {
    const term = params.q.trim();
    q.set('s', term);
    q.set('ds', searchSignature(term));
  }
  if (params.type === 'movie' || params.type === 'tv') q.set('type', params.type);
  for (const g of params.genres ?? []) q.append('genre[]', g);
  if (params.sort) q.set('sort', params.sort);
  if (params.direction === 'asc' || params.direction === 'desc') q.set('direction', params.direction);
  if (params.yearFrom) q.set('released_after', `${params.yearFrom}-01-01`);
  if (params.yearTo) q.set('released_before', `${params.yearTo}-12-31`);
  if (params.ratingAbove) q.set('rating_above', String(params.ratingAbove));
  if (params.country) q.set('country', params.country);
  if (params.cast) q.set('cast', params.cast);
  if (params.quality) q.set('quality', params.quality);
  if (params.page && params.page > 1) q.set('page', String(params.page));

  return `/filter?${q.toString()}`;
}

function browseCacheKey(params: BrowseParams): string {
  return `browse:${JSON.stringify(params)}`;
}

export async function browseMedia(params: BrowseParams): Promise<BrowseResponse> {
  return coalesce(browseCacheKey(params), async () => {
    const path = buildFilterPath(params);
    const html = await fetchPage(path);
    const parsed = parseListPage(html);
    return {
      items: parsed.items,
      page: parsed.page,
      pages: parsed.pages,
      hasNext: parsed.hasNext,
      params,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

export async function getDetail(type: MediaType, id: number, slug = ''): Promise<MediaDetail> {
  const key = `detail:${type}:${id}`;
  return coalesce(key, async () => {
    const path = detailPath(type, id, slug);
    const html = await fetchPage(path);
    const detail = parseDetailPage(html, type, id, slug);
    // Fill slug from canonical if we fetched with a dummy
    if (!slug) {
      detail.slug = slugFromHtml(html, type, id) ?? detail.slug;
    }
    detail.sourceUrl = sourceUrl(type, detail.id, detail.slug);
    return detail;
  });
}

function slugFromHtml(html: string, _type: MediaType, _id: number): string | null {
  const m = /<link rel="canonical" href="https?:\/\/[^/]+\/(?:movie|tv)\/\d+-([^"]+)"/.exec(html);
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/* Schedule                                                            */
/* ------------------------------------------------------------------ */

export async function getSchedule(): Promise<ScheduleResponse> {
  return coalesce('schedule:v1', async () => {
    const html = await fetchPage('/schedule');
    return { days: parseSchedulePage(html), updatedAt: new Date().toISOString() };
  });
}

/* ------------------------------------------------------------------ */
/* Playlists                                                           */
/* ------------------------------------------------------------------ */

export async function getPlaylists(page = 1): Promise<PlaylistsResponse> {
  const p = Math.max(1, Math.min(50, Math.floor(page) || 1));
  return coalesce(`playlists:${p}`, async () => {
    const html = await fetchPage(p > 1 ? `/playlists?page=${p}` : '/playlists');
    return parsePlaylistsPage(html);
  });
}

export async function getPlaylistDetail(id: number, slug = ''): Promise<PlaylistDetail> {
  return coalesce(`playlist:${id}`, async () => {
    const html = await fetchPage(`/playlist/${id}-${slug || 'x'}`);
    const detail = parsePlaylistDetailPage(html, id, slug);
    detail.sourceUrl = `${PRIMARY_MIRROR}/playlist/${detail.id}-${detail.slug}`;
    return detail;
  });
}

/* ------------------------------------------------------------------ */
/* Autocomplete (people / countries / services / companies)            */
/* ------------------------------------------------------------------ */

const AUTOCOMPLETE_KINDS: readonly AutocompleteKind[] = ['people', 'countries', 'services', 'companies'];

export async function autocomplete(kind: AutocompleteKind, term: string): Promise<AutocompleteResult[]> {
  const t = term.trim().slice(0, 60);
  if (!t) return [];
  return coalesce(`ac:${kind}:${t.toLowerCase()}`, async () => {
    const html = await fetchPage(`/search/${kind}?term=${encodeURIComponent(t)}`);
    try {
      const data = JSON.parse(html) as { results?: { id?: string; text?: string }[] };
      return (data.results ?? [])
        .filter((r) => typeof r.text === 'string' && r.text.trim())
        .slice(0, 12)
        .map((r) => ({ id: String(r.id ?? r.text), text: r.text!.trim() }));
    } catch {
      return [];
    }
  });
}

export { AUTOCOMPLETE_KINDS };

/* ------------------------------------------------------------------ */
/* Home assembly                                                       */
/* ------------------------------------------------------------------ */

interface RowSpec {
  key: string;
  title: string;
  params: BrowseParams;
}

const HOME_ROW_SPECS: RowSpec[] = [
  { key: 'trending-today', title: 'Trending Today', params: { sort: 'Trending Today' } },
  { key: 'popular-week', title: 'Popular This Week', params: { sort: 'Trending this Week' } },
  { key: 'just-added-movies', title: 'Just Added Movies', params: { sort: 'Just Added', type: 'movie' } },
  { key: 'new-tv', title: 'New & Fresh TV', params: { sort: 'Just Added', type: 'tv' } },
  { key: 'top-rated', title: 'Top Rated of All Time', params: { sort: 'External Rating' } },
  { key: 'in-theaters', title: 'In Theaters Now', params: { sort: 'In Theaters', type: 'movie' } },
  { key: 'action', title: 'Action & Adventure', params: { sort: 'Popular', genres: ['Action'] } },
  { key: 'comedy', title: 'Comedy Corner', params: { sort: 'Popular', genres: ['Comedy'] } },
];

const HERO_COUNT = 5;

export async function getHome(): Promise<HomeResponse> {
  return coalesce('home:v1', async () => {
    // Fetch all rows in parallel (each individually coalesced — never stored)
    const rows: HomeRow[] = await Promise.all(
      HOME_ROW_SPECS.map(async (spec) => {
        const res = await browseMedia({ ...spec.params, page: 1 });
        const flatParams: Record<string, string> = {};
        if (spec.params.type) flatParams.type = spec.params.type;
        if (spec.params.sort) flatParams.sort = spec.params.sort;
        if (spec.params.genres?.length) flatParams.genre = spec.params.genres.join(',');
        return { key: spec.key, title: spec.title, items: res.items, params: flatParams };
      }),
    );

    // Hero: top trending items enriched with detail data
    const heroBase = (rows[0]?.items ?? []).slice(0, HERO_COUNT);
    const hero = await Promise.all(
      heroBase.map(async (item) => {
        try {
          const d = await getDetail(item.type, item.id, item.slug);
          return {
            ...item,
            description: d.description,
            genres: d.genres,
            tmdbRating: d.tmdbRating,
          };
        } catch {
          return { ...item, description: null, genres: [], tmdbRating: null };
        }
      }),
    );

    return { hero, rows, updatedAt: new Date().toISOString() };
  });
}

/* ------------------------------------------------------------------ */
/* Player (PrimeWire's embeddable player + user-submitted sources)     */
/* ------------------------------------------------------------------ */

/**
 * Where to serve PrimeWire's embeddable player (PrimeSrc app) from.
 *
 * Facts (verified on the live mirrors):
 *  - The player app is identical on primewire.pw/embed/*, primewire.zip/embed/*
 *    and primesrc.me/embed/* (byte-identical JS), and every origin ships
 *    `frame-ancestors *` on /embed/*.
 *  - primesrc.me fronts /embed/* with a Cloudflare *managed challenge*
 *    ("Just a moment…") — a stall/flash risk inside our iframe. The two
 *    PrimeWire mirrors serve /embed/* directly, no challenge.
 *  - The player keeps a `prefered_server` key in its origin's localStorage
 *    that overrides our `serverOrder` param. Visitors are far likelier to
 *    have played (and stored a pick) on primewire.pw than on the .zip
 *    mirror, so .zip gives the cleanest storage AND the challenge-free
 *    embed. That combination is why .zip is the embed origin.
 *  - `serverOrder=HostA,HostB` (camelCase) re-orders the player's server
 *    menu and auto-plays the first entry — per-HOST control only. The
 *    sources API returns links in RANDOM order on every call, so which
 *    link of the host plays is a draw; exact-link choice is only possible
 *    through the player's own in-frame server menu (which is why our UI
 *    leaves it uncovered).
 */
const PLAYER_ORIGIN = 'https://primewire.zip';

/** Re-host a parsed /embed/… path on the PrimeSrc origin. */
function playerEmbedUrl(embedPath: string): string {
  return `${PLAYER_ORIGIN}${embedPath.startsWith('/') ? '' : '/'}${embedPath}`;
}

/**
 * PrimeWire's sources API (`/api/v1/s`) — the same JSON the PrimeSrc player
 * itself uses to list video hosts (Filemoon, Voe, …) for a movie or episode.
 * Works server-side without Cloudflare friction (plain JSON endpoint).
 *
 * THE `tmdb` PARAM MATTERS: with it, PrimeWire's API drops links the player
 * can never play — verified live on GoT S1E1/S1E2: the PrimeVid link
 * (audio_type "dub") is excluded when `tmdb` is passed (exactly how the
 * player itself always calls it) but included without it. Offering such a
 * link is a silent lie — picking that host in our UI would make the player
 * fall back to a RANDOM other host. Always pass tmdb when we know it
 * (we do — it ships in the embed params of every title page).
 */
export async function getSources(
  type: MediaType,
  sId: number,
  eId?: number,
  tmdb?: number,
): Promise<PlayerSource[]> {
  const key = `sources:${type}:${sId}:${eId ?? 0}:${tmdb ?? 0}`;
  return coalesce(key, async () => {
    let path = `/api/v1/s?type=${type}&s_id=${sId}`;
    if (eId) path += `&e_id=${eId}`;
    if (tmdb && Number.isFinite(tmdb)) path += `&tmdb=${tmdb}`;
    try {
      const json = await fetchPage(path);
      const data = JSON.parse(json) as {
        servers?: { name?: string; file_name?: string | null; file_size?: string | null;
                    key?: string; quality?: string | null; audio_language?: string | null;
                    audio_type?: string | null }[];
      };
      return (data.servers ?? [])
        .filter((s) => s && typeof s.key === 'string' && s.key.length > 0)
        .slice(0, 60)
        .map((s) => ({
          host: (s.name ?? 'Link').trim() || 'Link',
          fileName: s.file_name?.trim() || null,
          fileSize: s.file_size?.trim() || null,
          quality: s.quality?.trim() || null,
          audioLanguage: s.audio_language?.trim() || null,
          audioType: s.audio_type?.trim() || null,
          goUrl: `${PRIMARY_MIRROR}/links/gos/${s.key}`,
        }));
    } catch {
      // 404 / missing sources / parse issues — treat as "no sources"
      return [];
    }
  });
}

export interface PlayerParams {
  type: MediaType;
  id: number;
  slug: string;
  /** TV only — 1-based season */
  season?: number;
  /** TV only — episode number within the season */
  number?: number;
}

/** Fetch an episode page live (per href; concurrent fetches coalesced). */
async function episodePage(href: string): Promise<string> {
  return coalesce(`ephtml:${href}`, () => fetchPage(href));
}

/**
 * Resolve everything the in-app player needs for one movie or TV episode:
 * PrimeWire's embeddable player URL, the episode list (TV), neighbour
 * episodes and the user-submitted source list.
 */
export async function getPlayer(params: PlayerParams): Promise<PlayerResponse> {
  const { type, id, slug } = params;

  if (type === 'movie') {
    const detail = await getDetail('movie', id, slug);
    const mparams = embedParams(detail.embedPath);
    const tmdbId = mparams.tmdb_id ? parseInt(mparams.tmdb_id, 10) : NaN;
    const [sources] = await Promise.all([
      getSources('movie', id, undefined, Number.isFinite(tmdbId) ? tmdbId : undefined),
    ]);
    return {
      type: 'movie',
      id: detail.id,
      slug: detail.slug,
      title: detail.title,
      year: detail.year,
      poster: detail.poster,
      embedUrl: detail.embedPath ? playerEmbedUrl(detail.embedPath) : null,
      sourceUrl: detail.sourceUrl,
      season: null,
      number: null,
      episodeName: null,
      airDate: null,
      prev: null,
      next: null,
      episodes: [],
      sources,
      tmdbId: Number.isFinite(tmdbId) ? tmdbId : null,
      videoId: null,
    };
  }

  /* ---------------- TV episode ---------------- */
  const detail = await getDetail('tv', id, slug);
  if (detail.seasons.length === 0) {
    throw new PrimeWireError('This series has no episodes yet', 404);
  }

  // Resolve the target episode (explicit, else the first released one)
  let target: Episode | null = null;
  if (params.season != null && params.number != null) {
    target =
      detail.seasons
        .find((s) => s.season === params.season)
        ?.episodes.find((e) => e.number === params.number) ?? null;
  }
  if (!target) {
    outer: for (const s of detail.seasons) {
      for (const e of s.episodes) {
        if (e.released) { target = e; break outer; }
      }
    }
  }
  if (!target) target = detail.seasons[0].episodes[0] ?? null;
  if (!target) {
    throw new PrimeWireError('Episode not found', 404);
  }

  const html = await episodePage(target.href);
  const embedPath = parseEmbedPath(html);
  const eparams = embedParams(embedPath);
  const eId = eparams.e_id ? parseInt(eparams.e_id, 10) : NaN;
  const tmdbId = eparams.tmdb_id ? parseInt(eparams.tmdb_id, 10) : NaN;
  const sources = Number.isFinite(eId)
    ? await getSources('tv', detail.id, eId, Number.isFinite(tmdbId) ? tmdbId : undefined)
    : [];

  // Neighbours + compact episode list (season order)
  const flat: PlayerEpisodeRef[] = [];
  for (const s of detail.seasons) {
    for (const e of s.episodes) {
      flat.push({ season: s.season, number: e.number, name: e.name, released: e.released });
    }
  }
  const idx = flat.findIndex((e) => e.season === target!.season && e.number === target!.number);
  const prev: PlayerEpisodePointer | null = idx > 0
    ? { season: flat[idx - 1].season, number: flat[idx - 1].number }
    : null;
  const next: PlayerEpisodePointer | null = idx >= 0 && idx < flat.length - 1
    ? { season: flat[idx + 1].season, number: flat[idx + 1].number }
    : null;

  return {
    type: 'tv',
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    year: detail.year,
    poster: detail.poster,
    embedUrl: embedPath ? playerEmbedUrl(embedPath) : null,
    sourceUrl: `${PRIMARY_MIRROR}${target.href}`,
    season: target.season,
    number: target.number,
    episodeName: target.name,
    airDate: target.airDate,
    tmdbId: Number.isFinite(tmdbId) ? tmdbId : null,
    videoId: Number.isFinite(eId) ? eId : null,
    prev,
    next,
    episodes: flat,
    sources,
  };
}
