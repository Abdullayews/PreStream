/**
 * PreStream SPA navigation helpers.
 *
 * The whole app lives on `/` and switches views via search params:
 *   ?view=home | browse | detail
 *
 * These helpers build query strings consistently: empty params are omitted,
 * values are encoded, and `page` is omitted when it equals 1.
 */
import type { useRouter } from "next/navigation";

export type NavRouter = ReturnType<typeof useRouter>;

/** Params that the browse view understands (URL-level, all optional). */
export interface BrowseNavParams {
  q?: string | null;
  type?: "movie" | "tv" | string | null;
  genre?: string | null; // comma separated
  sort?: string | null;
  direction?: "asc" | "desc" | string | null;
  yearFrom?: string | number | null;
  yearTo?: string | number | null;
  rating?: string | number | null;
  country?: string | null;
  cast?: string | null;
  page?: string | number | null;
}

/** Serialize browse params into a `/?view=browse&...` href. */
export function browseHref(params?: BrowseNavParams | Record<string, string>): string {
  const sp = new URLSearchParams();
  sp.set("view", "browse");
  if (params) {
    for (const [key, raw] of Object.entries(params)) {
      if (raw === undefined || raw === null) continue;
      const value = String(raw).trim();
      if (!value) continue;
      if (key === "page" && value === "1") continue;
      sp.set(key, value);
    }
  }
  // URLSearchParams encodes spaces as "+"; normalize to %20 for shareable URLs.
  return `/?${sp.toString().replaceAll("+", "%20")}`;
}

export function homeHref(): string {
  return "/?view=home";
}

/** Serialize a ?view=schedule href (no params). */
export function scheduleHref(): string {
  return "/?view=schedule";
}

/** Serialize a ?view=playlists href (page omitted when 1). */
export function playlistsHref(page?: number): string {
  const sp = new URLSearchParams();
  sp.set("view", "playlists");
  if (page && page > 1) sp.set("page", String(page));
  return `/?${sp.toString()}`;
}

/** Serialize a ?view=playlist href for one playlist. */
export function playlistDetailHref(playlist: {
  id: number | string;
  slug: string;
}): string {
  return `/?view=playlist&id=${encodeURIComponent(String(playlist.id))}&slug=${encodeURIComponent(
    playlist.slug,
  )}`;
}

export function detailHref(item: {
  type: string;
  id: number | string;
  slug: string;
}): string {
  return `/?view=detail&type=${encodeURIComponent(item.type)}&id=${encodeURIComponent(
    String(item.id),
  )}&slug=${encodeURIComponent(item.slug)}`;
}

/**
 * Serialize a ?view=player href for one movie or TV episode.
 * TV: omit season/number to let the API resolve the first released episode.
 */
export function playerHref(item: {
  type: string;
  id: number | string;
  slug: string;
  season?: number | string | null;
  number?: number | string | null;
}): string {
  const sp = new URLSearchParams();
  sp.set("view", "player");
  sp.set("type", item.type === "tv" ? "tv" : "movie");
  sp.set("id", String(item.id));
  sp.set("slug", item.slug);
  if (item.season != null && String(item.season).trim() !== "") {
    sp.set("season", String(item.season));
  }
  if (item.number != null && String(item.number).trim() !== "") {
    sp.set("number", String(item.number));
  }
  return `/?${sp.toString().replaceAll("+", "%20")}`;
}

export function toHome(router: NavRouter): void {
  router.push(homeHref());
}

export function toPlayer(
  router: NavRouter,
  item: {
    type: string;
    id: number | string;
    slug: string;
    season?: number | string | null;
    number?: number | string | null;
  },
): void {
  router.push(playerHref(item));
}

export function toSchedule(router: NavRouter): void {
  router.push(scheduleHref());
}

export function toPlaylists(router: NavRouter, page?: number): void {
  router.push(playlistsHref(page));
}

export function toPlaylistDetail(
  router: NavRouter,
  playlist: { id: number | string; slug: string },
): void {
  router.push(playlistDetailHref(playlist));
}

export function toBrowse(
  router: NavRouter,
  params?: BrowseNavParams | Record<string, string>,
): void {
  router.push(browseHref(params));
}

export function toDetail(
  router: NavRouter,
  item: { type: string; id: number | string; slug: string },
): void {
  router.push(detailHref(item));
}

/** Absolute PrimeWire URL for a title's page. */
export function primewireUrl(item: {
  type: string;
  id: number | string;
  slug: string;
}): string {
  return `https://primewire.pw/${item.type}/${item.id}-${item.slug}`;
}

/* ---------------- account hub (?view=account&tab=…) ---------------- */

/** Tabs of the account hub (?tab=, defaults to library). */
export const ACCOUNT_TABS = [
  "library",
  "playlists",
  "schedule",
  "recommended",
  "feed",
  "messages",
  "notifications",
  "friends",
  "comments",
  "community",
  "forum",
  "links",
  "parties",
] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

/**
 * Serialize a ?view=account href. `extra` carries tab-specific params
 * (library filters, pages…); empty values are dropped and page 1 omitted.
 */
export function accountHref(
  tab?: string | null,
  extra?: Record<string, string | number | null | undefined>,
): string {
  const sp = new URLSearchParams();
  sp.set("view", "account");
  const t = (tab ?? "").trim();
  if (t) sp.set("tab", t);
  if (extra) {
    for (const [key, raw] of Object.entries(extra)) {
      if (raw === undefined || raw === null) continue;
      const value = String(raw).trim();
      if (!value) continue;
      if (key === "page" && value === "1") continue;
      sp.set(key, value);
    }
  }
  return `/?${sp.toString().replaceAll("+", "%20")}`;
}

export function toAccount(
  router: NavRouter,
  tab?: string | null,
  extra?: Record<string, string | number | null | undefined>,
  opts?: { replace?: boolean },
): void {
  const href = accountHref(tab, extra);
  if (opts?.replace) router.replace(href);
  else router.push(href);
}

/* ---------------- user profile (?view=user&name=…) ---------------- */

/** Serialize a public PrimeWire member profile href. */
export function userHref(name: string): string {
  return `/?view=user&name=${encodeURIComponent(name.trim()).replaceAll("%20", "+")}`;
}

export function toUser(router: NavRouter, name: string): void {
  router.push(userHref(name));
}

/* ---------------- forum (?view=forum…) ---------------- */

/** Serialize a forum href: index, one category, or one thread. */
export function forumHref(target?: { category?: number; thread?: number }): string {
  const sp = new URLSearchParams();
  sp.set("view", "forum");
  if (target?.category) sp.set("category", String(target.category));
  if (target?.thread) sp.set("thread", String(target.thread));
  return `/?${sp.toString()}`;
}

export function toForum(
  router: NavRouter,
  target?: { category?: number; thread?: number },
): void {
  router.push(forumHref(target));
}
