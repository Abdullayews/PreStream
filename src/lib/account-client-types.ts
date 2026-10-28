/**
 * Account-surface types for the CLIENT — mirrors the JSON contracts of the
 * /api/account/* routes. Re-exports the canonical server
 * types (they are type-only modules, safe to import from client code) and
 * adds the response wrappers the frontend consumes.
 */
import type {
  CommentsFeedResponse,
  FriendSummary,
  FriendsResponse,
  ForumCategory,
  ForumIndexResponse,
  ForumThread,
  ForumThreadPage,
  LibraryItem,
  LibraryItemState,
  LibraryResponse,
  MessageThread,
  MyPlaylistsResponse,
  PlaylistEditItem,
  PwComment,
  PwCountryOption,
  PwNotification,
  PwSettings,
  PwUser,
  PwUserProfile,
  RatingResult,
  UserLink,
  WatchParty,
  WatchStatus,
  WallPost,
} from "@/lib/primewire/account-types";
import type { MediaItem, ScheduleDay } from "@/lib/primewire/types";

export type {
  CommentsFeedResponse,
  FriendSummary,
  FriendsResponse,
  ForumCategory,
  ForumIndexResponse,
  ForumThread,
  ForumThreadPage,
  LibraryItem,
  LibraryItemState,
  LibraryResponse,
  MessageThread,
  MyPlaylistsResponse,
  PlaylistEditItem,
  PwComment,
  PwCountryOption,
  PwNotification,
  PwSettings,
  PwUser,
  PwUserProfile,
  RatingResult,
  UserLink,
  WatchParty,
  WatchStatus,
  WallPost,
};

/* ---------------- auth ---------------- */

/** POST /api/account/login → identity + our apiKey token. */
export interface LoginUser {
  username: string;
  userId: number | null;
  avatar: string | null;
  pwApiKey: string | null;
  gender: string | null;
  from: string | null;
  joined: string | null;
  online: boolean;
  sourceUrl: string;
}

export interface SidebarSummary {
  username: string;
  avatar: string | null;
  messageCount: number;
  notificationCount: number;
}

export interface LoginResponse {
  /** OUR API token (ps_…) — the PrimeWire session lives server-side. */
  apiKey: string;
  isNew: boolean;
  user: LoginUser;
  sidebar: SidebarSummary;
  themeId: string;
  watchlist: unknown;
}

/** GET /api/account/me */
export interface AccountUser extends PwUser {
  pwApiKey: string | null;
}

export interface MeResponse {
  user: AccountUser;
  sidebar: SidebarSummary;
}

/** GET /api/account/profile?name= */
export interface ProfileResponse {
  profile: PwUserProfile;
}

/** GET /api/account/settings (PwSettings + the country select options). */
export interface AccountSettings extends PwSettings {
  countryOptions: PwCountryOption[];
}

export interface SettingsResponse {
  settings: AccountSettings;
}

/* ---------------- library / lists ---------------- */

export interface RecommendedResponse {
  items: MediaItem[];
}

export interface PlaylistSearchResponse {
  items: MediaItem[];
}

/** GET /api/account/playlists?items={id} — editable items with real item ids. */
export interface PlaylistItemsResponse {
  items: PlaylistEditItem[];
}

/* ---------------- activity ---------------- */

export interface FeedResponse {
  comments: PwComment[];
}

export interface MessagesResponse {
  threads: MessageThread[];
}

export interface NotificationsResponse {
  notifications: PwNotification[];
}

export interface LinksResponse {
  links: UserLink[];
}

/** GET /api/account/parties — each party also gets a direct join URL. */
export interface PartyEntry extends WatchParty {
  url: string;
}

export interface PartiesResponse {
  parties: PartyEntry[];
}

/* ---------------- personal schedule ---------------- */

export interface PersonalScheduleResponse {
  days: ScheduleDay[];
  updatedAt: string;
}

/* ---------------- mutations ---------------- */

export interface OkResponse {
  ok: boolean;
}

export interface ResetKeyResponse {
  ok: boolean;
  apiKey: string | null;
}

export interface VoteResult {
  ok?: boolean;
  score?: number;
}

export interface AvatarUploadResponse {
  ok: boolean;
  avatar: string | null;
}

/* ---------------- helpers ---------------- */

/**
 * Build a same-origin proxy URL for a PrimeWire avatar path
 * (e.g. "/avatar/Xk9dJ.jpg" or "/avatar/noavatar.jpg").
 * Pass `bust` (e.g. Date.now()) after an upload to bypass caches.
 * Returns null for unknown shapes — callers render the icon fallback.
 */
export function avatarUrl(
  path: string | null | undefined,
  bust?: string | number | null,
): string | null {
  if (!path) return null;
  if (!/^\/avatar\/[A-Za-z0-9_-]{3,24}\.(jpg|jpeg|png|webp|gif)$/i.test(path)) {
    return null;
  }
  const url = `/api/primewire/image?path=${encodeURIComponent(path)}`;
  return bust ? `${url}&v=${encodeURIComponent(String(bust))}` : url;
}

/** Absolute PrimeWire profile URL for a username. */
export function primewireUserUrl(username: string): string {
  return `https://primewire.pw/user/${encodeURIComponent(username)}`;
}
