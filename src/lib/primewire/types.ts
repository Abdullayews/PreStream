/**
 * PrimeWire integration — shared types & API contract.
 * Data source: https://primewire.pw (scraped server-side).
 */

export type MediaType = 'movie' | 'tv';

/** A single media item as shown on cards/rows/grids. */
export interface MediaItem {
  id: number;
  slug: string;
  type: MediaType;
  title: string;
  year: number | null;
  /** TMDB poster path, e.g. "/t/p/w200/abc.jpg" — serve via /api/primewire/image?path=...&size=w500 */
  poster: string | null;
  /** PrimeWire community rating 0–5 (null if unrated) */
  rating: number | null;
}

/** Enriched hero item (detail fetched for top home items). */
export interface HeroItem extends MediaItem {
  description: string | null;
  genres: string[];
  tmdbRating: number | null;
}

export interface HomeRow {
  key: string;
  title: string;
  items: MediaItem[];
  /** Query-string params (for /api/primewire/browse) that reproduce this row in Browse view */
  params: Record<string, string>;
}

export interface HomeResponse {
  hero: HeroItem[];
  rows: HomeRow[];
  updatedAt: string;
}

export interface BrowseParams {
  q?: string;
  type?: 'movie' | 'tv';
  genres?: string[];
  sort?: string;
  direction?: 'asc' | 'desc';
  yearFrom?: number;
  yearTo?: number;
  ratingAbove?: number;
  country?: string;
  cast?: string;
  /** Stream quality filter */
  quality?: 'HD' | 'DVD' | 'TS' | 'CAM';
  page?: number;
}

export interface BrowseResponse {
  items: MediaItem[];
  page: number;
  /** Sliding window of page numbers PrimeWire exposes */
  pages: number[];
  hasNext: boolean;
  params: BrowseParams;
}

export interface CastMember {
  name: string;
  role: string | null;
}

export interface Episode {
  season: number;
  number: number;
  name: string;
  airDate: string | null;
  links: number;
  href: string;
  released: boolean;
}

export interface Season {
  season: number;
  episodes: Episode[];
}

export interface Trailer {
  title: string;
  key: string;
}

export interface MediaDetail {
  id: number;
  slug: string;
  type: MediaType;
  title: string;
  year: number | null;
  poster: string | null;
  status: string | null;
  primewireRating: number | null;
  primewireVotes: number | null;
  tmdbRating: number | null;
  description: string | null;
  released: string | null;
  runtime: string | null;
  genres: string[];
  aka: string[];
  countries: string[];
  companies: string[];
  cast: CastMember[];
  trailers: Trailer[];
  seasons: Season[];
  /** PrimeWire's own embeddable player path (movies only), e.g. "/embed/movie?s_id=..&tmdb_id=.." */
  embedPath: string | null;
  /** Original PrimeWire page (watch links live there) */
  sourceUrl: string;
}

/* ---------------- Player (/embed/* + /api/v1/s) ---------------- */

/** One user-submitted video source (Filemoon, Voe, …) from PrimeWire's sources API. */
export interface PlayerSource {
  /** Host / provider name, e.g. "Filemoon" */
  host: string;
  fileName: string | null;
  fileSize: string | null;
  quality: string | null;
  audioLanguage: string | null;
  audioType: string | null;
  /** PrimeWire interstitial that redirects to the host (opens in a new tab) */
  goUrl: string;
}

/** Compact episode reference for the player's episode navigator. */
export interface PlayerEpisodeRef {
  season: number;
  number: number;
  name: string;
  released: boolean;
}

/** Neighbouring episode (for prev/next navigation). */
export interface PlayerEpisodePointer {
  season: number;
  number: number;
}

