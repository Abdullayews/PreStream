/**
 * PrimeWire HTML parsers (cheerio).
 */
import * as cheerio from 'cheerio';
import type {
  CastMember, Episode, MediaDetail, MediaItem, MediaType, PlaylistDetail,
  PlaylistItem, PlaylistSummary, PlaylistsResponse, ScheduleDay,
  ScheduleEpisode, Season, Trailer,
} from './types';

const TMDB_RE = /^https?:\/\/image\.tmdb\.org\/(t\/p\/[a-z0-9]+\/.+)$/i;
const TVMAZE_RE = /^https?:\/\/static\.tvmaze\.com\/(uploads\/.+)$/i;

/**
 * Normalize a poster URL to a proxy-able path:
 *  - image.tmdb.org/t/p/w200/x.jpg   → /t/p/w200/x.jpg
 *  - static.tvmaze.com/uploads/...jpg → /uploads/...jpg
 */
export function tmdbPath(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const m = TMDB_RE.exec(trimmed);
  if (m) return `/${m[1]}`;
  const vm = TVMAZE_RE.exec(trimmed);
  if (vm) return `/${vm[1]}`;
  return null;
}

/** Re-size a TMDB path: "/t/p/w200/x.jpg" + "w500" → "/t/p/w500/x.jpg" (no-op for other hosts). */
export function tmdbResized(path: string | null, size: string): string | null {
  if (!path) return null;
  if (!path.startsWith('/t/p/')) return path; // tvmaze etc. — served as-is
  return path.replace(/^(\/t\/p\/)[a-z0-9]+/, `$1${size}`);
}

/** Rating from star-width: current-rating li width px on a 100px bar → 0–5. */
function ratingFromWidth(style: string | undefined): number | null {
  const m = /width:\s*([\d.]+)px/i.exec(style ?? '');
  if (!m) return null;
  const value = parseFloat(m[1]) / 20; // 100px = 5 stars
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 10) / 10;
}

function parseTitleAttr(titleAttr: string): { title: string; year: number | null } {
  const m = /\s+\((\d{4})\)\s*$/.exec(titleAttr);
  if (m) {
    return { title: titleAttr.slice(0, m.index).trim(), year: parseInt(m[1], 10) };
  }
  return { title: titleAttr.trim(), year: null };
}

export interface ListParseResult {
  items: MediaItem[];
  page: number;
  pages: number[];
  hasNext: boolean;
}

/**
 * Parse a listing page (works for /filter, /home, /movies, /tv).
 */
export function parseListPage(html: string): ListParseResult {
  const $ = cheerio.load(html);
  const items: MediaItem[] = [];

  $('div.index_item').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a[href]').first();
    const href = $a.attr('href') ?? '';
    const m = /^\/(movie|tv)\/(\d+)-([^/?#]*)/.exec(href);
    if (!m) return;
    const { title, year } = parseTitleAttr($a.attr('title') ?? '');
    if (!title) return;
    const poster = tmdbPath($el.find('img').first().attr('src'));
    const rating = ratingFromWidth($el.find('.current-rating').first().attr('style'));
    items.push({
      id: parseInt(m[2], 10),
      slug: m[3],
      type: m[1] as MediaType,
      title,
      year,
      poster,
      rating,
    });
  });

  // Pagination (sliding window — collect current + linked pages)
  let page = 1;
  const pageSet = new Set<number>([1]);
  const $pagination = $('div.pagination').first();
  if ($pagination.length) {
    const cur = parseInt($pagination.find('span.current').first().text().trim(), 10);
    if (Number.isFinite(cur)) {
      page = cur;
      pageSet.add(cur);
    }
    $pagination.find('a').each((__, a) => {
      const pm = /page=(\d+)/.exec($(a).attr('href') ?? '');
      if (pm) pageSet.add(parseInt(pm[1], 10));
    });
  }
  const pages = [...pageSet].sort((a, b) => a - b);
  const hasNext = pages.includes(page + 1);

  return { items, page, pages, hasNext };
}

