"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  AutocompleteKind,
  AutocompleteResult,
  BrowseResponse,
  HomeResponse,
  MediaDetail,
  PlaylistsResponse,
  PlaylistDetail,
  PlayerResponse,
  ScheduleResponse,
} from "@/lib/primewire/types";
import type { HostHealth } from "@/lib/primewire/hosts";
import type { ProviderHealth as ExternalProviderHealth } from "@/lib/primewire/external-sources";

export type ImageSize = "w200" | "w300" | "w400" | "w500" | "w780" | "w1280";

/**
 * Build a same-origin proxy URL for a TMDB poster path
 * (e.g. "/t/p/w200/xxx.jpg" → "/api/primewire/image?path=...&size=w500").
 */
export function imgUrl(
  path: string | null | undefined,
  size: ImageSize = "w500",
): string | null {
  if (!path) return null;
  return `/api/primewire/image?path=${encodeURIComponent(path)}&size=${size}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

const QUERY_OPTS = {
  // Movie/catalog data is NEVER cached: every mount refetches live from
  // our API (which itself scrapes PrimeWire fresh on every request).
  // Only user/account data may be cached (see use-account.ts).
  staleTime: 0,
  refetchOnMount: "always" as const,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

/** Home page: hero items + catalog rows. */
export function useHome() {
  return useQuery({
    queryKey: ["primewire", "home"],
    queryFn: () => fetchJson<HomeResponse>("/api/primewire/home"),
    ...QUERY_OPTS,
  });
}

/**
 * Browse/search the catalog. `params` values are encoded individually;
 * empty values are filtered out. Keeps previous data between pages.
 */
export function useBrowse(
  params: Record<string, string>,
  options?: { enabled?: boolean },
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const v = String(value).trim();
    if (!v) continue;
    qs.set(key, v);
  }
  const url = `/api/primewire/browse${qs.size > 0 ? `?${qs.toString()}` : ""}`;

  return useQuery({
    queryKey: ["primewire", "browse", params],
    queryFn: () => fetchJson<BrowseResponse>(url),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    ...QUERY_OPTS,
  });
}

/** Full detail for one title. Disabled (and idle) until params are valid. */
export function useDetail(
  type: string | null,
  id: string | null,
  slug: string | null,
) {
  const enabled =
    (type === "movie" || type === "tv") &&
    id !== null &&
    /^\d+$/.test(id) &&
    typeof slug === "string" &&
    slug.length > 0;

  return useQuery({
    queryKey: ["primewire", "detail", type, id, slug],
    queryFn: () =>
      fetchJson<MediaDetail>(
        `/api/primewire/detail?type=${type}&id=${id}&slug=${encodeURIComponent(slug as string)}`,
      ),
    enabled,
    ...QUERY_OPTS,
  });
}

/** TV schedule — 7 days of airing episodes. */
export function useSchedule() {
  return useQuery({
    queryKey: ["primewire", "schedule"],
    queryFn: () => fetchJson<ScheduleResponse>("/api/primewire/schedule"),
    ...QUERY_OPTS,
  });
}

/**
 * Player payload for one movie or TV episode (embeddable PrimeWire player
 * URL + source list). TV: omit season/number for the first released episode.
 */
export function usePlayer(
  type: string | null,
  id: string | null,
  slug: string | null,
  season: string | null,
  number: string | null,
) {
  const enabled =
    (type === "movie" || type === "tv") &&
    id !== null &&
    /^\d+$/.test(id) &&
    typeof slug === "string" &&
    slug.length > 0;

  const qs = new URLSearchParams({
    type: type === "tv" ? "tv" : "movie",
    id: id ?? "",
    slug: slug ?? "",
  });
  if (season && /^\d+$/.test(season)) qs.set("season", season);
  if (number && /^\d+$/.test(number)) qs.set("number", number);

  return useQuery({
    queryKey: [
      "primewire",
      "player",
      type,
      id,
      slug,
      season && /^\d+$/.test(season) ? season : "",
      number && /^\d+$/.test(number) ? number : "",
    ],
    queryFn: () => fetchJson<PlayerResponse>(`/api/primewire/player?${qs.toString()}`),
    enabled,
    ...QUERY_OPTS,
  });
}

/** Health of the video hosts behind a title's source list (alive + whether
 *  the host's player pages allow framing inside the embedded PrimeSrc
 *  player). Probed live by the server on every call (no caching). */
export function useHostHealth(hosts: string[]) {
  const key = [...new Set(hosts.filter(Boolean))].sort().join(",");
  return useQuery({
    queryKey: ["primewire", "hosts", key],
    queryFn: () =>
      fetchJson<{ hosts: HostHealth[] }>(
        `/api/primewire/hosts?hosts=${encodeURIComponent(key)}`,
      ),
    enabled: key.length > 0,
    select: (data) => {
      const map = new Map<string, HostHealth>();
      for (const h of data?.hosts ?? []) map.set(h.host, h);
      return map;
    },
    ...QUERY_OPTS,
    retry: 0,
  });
}

/**
 * Health + exact embed URLs + iframe sandbox policy of the EXTERNAL
 * providers (VidSrc, VidLink, VidFast, 2Embed, Videm, Videasy) for one
 * title — the "other sources" section of the player's source picker.
 * Enabled only when PrimeWire exposed a TMDB id for the title (all of
 * these providers address titles by it).
 */
export function useExternalProviders(
  type: "movie" | "tv",
  tmdbId: number | null,
  season: number | null,
  number: number | null,
) {
  const qs = new URLSearchParams({ type, tmdb: String(tmdbId ?? "") });
  if (season) qs.set("season", String(season));
  if (number) qs.set("number", String(number));

  return useQuery({
    queryKey: [
      "primewire",
      "external-providers",
      type,
      tmdbId,
      season ?? 0,
      number ?? 0,
    ],
    queryFn: () =>
      fetchJson<{ providers: ExternalProviderHealth[] }>(
        `/api/primewire/external-providers?${qs.toString()}`,
      ),
    enabled: tmdbId != null && tmdbId > 0,
    ...QUERY_OPTS,
    retry: 0,
  });
}

/** Community playlists listing (50 per page), keeps previous data. */
export function usePlaylists(page: number) {
  const safePage = Math.max(1, page || 1);
  return useQuery({
    queryKey: ["primewire", "playlists", safePage],
    queryFn: () =>
      fetchJson<PlaylistsResponse>(
        `/api/primewire/playlists${safePage > 1 ? `?page=${safePage}` : ""}`,
      ),
    placeholderData: keepPreviousData,
    ...QUERY_OPTS,
  });
}

/** One playlist with its items. Enabled only when the id is numeric. */
export function usePlaylistDetail(id: string | number | null, slug: string | null) {
  const idStr = id === null ? "" : String(id);
  const enabled = /^\d+$/.test(idStr);
  const safeSlug = typeof slug === "string" ? slug : "";

  return useQuery({
    queryKey: ["primewire", "playlist", idStr, safeSlug],
    queryFn: () =>
      fetchJson<PlaylistDetail>(
        `/api/primewire/playlist?id=${idStr}&slug=${encodeURIComponent(safeSlug)}`,
      ),
    enabled,
    ...QUERY_OPTS,
  });
}

/**
 * PrimeWire Select2 autocomplete (people / countries / services /
 * companies). Fires only for terms of 2+ characters; returns at most 12
 * suggestions. Served fresh on every mount (no caching).
 */
export function useAutocomplete(kind: AutocompleteKind, term: string) {
  const trimmed = term.trim();
  return useQuery({
    queryKey: ["primewire", "autocomplete", kind, trimmed],
    queryFn: () =>
      fetchJson<{ results: AutocompleteResult[] }>(
        `/api/primewire/autocomplete?kind=${kind}&term=${encodeURIComponent(trimmed)}`,
      ),
    enabled: trimmed.length >= 2,
    select: (data) => (data?.results ?? []).slice(0, 12),
    ...QUERY_OPTS,
  });
}
