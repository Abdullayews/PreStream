"use client";

import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type {
  AvatarUploadResponse,
  CommentsFeedResponse,
  FeedResponse,
  FriendsResponse,
  LibraryResponse,
  LinksResponse,
  LoginResponse,
  MeResponse,
  MessagesResponse,
  MyPlaylistsResponse,
  NotificationsResponse,
  PartiesResponse,
  PersonalScheduleResponse,
  PlaylistSearchResponse,
  RecommendedResponse,
  SettingsResponse,
} from "@/lib/account-client-types";
import { canonicalThemeId } from "@/themes/registry";
import { openRelogin } from "../stores/relogin";
import { useUser } from "../stores/user";

/* ------------------------------------------------------------------ */
/* Fetch plumbing                                                      */
/* ------------------------------------------------------------------ */

/** Error shape thrown for every non-2xx /api/account response. */
export class AccountError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "AccountError";
    this.status = status;
    this.code = code;
  }
}

const SESSION_CODES = new Set(["session-expired", "no-session", "unknown-key"]);

/** Open the global re-login guard for 401 session-style failures. */
function guardSessionError(err: AccountError): void {
  if (err.status === 401 && err.code && SESSION_CODES.has(err.code)) {
    // openRelogin writes the store AND fires a window event, so the prompt
    // opens even if hot reloads left the fetch layer and the dialog on
    // different copies of the store module.
    openRelogin(err.message);
  }
}

/* ------------------------------------------------------------------ */
/* Session self-heal (redeploy recovery)                               */
/* ------------------------------------------------------------------ */

let healInFlight: Promise<LoginResponse | null> | null = null;

async function runHeal(): Promise<LoginResponse | null> {
  const { apiKey, pwSession } = useUser.getState();
  if (!apiKey || !pwSession) return null;
  try {
    const res = await fetch("/api/account/heal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, pwSession }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LoginResponse;
    if (!data?.apiKey) return null;

    // Apply the healed identity. A fresh row starts at the default theme —
    // re-assert the client's saved choice so the UI never flashes and the
    // server-side cache catches up on the next patch.
    const savedTheme = useUser.getState().themeId;
    useUser.getState().setProfileFromLogin(data);
    const canonical = canonicalThemeId(savedTheme);
    if (canonical) useUser.getState().setTheme(canonical);
    return data;
  } catch {
    return null;
  }
}

/**
 * One heal at a time, shared by every concurrent 401 (a wiped database
 * fails a whole page of queries at once — they must not each rebuild the
 * profile; the first one heals, the rest reuse the same promise).
 */
function tryHeal(): Promise<LoginResponse | null> {
  if (!healInFlight) {
    healInFlight = runHeal().finally(() => {
      healInFlight = null;
    });
  }
  return healInFlight;
}

/**
 * Run one /api/account request. On a 401 session failure, self-heal once
 * (rebuild the server profile from the client-held PrimeWire session) and
 * transparently retry — the user stays signed in. The request factory is
 * invoked AGAIN for the retry so it picks up the (possibly rotated) apiKey.
 * Only when healing is impossible (no stored session / session dead) does
 * the re-login guard open as before.
 */
async function guardedAccountFetch<T>(run: () => Promise<Response>): Promise<T> {
  let res = await run();
  // Parsed lazily — the first 401's body must survive the heal attempt so
  // the final error still carries the original code/message for the guard.
  let body: { error?: string; code?: string } = {};

  if (res.status === 401) {
    body = await parseErrorBody(res);
    const code = body.code ?? null;
    if (code && SESSION_CODES.has(code)) {
      const healed = await tryHeal();
      if (healed) {
        const retried = await run();
        if (retried.ok) return (await retried.json()) as T;
        res = retried;
        body = await parseErrorBody(res);
      }
    }
  }

  if (!res.ok) {
    const err = new AccountError(
      body.error ?? `Request failed (${res.status})`,
      res.status,
      body.code ?? null,
    );
    guardSessionError(err);
    throw err;
  }
  return (await res.json()) as T;
}

async function parseErrorBody(res: Response): Promise<{ error?: string; code?: string }> {
  try {
    return (await res.json()) as { error?: string; code?: string };
  } catch {
    return {};
  }
}

export type AccountParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Serialize params, skipping null/undefined/empty values. */
function buildSearch(params: AccountParams): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (!value) continue;
    qs.set(key, value);
  }
  return qs;
}

/** GET /api/account/{path}?…&key=… — includes the session guard + self-heal. */
export async function accountGet<T>(path: string, params: AccountParams = {}): Promise<T> {
  return guardedAccountFetch<T>(() => {
    // apiKey is read INSIDE the factory: a heal may rotate it between the
    // failed attempt and the retry.
    const apiKey = useUser.getState().apiKey;
    const qs = buildSearch({ ...params, key: apiKey ?? "" });
    return fetch(`/api/account/${path}?${qs.toString()}`);
  });
}

