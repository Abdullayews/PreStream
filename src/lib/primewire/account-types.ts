/**
 * Account-surface types — every authenticated PrimeWire function.
 */
import type { MediaItem } from './types';

export type WatchStatus = 'watched' | 'in-progress' | 'plan-to-watch' | 'on-hold' | 'dropped';

/* ---------------- Who am I ---------------- */

export interface PwUser {
  username: string;
  userId: number | null;
  avatar: string | null;
  gender: string | null;
  from: string | null;
  joined: string | null;
  lastActive: string | null;
  online: boolean;
  profileViews: number | null;
  kudos: number | null;
  about: string | null;
  hobbies: string | null;
  sourceUrl: string;
}

export interface WallPost {
  id: string;
  author: string | null;
  authorAvatar: string | null;
  body: string;
  postedAgo: string | null;
}

export interface PwUserProfile extends PwUser {
  wall: WallPost[];
  /** Actions available toward this user (present when viewing someone else). */
  userIdForActions: number | null;
}

/* ---------------- Library ---------------- */

export interface LibraryItem extends MediaItem {
  status: WatchStatus | null;
  favorite: boolean;
}

export interface LibraryResponse {
  items: LibraryItem[];
  page: number;
  pages: number[];
  hasNext: boolean;
  owner: string;
}

export interface LibraryItemState {
  library: boolean;
  status: WatchStatus | null;
  favorite: boolean;
  schedule: boolean;
}

/* ---------------- Playlists (owned) ---------------- */

/** An item in one of the user's playlists, as PrimeWire's edit page sees it
 *  (the playlist-item id is only exposed there — remove/move actions need it). */
export interface PlaylistEditItem {
  itemId: number;
  showId: number | null;
  type: 'movie' | 'tv' | null;
  title: string;
  year: number | null;
  poster: string | null;
}

export interface MyPlaylistsResponse {
  mine: {
    id: number;
    slug: string;
    title: string;
    itemCount: number | null;
    views: number | null;
    favorites: number | null;
    poster: string | null;
    description: string | null;
    private: boolean;
    createdAgo: string | null;
  }[];
  favoritePlaylists: {
    id: number;
    slug: string;
    title: string;
    itemCount: number | null;
    views: number | null;
    favorites: number | null;
    poster: string | null;
    description: string | null;
  }[];
}

/* ---------------- Comments ---------------- */

export interface PwComment {
  id: number;
  author: string | null;
  body: string;
  points: number | null;
  postedAgo: string | null;
  /** Show/episode context label (comments feeds), e.g. "The Daily Show (2023) S4 E115" */
  context: string | null;
  contextHref: string | null;
  parentId: number | null;
  replies: PwComment[];
  /** Vote state for the signed-in user ("" | "up" | "down") — from arrow classes. */
  voted: '' | 'up' | 'down';
}

export interface CommentsFeedResponse {
  comments: PwComment[];
  sort: string;
}

/* ---------------- Messages / notifications ---------------- */

export interface MessageThread {
  id: string;
  withUser: string | null;
  lastBody: string | null;
  postedAgo: string | null;
  unread: boolean;
  href: string;
}

export interface PwNotification {
  id: string;
  body: string;
  postedAgo: string | null;
  href: string | null;
}

/* ---------------- Friends ---------------- */

export interface FriendSummary {
  username: string;
  avatar: string | null;
  online: boolean;
}

export interface FriendsResponse {
  confirmed: FriendSummary[];
  unconfirmed: FriendSummary[];
}

/* ---------------- Forum ---------------- */

export interface ForumCategory {
  id: number;
  name: string;
  description: string | null;
  threads: ForumThread[];
}

export interface ForumThread {
  id: number;
  title: string;
  author: string | null;
  replies: number | null;
  lastPostAgo: string | null;
  href: string;
}

export interface ForumIndexResponse {
  categories: ForumCategory[];
}

export interface ForumThreadPage {
  thread: ForumThread;
  posts: {
    id: string;
    author: string | null;
    avatar: string | null;
    body: string;
    postedAgo: string | null;
  }[];
}

/* ---------------- Watch parties ---------------- */

export interface WatchParty {
  code: string;
  name: string | null;
  link: string | null;
  members: number | null;
}

/* ---------------- Settings ---------------- */

export interface PwSettings {
  username: string;
  email: string | null;
  avatar: string | null;
  apiKey: string | null;
  gender: string | null;
  birthdayYear: string | null;
  birthdayMonth: string | null;
  birthdayDay: string | null;
  countryId: string | null;
  countryName: string | null;
  city: string | null;
  bio: string | null;
  hobbies: string | null;
  /** Free-text "Message above PM box" shown to people messaging the user. */
  pmMessage: string | null;
  /** Who can view the wall: "" (everyone default) | "friends" | "none" */
  wallViewAccess: string;
  wallPostAccess: string;
}

export interface PwCountryOption {
  id: string;
  name: string;
}

/* ---------------- Submitted links ---------------- */

export interface UserLink {
  id: string;
  showTitle: string | null;
  showHref: string | null;
  episodeLabel: string | null;
  quality: string | null;
  language: string | null;
  host: string | null;
  views: number | null;
  status: string | null;
  postedAgo: string | null;
}

/* ---------------- Rating ---------------- */

export interface RatingResult {
  rating: number;
  votes: number;
}
