/**
 * PrimeWire account service — every authenticated function, proxied with
 * the user's stored PrimeWire session.
 */
import { PRIMARY_MIRROR, fetchPage } from './client';
import { authedAction, authedFetch, authedGet, authedJson, authedPost, getCsrf } from './session';
import type * as T from './account-types';
import {
  parseCommentsFeed, parseCommentsSection, parseFriendsPage, parseForumCategoryPage,
  parseForumIndex, parseLibraryPage, parseMessagesPage, parseMyPlaylistsPage,
  parseNotificationsPage, parsePlaylistEditPage, parseSettingsPage, parseSidebarUser,
  parseThreadPage, parseUserProfile, parseUserLinksPage, parseWatchPartiesPage,
} from './account-parser';
import { parseListPage, parseSchedulePage } from './parser';
import type { MediaItem, ScheduleDay } from './types';

function parseIntSafe(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

/* ------------------------------------------------------------------ */
/* Me / identity                                                       */
/* ------------------------------------------------------------------ */

/**
 * Full profile of the signed-in user (also refreshes avatar etc.).
 * The profile page is best-effort: if PrimeWire fails to render /user/{name}
 * (it hard-500s when the stored wall privacy is invalid, for example), we
 * still sign the user in with their sidebar identity instead of locking
 * them out of their own account.
 */
export async function fetchMe(session: string): Promise<T.PwUserProfile & { sidebar: ReturnType<typeof parseSidebarUser> }> {
  const sidebar = await authedGet(session, '/home').then(parseSidebarUser);
  if (!sidebar || !sidebar.username) throw new Error('Not signed in');
  try {
    const html = await authedGet(session, `/user/${encodeURIComponent(sidebar.username)}`);
    const profile = parseUserProfile(html);
    profile.sourceUrl = `${PRIMARY_MIRROR}/user/${encodeURIComponent(profile.username)}`;
    return { ...profile, sidebar };
  } catch {
    // Profile page unavailable upstream — degrade to sidebar-only identity.
    return {
      username: sidebar.username,
      userId: null,
      avatar: sidebar.avatar,
      gender: null,
      from: null,
      joined: null,
      lastActive: null,
      online: true,
      profileViews: null,
      kudos: null,
      about: null,
      hobbies: null,
      sourceUrl: `${PRIMARY_MIRROR}/user/${encodeURIComponent(sidebar.username)}`,
      wall: [],
      userIdForActions: null,
      sidebar,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Library / tracker                                                   */
/* ------------------------------------------------------------------ */

export async function fetchLibrary(
  session: string,
  username: string,
  params: { status?: string; favorite?: boolean; type?: string; sort?: string; direction?: string; page?: number } = {},
): Promise<T.LibraryResponse> {
  const query = qs({
    status: params.status,
    favorite: params.favorite ? 'on' : undefined,
    type: params.type,
    sort: params.sort,
    direction: params.direction,
    page: params.page && params.page > 1 ? params.page : undefined,
  });
  const html = await authedGet(session, `/library/${encodeURIComponent(username)}${query ? `?${query}` : ''}`);
  return parseLibraryPage(html);
}

/** Update library/favorite/schedule/status for a show (bracket-notation GET action). */
export async function updateLibraryItem(
  session: string,
  showId: number,
  update: { library?: boolean; status?: string | null; favorite?: boolean; schedule?: boolean },
): Promise<T.LibraryItemState> {
  const params: string[] = [];
  if (update.library !== undefined) params.push(`update[library]=${update.library}`);
  if (update.status !== undefined) {
    params.push(update.status ? `update[status]=${encodeURIComponent(update.status)}` : 'update[status]=');
  }
  if (update.favorite !== undefined) params.push(`update[favorite]=${update.favorite}`);
  if (update.schedule !== undefined) params.push(`update[schedule]=${update.schedule}`);
  return authedJson<T.LibraryItemState>(session, `/library-item/update?${params.join('&')}&show_id=${showId}`);
}

/** Rate a show / episode / link / host 1–5. */
export async function rate(
  session: string,
  target: { showId?: number; videoId?: number; linkId?: number; hostId?: number },
  rating: number,
): Promise<T.RatingResult> {
  const r = Math.min(5, Math.max(1, Math.round(rating)));
  const p = qs({
    show_id: target.showId,
    video_id: target.videoId,
    link_id: target.linkId,
    host_id: target.hostId,
    rating: r,
  });
  return authedJson<T.RatingResult>(session, `/rating/create?${p}`);
}

/** Episode watched tracking. */
export async function episodeAction(
  session: string,
  action: 'watch' | 'unwatch' | 'watch-season' | 'unwatch-season' | 'prev',
  args: { episodeId?: number; showId?: number; season?: number; episode?: number },
): Promise<string> {
  const path = {
    watch: `/episode/add_watched?${qs({ episode_id: args.episodeId })}`,
    unwatch: `/episode/remove_watched?${qs({ episode_id: args.episodeId })}`,
    'watch-season': `/episode/add_watched_season?${qs({ season: args.season, show_id: args.showId })}`,
    'unwatch-season': `/episode/remove_watched_season?${qs({ season: args.season, show_id: args.showId })}`,
    prev: `/episode/add_prev_episodes?${qs({ show_id: args.showId, episode: args.episode, season: args.season })}`,
  }[action];
  return authedAction(session, path);
}

/** Export the user's library as CSV. */
export async function exportLibraryCsv(session: string): Promise<string> {
  const csrf = await getCsrf(session);
  const res = await authedFetch(session, '/export_library', {
    method: 'POST',
    csrfHeader: csrf,
    form: { _csrf_token: csrf },
  });
  const text = await res.text();
  return text;
}

/* ------------------------------------------------------------------ */
/* Playlists (owned)                                                   */
/* ------------------------------------------------------------------ */

export async function fetchMyPlaylists(session: string, userId?: number | null): Promise<T.MyPlaylistsResponse> {
  const html = await authedGet(session, `/playlists/user${userId ? `?user_id=${userId}` : ''}`);
  return parseMyPlaylistsPage(html);
}

/**
 * Items of one of the user's own playlists, with the REAL playlist-item ids
 * from the edit page (the public playlist page only exposes show ids, and
 * remove/move actions need the item ids).
 */
export async function fetchPlaylistItems(session: string, playlistId: number): Promise<T.PlaylistEditItem[]> {
  const html = await authedGet(session, `/playlists/edit/${playlistId}`);
  return parsePlaylistEditPage(html);
}

export async function createPlaylist(
  session: string,
  input: { title: string; description?: string; private?: boolean; allowComments?: boolean },
): Promise<{ ok: true }> {
  await authedPost(session, '/playlists/create', {
    'playlist[title]': input.title,
    'playlist[description]': input.description ?? '',
    'playlist[private]': input.private ? 'true' : 'false',
    'playlist[allow_comments]': input.allowComments === false ? 'false' : 'true',
    'playlist[id]': '',
  });
  return { ok: true };
}

export async function editPlaylist(
  session: string,
  input: { id: number; title: string; description?: string; private?: boolean; allowComments?: boolean },
): Promise<{ ok: true }> {
  await authedPost(session, '/playlists/edit', {
    'playlist[title]': input.title,
    'playlist[description]': input.description ?? '',
    'playlist[private]': input.private ? 'true' : 'false',
    'playlist[allow_comments]': input.allowComments === false ? 'false' : 'true',
    'playlist[id]': String(input.id),
  });
  return { ok: true };
}

export async function deletePlaylist(session: string, id: number): Promise<{ ok: true }> {
  const csrf = await getCsrf(session);
  await authedFetch(session, `/playlists/delete?id=${id}`, {
    method: 'POST',
    csrfHeader: csrf,
    form: { _csrf_token: csrf },
  });
  return { ok: true };
}

export async function addShowToPlaylist(session: string, playlistId: number, showId: number): Promise<{ ok: true }> {
  await authedAction(session, `/playlists/add_show?show_id=${showId}&playlist_id=${playlistId}&async=true`);
  return { ok: true };
}

/** Search shows inside the playlist editor (results incl. an add-link per item). */
export async function playlistSearch(
  session: string,
  playlistId: number,
  params: { q: string; type?: string },
): Promise<MediaItem[]> {
  const query = qs({
    playlist_id: playlistId,
    s: params.q,
    type: params.type,
  });
  const html = await authedGet(session, `/playlists/get_shows?${query}`);
  return parseListPage(html).items;
}

export async function deletePlaylistItem(session: string, itemId: number): Promise<{ ok: true }> {
  await authedAction(session, `/playlists/delete_item?item_id=${itemId}`);
  return { ok: true };
}

/**
 * Move a playlist item up/down. PrimeWire only HAS a `move_item_up` action —
 * the site's own app.js implements "down" by calling move_item_up on the
 * NEXT item's id (there is no move_item_down route upstream).
 */
export async function movePlaylistItem(
  session: string,
  itemId: number,
  up: boolean,
  nextItemId?: number,
): Promise<{ ok: true }> {
  if (up) {
    await authedAction(session, `/playlists/move_item_up?item_id=${itemId}`);
    return { ok: true };
  }
  if (!nextItemId) {
    throw new Error('Moving an item down needs the id of the item below it');
  }
  await authedAction(session, `/playlists/move_item_up?item_id=${nextItemId}`);
  return { ok: true };
}

/**
 * Favorite / unfavorite a playlist. NOTE: PrimeWire's own app.js issues this
 * as an ajax **POST** with the CSRF header — the endpoint has no GET route
 * (a GET returns 404), so we must POST exactly like the site does.
 */
export async function favoritePlaylist(session: string, playlistId: number, on: boolean): Promise<{ ok: true }> {
  const csrf = await getCsrf(session);
  const res = await authedFetch(
    session,
    `/playlists/${on ? 'add_favorite' : 'remove_favorite'}?playlist_id=${playlistId}`,
    { method: 'POST', csrfHeader: csrf },
  );
  if (res.status === 302 || res.status === 303 || res.ok) return { ok: true };
  throw new Error(`PrimeWire responded ${res.status}`);
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

export async function fetchCommentsSection(session: string, type: string, id: number): Promise<T.PwComment[]> {
  const html = await authedGet(session, `/comments/section?${qs({ type, id })}`);
  return parseCommentsSection(html);
}

export async function fetchCommentsFeed(session: string, sort: string, user?: string): Promise<T.CommentsFeedResponse> {
  const html = await authedGet(session, `/comments?${qs({ sort, user })}`);
  return parseCommentsFeed(html, sort);
}

export async function createComment(
  session: string,
  input: {
    showId?: number;
    videoId?: number;
    parentId?: number;
    body: string;
    review?: boolean;
    spoiler?: boolean;
    aboutLinks?: boolean;
  },
): Promise<{ ok: true }> {
  await authedPost(session, '/comments/create', {
    'comment[show_id]': input.showId ? String(input.showId) : '',
    'comment[video_id]': input.videoId ? String(input.videoId) : '',
    'comment[parent_id]': input.parentId ? String(input.parentId) : '',
    'comment[id]': '',
    'comment[comment]': input.body,
    'comment[review]': input.review ? 'true' : 'false',
    'comment[about_links]': input.aboutLinks ? 'true' : 'false',
    'comment[spoiler]': input.spoiler ? 'true' : 'false',
  });
  return { ok: true };
}

export async function voteComment(
  session: string,
  commentId: number,
  direction: 'up' | 'down' | 'none',
): Promise<{ score?: number }> {
  if (direction === 'none') {
    const csrf = await getCsrf(session);
    const res = await authedFetch(session, '/comments/unvote', {
      method: 'POST',
      csrfHeader: csrf,
      form: { comment_id: String(commentId), _csrf_token: csrf },
    });
    return res.json().catch(() => ({}));
  }
  const csrf = await getCsrf(session);
  const res = await authedFetch(session, '/comments/vote', {
    method: 'POST',
    csrfHeader: csrf,
    form: { comment_id: String(commentId), direction, _csrf_token: csrf },
  });
  return res.json().catch(() => ({}));
}

/* ------------------------------------------------------------------ */
/* Social: profile, wall, friends, messages, notifications             */
/* ------------------------------------------------------------------ */

export async function fetchUserProfile(session: string, name: string): Promise<T.PwUserProfile> {
  const html = await authedGet(session, `/user/${encodeURIComponent(name)}`);
  const profile = parseUserProfile(html);
  profile.sourceUrl = `${PRIMARY_MIRROR}/user/${encodeURIComponent(profile.username)}`;
  return profile;
}

export async function postToWall(session: string, toUserId: number, body: string): Promise<{ ok: true }> {
  await authedPost(session, '/wall/post/create', {
    'post[user_to_id]': String(toUserId),
    'post[body]': body,
  });
  return { ok: true };
}

export async function fetchFriends(session: string, name: string): Promise<T.FriendsResponse> {
  const html = await authedGet(session, `/user/${encodeURIComponent(name)}/friends`);
  return parseFriendsPage(html);
}

export async function addFriend(session: string, userId: number): Promise<{ ok: true }> {
  await authedAction(session, `/add_friend?id=${userId}`);
  return { ok: true };
}

export async function blockUser(session: string, userId: number): Promise<{ ok: true }> {
  await authedAction(session, `/block_user?id=${userId}`);
  return { ok: true };
}

export async function fetchMessages(session: string): Promise<T.MessageThread[]> {
  const html = await authedGet(session, '/messages');
  return parseMessagesPage(html);
}

export async function sendDirectMessage(
  session: string,
  input: { toName: string; toUserId?: number; body: string },
): Promise<{ ok: true }> {
  // PrimeWire requires the numeric user id — resolve it from the DM form page.
  let toUserId = input.toUserId;
  if (!toUserId) {
    const formHtml = await authedGet(session, `/messages/${encodeURIComponent(input.toName)}`);
    toUserId = parseIntSafe(/name="message\[user_to_id\]"[^>]*value="(\d+)"/.exec(formHtml)?.[1] ?? null) ?? undefined;
  }
  await authedPost(session, '/messages/create', {
    'message[user_to_id]': toUserId ? String(toUserId) : '',
    'message[user_to_name]': input.toName,
    'message[message]': input.body,
  });
  return { ok: true };
}

export async function fetchNotifications(session: string): Promise<T.PwNotification[]> {
  const html = await authedGet(session, '/notifications');
  return parseNotificationsPage(html);
}

export async function clearNotifications(session: string): Promise<{ ok: true }> {
  await authedAction(session, '/notifications/clear');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Schedule (personal), recommended, feed                               */
/* ------------------------------------------------------------------ */

export async function fetchPersonalSchedule(session: string): Promise<ScheduleDay[]> {
  const html = await authedGet(session, '/schedule/personal');
  return parseSchedulePage(html);
}

export async function fetchRecommended(session: string, userId: number, filterRecent = true): Promise<MediaItem[]> {
  const html = await authedGet(session, `/recommended?${qs({ user: userId, filter_recent: filterRecent ? 'true' : 'false' })}`);
  return parseListPage(html).items;
}

export async function fetchFeed(session: string): Promise<T.PwComment[]> {
  const html = await authedGet(session, '/feed');
  return parseCommentsSection(html);
}

/* ------------------------------------------------------------------ */
/* Forum                                                               */
/* ------------------------------------------------------------------ */

export async function fetchForumIndex(session: string): Promise<T.ForumIndexResponse> {
  const html = await authedGet(session, '/forum');
  return parseForumIndex(html);
}

export async function fetchForumCategory(session: string, categoryId: number): Promise<T.ForumCategory> {
  const html = await authedGet(session, `/forum/${categoryId}`);
  return parseForumCategoryPage(html, categoryId);
}

export async function fetchForumThread(session: string, threadId: number): Promise<T.ForumThreadPage> {
  const html = await authedGet(session, `/forum/thread/${threadId}`);
  return parseThreadPage(html, threadId);
}

export async function replyToThread(session: string, threadId: number, body: string): Promise<{ ok: true }> {
  await authedPost(session, '/forum/create_post', {
    'post[id]': '',
    'post[thread_id]': String(threadId),
    'post[body]': body,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Watch parties                                                       */
/* ------------------------------------------------------------------ */

export async function fetchWatchParties(session: string): Promise<T.WatchParty[]> {
  try {
    const data = await authedJson<{ parties: { code?: string; name?: string; link?: string; members?: number }[] }>(session, '/parties/list');
    if (Array.isArray(data.parties) && data.parties.length) {
      return data.parties
        .filter((p) => p && p.code)
        .map((p) => ({
          code: String(p.code),
          name: p.name ?? null,
          link: p.link ?? null,
          members: p.members ?? null,
        }));
    }
  } catch {
    // fall through to page scrape
  }
  const html = await authedGet(session, '/watch-parties');
  return parseWatchPartiesPage(html);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function fetchSettings(session: string) {
  const html = await authedGet(session, '/registrations/edit');
  return parseSettingsPage(html);
}

export interface SettingsUpdate {
  gender?: string;
  birthdayYear?: string;
  birthdayMonth?: string;
  birthdayDay?: string;
  countryId?: string;
  city?: string;
  bio?: string;
  hobbies?: string;
  pmMessage?: string;
  wallViewAccess?: string;
  wallPostAccess?: string;
}

/** Allowed values for PrimeWire's radio/select fields (anything else wipes them to invalid states). */
const GENDERS = new Set(['', '1', '2', '3']);
const WALL_ACCESS = new Set(['0', '1', '2']);

/**
 * Update profile settings on PrimeWire.
 * SAFE-MERGE: only the fields present in `input` are sent; everything else
 * keeps its current upstream value (a partial update must NEVER blank the
 * user's profile — an invalid wall_view_access upstream hard-500s their
 * public profile page). Radio values are validated; anything invalid is
 * dropped so the current value survives.
 */
export async function updateSettings(session: string, input: SettingsUpdate): Promise<{ ok: true }> {
  const current = await fetchSettings(session);
  const form: Record<string, string> = {
    'registration[gender]': current.gender ?? '',
    'registration[birthday][year]': current.birthdayYear ?? '',
    'registration[birthday][month]': current.birthdayMonth ?? '',
    'registration[birthday][day]': current.birthdayDay ?? '',
    'registration[country_id]': current.countryId ?? '',
    'registration[city]': current.city ?? '',
    'registration[bio]': current.bio ?? '',
    'registration[hobbies]': current.hobbies ?? '',
    'registration[pm_message]': current.pmMessage ?? '',
    'registration[wall_view_access]': current.wallViewAccess ?? '0',
    'registration[wall_post_access]': current.wallPostAccess ?? '0',
  };
  if (input.gender !== undefined) {
    const g = input.gender.trim();
    if (GENDERS.has(g)) form['registration[gender]'] = g;
  }
  for (const [key, allowed] of [
    ['registration[wall_view_access]', input.wallViewAccess],
    ['registration[wall_post_access]', input.wallPostAccess],
  ] as const) {
    if (allowed !== undefined) {
      const v = allowed.trim();
      if (WALL_ACCESS.has(v)) form[key] = v;
    }
  }
  if (input.countryId !== undefined) form['registration[country_id]'] = input.countryId.trim();
  if (input.city !== undefined) form['registration[city]'] = input.city;
  if (input.bio !== undefined) form['registration[bio]'] = input.bio;
  if (input.hobbies !== undefined) form['registration[hobbies]'] = input.hobbies;
  if (input.pmMessage !== undefined) form['registration[pm_message]'] = input.pmMessage;
  if (input.birthdayYear !== undefined) form['registration[birthday][year]'] = input.birthdayYear.trim();
  if (input.birthdayMonth !== undefined) form['registration[birthday][month]'] = input.birthdayMonth.trim();
  if (input.birthdayDay !== undefined) form['registration[birthday][day]'] = input.birthdayDay.trim();
  form.mysettings = 'Update Settings';

  await authedPost(session, '/registrations', form, { methodOverride: 'put' });
  return { ok: true };
}

export async function changePassword(
  session: string,
  current: string,
  next: string,
): Promise<{ ok: true }> {
  await authedPost(
    session,
    '/registrations',
    {
      'registration[current_password]': current,
      'registration[password]': next,
      'registration[password_confirmation]': next,
      mysettings: 'Update Settings',
    },
    { methodOverride: 'put' },
  );
  return { ok: true };
}

export async function resetApiKey(session: string): Promise<string | null> {
  await authedAction(session, '/user/reset_api_key');
  const settings = await fetchSettings(session);
  return settings.apiKey;
}

export async function logoutEverywhere(session: string): Promise<{ ok: true }> {
  const csrf = await getCsrf(session);
  await authedFetch(session, '/sessions/all', {
    method: 'DELETE',
    csrfHeader: csrf,
    form: { _csrf_token: csrf },
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* User links                                                          */
/* ------------------------------------------------------------------ */

export async function fetchUserLinks(session: string, name: string): Promise<T.UserLink[]> {
  const html = await authedGet(session, `/links/user/${encodeURIComponent(name)}`);
  return parseUserLinksPage(html);
}

/* ------------------------------------------------------------------ */
/* Public PrimeWire API (v1) — works with the session cookie           */
/* ------------------------------------------------------------------ */

export interface ApiShowInfo {
  id?: number;
  title?: string;
  year?: number | null;
  type?: string;
  imdb_id?: string | null;
  tvmaze_id?: number | null;
  current_quality?: string | null;
  error?: string;
}

/**
 * PrimeWire's /api/v1/show — REQUIRES the account's API key as `key` (a
 * session cookie alone gets "Missing valid API key"; with a key, accounts
 * younger than PrimeWire's age threshold get "Account too new to use this
 * API" — that message is surfaced verbatim).
 */
export async function apiShow(
  session: string,
  params: { id?: number; imdbId?: string; tvmazeId?: number; apiKey?: string | null },
): Promise<ApiShowInfo> {
  const query = qs({
    id: params.id,
    imdb_id: params.imdbId,
    tvmaze_id: params.tvmazeId,
    key: params.apiKey ?? undefined,
  });
  return authedJson<ApiShowInfo>(session, `/api/v1/show?${query}`);
}

export interface ApiSource {
  id?: number;
  link?: string;
  host?: string;
  quality?: string;
  language?: string;
  type?: string;
  [k: string]: unknown;
}

export async function apiSources(
  session: string,
  params: { type: 'movie' | 'tv'; imdb?: string; tmdb?: string; tvmaze?: string; season?: number; episode?: number },
): Promise<{ info?: Record<string, unknown>; sources?: ApiSource[]; error?: string }> {
  const query = qs({
    type: params.type,
    imdb: params.imdb,
    tmdb: params.tmdb,
    tvmaze: params.tvmaze,
    season: params.season,
    episode: params.episode,
  });
  return authedJson(session, `/api/v1/s?${query}`);
}

/* ------------------------------------------------------------------ */
/* Submit a streaming link (uses the user's PrimeWire API key)          */
/* ------------------------------------------------------------------ */

export async function submitLink(
  session: string,
  pwApiKey: string | null,
  input: {
    type: 'movie' | 'tv';
    pwShowId: number;
    link: string;
    quality?: string;
    season?: number;
    episode?: number;
    pwVideoId?: number;
    audioLanguage?: string;
    audioType?: string;
  },
): Promise<{ success?: string; error?: string }> {
  const query = qs({
    key: pwApiKey ?? undefined,
    type: input.type,
    pw_show_id: input.pwShowId,
    episode: input.episode,
    season: input.season,
    pw_video_id: input.pwVideoId,
    link: input.link,
    quality: input.quality,
    audio_language: input.audioLanguage,
    audio_type: input.audioType,
  });
  try {
    return await authedJson(session, `/api/v1/submit_link?${query}`);
  } catch {
    // fall back to the anonymous fetch path
    const html = await fetchPage(`/api/v1/submit_link?${query}`);
    try {
      return JSON.parse(html) as { success?: string; error?: string };
    } catch {
      return { error: 'Submit failed' };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Detail-page signed-in state (tracker + episode watched + own rating) */
/* ------------------------------------------------------------------ */

import { detailPath } from './client';
import { parseEpisodeStates, parseTrackerState } from './account-parser';
import type { LibraryItemState } from './account-types';
import type { EpisodeWatchState } from './account-parser';

export interface DetailAccountState {
  tracker: LibraryItemState;
  episodes: EpisodeWatchState[];
}

/** Fetch a detail page with the session and read the signed-in widget state. */
export async function fetchDetailState(
  session: string,
  type: 'movie' | 'tv',
  id: number,
  slug = '',
): Promise<DetailAccountState> {
  const html = await authedGet(session, detailPath(type, id, slug));
  return {
    tracker: parseTrackerState(html),
    episodes: parseEpisodeStates(html),
  };
}