export interface PlayerResponse {
  type: MediaType;
  id: number;
  slug: string;
  title: string;
  year: number | null;
  poster: string | null;
  /** PrimeWire's embeddable player (PrimeSrc) — served with frame-ancestors * */
  embedUrl: string | null;
  /** Original page on PrimeWire (movie page or episode page) */
  sourceUrl: string;
  /** TV only — the resolved episode */
  season: number | null;
  number: number | null;
  episodeName: string | null;
  airDate: string | null;
  prev: PlayerEpisodePointer | null;
  next: PlayerEpisodePointer | null;
  /** TV only — every episode, for the in-player navigator */
  episodes: PlayerEpisodeRef[];
  /** User-submitted sources (same list the embedded player offers) */
  sources: PlayerSource[];
  /** TMDB id of the title (from PrimeWire's embed params) — the key external providers play by */
  tmdbId: number | null;
  /** TV only — the episode's PrimeWire video id (embed e_id), used to mark it watched */
  videoId: number | null;
}

export interface ApiError {
  error: string;
}

/* ---------------- Schedule (/schedule) ---------------- */

/** One TV episode airing on a given day. */
export interface ScheduleEpisode {
  showId: number;
  showSlug: string;
  /** Show name, e.g. "Tulsa King" */
  title: string;
  season: number;
  number: number;
  poster: string | null;
  aired: boolean;
  /** PrimeWire episode path, e.g. "/tv/123/show-season-1-episode-2" */
  href: string;
}

export interface ScheduleDay {
  /** Day label as shown on PrimeWire, e.g. "Friday October 23th" */
  day: string;
  episodes: ScheduleEpisode[];
}

export interface ScheduleResponse {
  days: ScheduleDay[];
  updatedAt: string;
}

/* ---------------- Playlists (/playlists) ---------------- */

export interface PlaylistSummary {
  id: number;
  slug: string;
  title: string;
  itemCount: number | null;
  views: number | null;
  favorites: number | null;
  /** Humanized creation offset, e.g. "2 days ago" */
  createdAgo: string | null;
  author: string | null;
  poster: string | null;
  description: string | null;
}

export interface PlaylistsResponse {
  items: PlaylistSummary[];
  page: number;
  pages: number[];
  hasNext: boolean;
}

export interface PlaylistItem extends MediaItem {
  description: string | null;
}

export interface PlaylistDetail {
  id: number;
  slug: string;
  title: string;
  items: PlaylistItem[];
  sourceUrl: string;
}

/* ---------------- Autocomplete (Select2) ---------------- */

export type AutocompleteKind = 'people' | 'countries' | 'services' | 'companies';

export interface AutocompleteResult {
  id: string;
  text: string;
}

/* ---------------- PrimeWire constant maps (for UI selects) ---------------- */

export const PW_SORTS = [
  { value: 'Featured', label: 'Featured' },
  { value: 'Just Added', label: 'Just Added' },
  { value: 'Popular', label: 'Popular' },
  { value: 'Trending Today', label: 'Trending Today' },
  { value: 'Trending this Week', label: 'Trending this Week' },
  { value: 'Trending this Month', label: 'Trending this Month' },
  { value: 'External Rating', label: 'Top Rated (TMDB)' },
  { value: 'Primewire Rating', label: 'PrimeWire Rating' },
  { value: 'Views', label: 'Most Viewed' },
  { value: 'Release', label: 'Release Date' },
  { value: 'Alphabet', label: 'Alphabetical' },
  { value: 'In Theaters', label: 'In Theaters' },
  { value: 'Streaming Release', label: 'Streaming Release' },
  { value: 'Series Premiere', label: 'Series Premiere' },
  { value: 'Season Premiere', label: 'Season Premiere' },
  { value: 'New', label: 'New' },
] as const;

export const PW_GENRES = [
  'Action', 'Adventure', 'Animation', 'Anime', 'Biography', 'Children',
  'Comedy', 'Crime', 'Documentary', 'Drama', 'Espionage', 'Family',
  'Fantasy', 'Film-Noir', 'Game-Show', 'History', 'Horror', 'Legal',
  'Medical', 'Music', 'Musical', 'Mystery', 'Nature', 'News',
  'Reality-TV', 'Romance', 'Sci-Fi', 'Short', 'Sport', 'Supernatural',
  'Talk-Show', 'Thriller', 'War', 'Western',
] as const;