/** Extract `window.trailers = [...]` array from a detail page (string-aware bracket matching). */
function parseTrailers(html: string): Trailer[] {
  const marker = 'window.trailers';
  const idx = html.indexOf(marker);
  if (idx < 0) return [];
  const eq = html.indexOf('=', idx);
  const start = html.indexOf('[', eq);
  if (eq < 0 || start < 0) return [];

  // Bracket matching that ignores brackets inside JSON string literals
  // (trailer titles can contain "[ENG SUB]" etc.)
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < Math.min(html.length, start + 200_000); i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      if (inStr) escape = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        try {
          const arr = JSON.parse(html.slice(start, i + 1)) as { title?: string; key?: string }[];
          return arr
            .filter((t) => t && typeof t.key === 'string' && t.key.length > 0)
            .slice(0, 24)
            .map((t) => ({ title: t.title ?? 'Trailer', key: t.key as string }));
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

function parseVotes(text: string | undefined): number | null {
  if (!text) return null;
  const m = /\(([\d,]+)\s*votes?\)/i.exec(text);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
}

/**
 * Parse a movie or TV detail page.
 */
export function parseDetailPage(
  html: string,
  type: MediaType,
  id: number,
  slug: string,
): MediaDetail {
  const $ = cheerio.load(html);

  // Title & year from <title> ("Spider-Man: Brand New Day (2026)  | PrimeWire")
  let title = '';
  let year: number | null = null;
  const headTitle = $('title').first().text().trim();
  const ht = /^(.*?)\s+\((\d{4})\)\s*\|/.exec(headTitle);
  if (ht) {
    title = ht[1].trim();
    year = parseInt(ht[2], 10);
  } else {
    title = headTitle.split('|')[0].trim() || `PrimeWire #${id}`;
  }

  const poster = tmdbPath($('.show_thumb img').first().attr('src'));
  const status = $('.tv_show_status').first().text().trim() || null;

  const primewireRating = ratingFromWidth($('.current-rating').first().attr('style'));
  const primewireVotes = parseVotes($('.not_voted').first().text());

  // Info table rows: <tr><td><strong>Label:</strong></td><td>…value…</td></tr>
  const genres: string[] = [];
  const aka: string[] = [];
  const countries: string[] = [];
  const companies: string[] = [];
  const cast: CastMember[] = [];
  let description: string | null = null;
  let released: string | null = null;
  let runtime: string | null = null;
  let tmdbRating: number | null = null;

  const $info = $('div.movie_info').first();

  // Description = first <p style="display:block"> inside info block
  const desc = $info.find('p[style*="display:block"], p[style*="display: block"]').first().text().trim();
  if (desc) description = desc;

  $info.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const label = ($tr.find('td strong').first().text() ?? '').replace(/:$/, '').trim();
    if (!label) return;
    const $valueTd = $tr.find('td').eq(1);
    const text = $valueTd.text().replace(/\s+/g, ' ').trim();

    switch (label) {
      case 'Ratings': {
        const m = /(\d+(?:\.\d+)?)\s*\/\s*10/.exec(text);
        tmdbRating = m ? parseFloat(m[1]) : null;
        break;
      }
      case 'Released':
        released = text || null;
        break;
      case 'Runtime':
        runtime = text || null;
        break;
      case 'Genres':
        $valueTd.find('a').each((__, a) => {
          const g = $(a).text().trim();
          if (g) genres.push(g);
        });
        break;
      case 'AKA':
        $valueTd.find('span').each((__, s) => {
          const v = $(s).text().replace(/,\s*$/, '').trim();
          if (v) aka.push(v);
        });
        break;
      case 'Countries':
        $valueTd.find('a').each((__, a) => {
          const v = $(a).text().trim();
          if (v) countries.push(v);
        });
        break;
      case 'Companies':
        $valueTd.find('a').each((__, a) => {
          const v = $(a).text().trim();
          if (v) companies.push(v);
        });
        break;
      case 'Cast':
        $valueTd.find('span.movie_info_actors a[title]').each((__, a) => {
          const name = $(a).text().trim();
          if (!name) return;
          cast.push({ name, role: $(a).attr('title') ?? null });
        });
        break;
      default:
        break;
    }
  });

  const trailers = parseTrailers(html);

  // TV seasons & episodes
  const seasons: Season[] = [];
  if (type === 'tv') {
    const seasonIds: number[] = [];
    $('h2.tv_season_header a.season-toggle').each((_, a) => {
      const sid = parseInt($(a).attr('data-id') ?? '', 10);
      if (Number.isFinite(sid)) seasonIds.push(sid);
    });
    for (const sid of seasonIds) {
      const episodes: Episode[] = [];
      $(`div.show_season[data-id="${sid}"] div.tv_episode_item`).each((_, ep) => {
        const $ep = $(ep);
        const href = $ep.find('a[href]').first().attr('href') ?? '';
        const em = /season-(\d+)-episode-(\d+)/.exec(href);
        if (!em) return;
        const name = ($ep.find('.tv_episode_name').first().text() ?? '').replace(/^\s*-\s*/, '').trim();
        const airDateRaw = ($ep.find('.tv_episode_airdate').first().text() ?? '').replace(/^\s*-\s*/, '').trim();
        const linksRaw = $ep.find('.tv_num_versions').first().text() ?? '';
        const lm = /(\d+)/.exec(linksRaw);
        episodes.push({
          season: sid,
          number: parseInt(em[2], 10),
          name: name || `Episode ${em[2]}`,
          airDate: airDateRaw || null,
          links: lm ? parseInt(lm[1], 10) : 0,
          href,
          released: $ep.hasClass('released'),
        });
      });
      if (episodes.length) seasons.push({ season: sid, episodes });
    }
  }

  return {
    id,
    slug,
    type,
    title,
    year,
    poster,
    status,
    primewireRating,
    primewireVotes,
    tmdbRating,
    description,
    released,
    runtime,
    genres,
    aka,
    countries,
    companies,
    cast,
    trailers,
    seasons,
    embedPath: parseEmbedPath(html),
    // Filled in by the service layer (getDetail) which knows the primary mirror
    sourceUrl: '',
  };
}