/** POST /api/account/{path} with { apiKey, …body } — includes the session guard + self-heal. */
export async function accountPost<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  return guardedAccountFetch<T>(() => {
    const apiKey = useUser.getState().apiKey;
    return fetch(`/api/account/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, apiKey: apiKey ?? "" }),
    });
  });
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export interface UseAccountOptions {
  enabled?: boolean;
  /** Defaults to 30s (60s for settings). */
  staleTime?: number;
  /** Keep previous data while the next page/filter loads. */
  keepPrevious?: boolean;
}

/**
 * Account query key — INCLUDES the account identity so a cache entry for
 * one user is never served to another.
 * Exported for tests and for targeted invalidation.
 */
export function accountQueryKey(
  path: string,
  params: AccountParams,
  apiKey: string | null,
): unknown[] {
  return ["account", apiKey ?? "signed-out", path, params];
}

/**
 * Generic typed account query — GET /api/account/{path} with the stored
 * key appended. Disabled while signed out. The query key carries the
 * account identity: switching accounts can never render the previous
 * user's cached data (Providers also clears the cache on account switch).
 */
export function useAccount<T>(
  path: string,
  params: AccountParams = {},
  options: UseAccountOptions = {},
) {
  const apiKey = useUser((s) => s.apiKey);
  const enabled = (options.enabled ?? true) && !!apiKey;

  return useQuery({
    queryKey: accountQueryKey(path, params, apiKey),
    queryFn: () => accountGet<T>(path, params),
    enabled,
    // account data comes fresh from PrimeWire on every mount — only the
    // browser-cached account info + settings persist across visits
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: options.keepPrevious ? keepPreviousData : undefined,
  });
}

/* ---------------- concrete queries ---------------- */

/** Live identity + sidebar unread counts. */
export function useAccountMe() {
  return useAccount<MeResponse>("me");
}

/** PrimeWire settings (60s stale — the heaviest authenticated page). */
export function useAccountSettings() {
  return useAccount<SettingsResponse>("settings", {}, { staleTime: 60_000 });
}

/** The signed-in user's library (filterable, paginated). */
export function useAccountLibrary(filters: AccountParams) {
  return useAccount<LibraryResponse>("library", filters, { keepPrevious: true });
}

/** My playlists + favorited playlists. */
export function useAccountPlaylists() {
  return useAccount<MyPlaylistsResponse>("playlists");
}

/** Personal schedule (library shows' episodes). */
export function useAccountSchedule() {
  return useAccount<PersonalScheduleResponse>("schedule");
}

/** Recommendations based on library + favorites. */
export function useAccountRecommended() {
  return useAccount<RecommendedResponse>("recommended");
}

/** Activity feed. */
export function useAccountFeed() {
  return useAccount<FeedResponse>("feed");
}

/** DM inbox. */
export function useAccountMessages() {
  return useAccount<MessagesResponse>("messages");
}

/** Notifications. */
export function useAccountNotifications() {
  return useAccount<NotificationsResponse>("notifications");
}

/** Friends (confirmed + unconfirmed). */
export function useAccountFriends() {
  return useAccount<FriendsResponse>("friends");
}

/** The user's submitted links. */
export function useAccountLinks() {
  return useAccount<LinksResponse>("links");
}

/** The user's own comments (feed sort selectable). */
export function useAccountMyComments(
  sort: "latest" | "best-recent",
  user: string | null,
) {
  return useAccount<CommentsFeedResponse>(
    "comments",
    { sort, user: user ?? "" },
    { enabled: !!user, keepPrevious: true },
  );
}

/** Returns a value that only updates after `ms` of no changes. */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * PrimeWire's playlist-editor search (get_shows) — shows that can be
 * added to a playlist. Debounced; fires for terms of 2+ characters.
 */
export function useAccountPlaylistSearch(
  playlistId: number | null,
  term: string,
  type?: "movie" | "tv",
) {
  const debounced = useDebouncedValue(term.trim(), 300);
  return useAccount<PlaylistSearchResponse>(
    "playlist-search",
    {
      playlistId: playlistId ?? "",
      q: debounced,
      type: type ?? "",
    },
    {
      enabled: !!playlistId && debounced.length >= 2,
      keepPrevious: true,
      staleTime: 60_000,
    },
  );
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface UseAccountMutationOptions<TData, TVars> {
  /** Query-key prefixes to invalidate on success. */
  invalidates?: ReadonlyArray<readonly unknown[]>;
  onOk?: (data: TData, vars: TVars) => void;
}

/**
 * Generic typed account mutation — POST /api/account/{path} with the stored
 * key merged into the body. Invalidates the given query-key prefixes.
 */
export function useAccountMutation<
  TData,
  TVars extends Record<string, unknown> = Record<string, unknown>,
>(path: string, options: UseAccountMutationOptions<TData, TVars> = {}): UseMutationResult<
  TData,
  AccountError,
  TVars
> {
  const qc = useQueryClient();
  return useMutation<TData, AccountError, TVars>({
    mutationFn: (vars) => accountPost<TData>(path, vars),
    onSuccess: (data, vars) => {
      for (const key of options.invalidates ?? []) {
        void qc.invalidateQueries({ queryKey: [...key] });
      }
      options.onOk?.(data, vars);
    },
  });
}

/** Multi-part avatar upload (POST /api/account/avatar). */
export function useAvatarUpload(): UseMutationResult<
  AvatarUploadResponse,
  AccountError,
  { file: File }
> {
  const qc = useQueryClient();
  const setAvatar = useUser((s) => s.setAvatar);

  return useMutation<AvatarUploadResponse, AccountError, { file: File }>({
    mutationFn: ({ file }) =>
      guardedAccountFetch<AvatarUploadResponse>(() => {
        const form = new FormData();
        form.append("apiKey", useUser.getState().apiKey ?? "");
        form.append("file", file);
        return fetch("/api/account/avatar", { method: "POST", body: form });
      }),
    onSuccess: (data) => {
      if (data.avatar) setAvatar(data.avatar);
      void qc.invalidateQueries({ queryKey: ["account", "settings"] });
      void qc.invalidateQueries({ queryKey: ["account", "me"] });
    },
  });
}

/** Export-library CSV URL (opens as a download in a new tab). */
export function exportLibraryHref(apiKey: string): string {
  return `/api/account/export-library?key=${encodeURIComponent(apiKey)}`;
}