/**
 * Extract PrimeWire's own embeddable player path from a detail/episode page:
 *   <iframe … src="/embed/movie?s_id=802292&tmdb_id=272">   (movie pages)
 *   <iframe … src="/embed/tv?e_id=16943&s_id=2437&tmdb_id=1396"> (episode pages)
 * Returns the raw path+query (mirror-agnostic) or null.
 */
export function parseEmbedPath(html: string): string | null {
  const m = /<iframe[^>]+src="(\/embed\/(?:movie|tv)\?[^"']+)"/i.exec(html);
  return m ? m[1] : null;
}

/**
 * Query params of an embed path as a plain object (e.g. { s_id, tmdb_id }).
 */
export function embedParams(embedPath: string | null): Record<string, string> {
  if (!embedPath) return {};
  const q = embedPath.slice(embedPath.indexOf('?') + 1);
  const out: Record<string, string> = {};
  for (const pair of new URLSearchParams(q)) out[pair[0]] = pair[1];
  return out;
}

/* ------------------------------------------------------------------ */
/* Schedule (/schedule)                                                */
/* ------------------------------------------------------------------ */

/**
 * Parse the TV schedule page: 7 day blocks, each an h2.sub_titles
 * followed by a div.schedule_items of a.episode_item_small entries.
 */
export function parseSchedulePage(html: string): ScheduleDay[] {
  const $ = cheerio.load(html);
  const days: ScheduleDay[] = [];

  $('h2.sub_titles').each((_, el) => {
    const $h = $(el);
    const day = $h.find('span').first().text().trim() || $h.text().trim();
    if (!day) return;
    const $items = $h.next('div.schedule_items');
    if ($items.length === 0) return;

    const episodes: ScheduleEpisode[] = [];
    $items.find('a.episode_item_small').each((__, a) => {
      const $a = $(a);
      const href = $a.attr('href') ?? '';
      // /tv/{showId}/{slug}-season-{n}-episode-{m}
      const m = /^\/tv\/(\d+)\/(.+)-season-(\d+)-episode-(\d+)$/.exec(href);
      if (!m) return;
      const title = $a.find('.episode_item_title').first().text().trim();
      if (!title) return;
      const numRaw = $a.find('.episode_item_number').first().text().trim();
      const sn = /^S(\d+)\s*E(\d+)$/i.exec(numRaw);
      episodes.push({
        showId: parseInt(m[1], 10),
        showSlug: m[2],
        title,
        season: sn ? parseInt(sn[1], 10) : parseInt(m[3], 10),
        number: sn ? parseInt(sn[2], 10) : parseInt(m[4], 10),
        poster: tmdbPath($a.find('img').first().attr('src')),
        aired: $a.hasClass('aired') || $a.find('.aired_badge').length > 0,
        href,
      });
    });

    if (episodes.length > 0) days.push({ day, episodes });
  });

  return days;
}

/* ------------------------------------------------------------------ */
/* Playlists (/playlists)                                              */
/* ------------------------------------------------------------------ */

function parseIntSafe(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse the playlists listing: a single div.playlist_listing container
 * holding table rows; each row has a playlist link "( N items )", an info
 * line (views | favorites | created … by …) and a description.
 */
export function parsePlaylistsPage(html: string): PlaylistsResponse {
  const $ = cheerio.load(html);
  const items: PlaylistSummary[] = [];

  $('div.playlist_listing tr').each((_, el) => {
    const $el = $(el);
    // the first /playlist/ link is the image-thumb wrapper (no text) —
    // pick the titled link instead
    const $link = $el
      .find('a[href^="/playlist/"]')
      .filter((__, a) => $(a).text().trim().length > 0)
      .first();
    const href = $link.attr('href') ?? '';
    const m = /^\/playlist\/(\d+)-([^/?#]*)/.exec(href);
    if (!m) return;
    const title = $link.text().trim();
    if (!title) return;

    // "Title ( 42 items )" — item count lives in the <strong> parent text
    const strongText = $el.find('strong').first().text();
    const countMatch = /\(\s*(\d+)\s*items?\s*\)/i.exec(strongText);

    // info: "53 Views | 1 favorites | Created 2 days ago by <a>user</a>"
    const infoText = $el.find('.playlist_listing_info').first().text().replace(/\s+/g, ' ').trim();
    const views = /(\d+)\s*Views?/i.exec(infoText);
    const favs = /(\d+)\s*favorites?/i.exec(infoText);
    const created = /Created\s+([^|]+?)(?:\s+by\s+|$)/i.exec(infoText);
    const author = $el.find('.playlist_listing_info a[href^="/user/"]').first().text().trim() || null;

    items.push({
      id: parseInt(m[1], 10),
      slug: m[2],
      title,
      itemCount: countMatch ? parseInt(countMatch[1], 10) : null,
      views: views ? parseInt(views[1], 10) : null,
      favorites: favs ? parseInt(favs[1], 10) : null,
      createdAgo: created ? created[1].trim() : null,
      author,
      poster: tmdbPath($el.find('.playlist_thumb img').first().attr('src')),
      description: $el.find('.playlist_listing_desc').first().text().replace(/\s+/g, ' ').trim() || null,
    });
  });

  // pagination (sliding window, same markup as list pages)
  const page = parseInt($('div.pagination span.current').first().text(), 10) || 1;
  const pages: number[] = [page];
  $('div.pagination a').each((_, el) => {
    const p = parseInt($(el).text(), 10);
    const pm = /[?&]page=(\d+)/.exec($(el).attr('href') ?? '');
    const n = Number.isFinite(p) ? p : pm ? parseInt(pm[1], 10) : NaN;
    if (Number.isFinite(n)) pages.push(n);
  });

  return {
    items,
    page,
    pages: [...new Set(pages)].sort((a, b) => a - b),
    hasNext: $('div.pagination a[rel="next"], div.pagination a:contains("›"), div.pagination a:contains("Next")').length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Playlist detail (/playlist/{id}-{slug})                             */
/* ------------------------------------------------------------------ */

/**
 * Parse one playlist page: tr.playlist-item rows with a media link
 * ("Movie:"/"TV:"), title, year, description.
 */
export function parsePlaylistDetailPage(html: string, id: number, slug: string): PlaylistDetail {
  const $ = cheerio.load(html);
  const items: PlaylistItem[] = [];

  $('tr.playlist-item').each((_, el) => {
    const $el = $(el);
    // the first media link is the image-thumb wrapper (no text) —
    // require a titled link
    const $link = $el
      .find('a[href^="/movie/"], a[href^="/tv/"]')
      .filter((__, a) => {
        const href = $(a).attr('href') ?? '';
        return /^\/(movie|tv)\/\d+-[^/]+$/.test(href) && $(a).text().trim().length > 0;
      })
      .first();
    const href = $link.attr('href') ?? '';
    const m = /^\/(movie|tv)\/(\d+)-([^/?#]*)$/.exec(href);
    if (!m) return;
    const title = $link.text().trim();
    if (!title) return;

    // "Movie: Casper ( 1995 )" — type word + year in .playlist_info
    const infoText = $el.find('.playlist_info').first().text().replace(/\s+/g, ' ').trim();
    const yearMatch = /\(\s*(\d{4})\s*\)/.exec(infoText);
    const typeWord = /^(Movie|TV):/i.exec(infoText);

    items.push({
      id: parseInt(m[2], 10),
      slug: m[3],
      type: m[1] as MediaType,
      title,
      year: yearMatch ? parseInt(yearMatch[1], 10) : null,
      poster: tmdbPath($el.find('.playlist_thumb img').first().attr('src')),
      rating: ratingFromWidth($el.find('.current-rating').attr('style')),
      description: $el.find('.playlist_desc').first().text().replace(/\s+/g, ' ').trim() || null,
    });
  });

  const rawTitle =
    // h1 breadcrumb: "Playlists > <strong>Halloween/Horror Movies - Best Ever</strong>"
    $('h1 strong').first().text().trim() ||
    $('h1').first().text().replace(/^Playlists?\s*>\s*/i, '').trim() ||
    $('title').text();
  const titleFromPage =
    rawTitle
      .replace(/\s*\|\s*PrimeWire.*$/i, '')
      .replace(/\s*Playlist$/i, '')
      .trim() || 'Playlist';

  return { id, slug, title: titleFromPage, items, sourceUrl: '' };
}
