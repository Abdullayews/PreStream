"use client";

import {
  CircleUserRound,
  ExternalLink,
  Eye,
  Gift,
  MapPin,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { avatarUrl } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { ACCOUNT_TABS, toAccount, toBrowse } from "../nav";
import { SectionTitle } from "../section-title";
import { useUser, useUserHydrated } from "../stores/user";
import { useAccountMe } from "../hooks/use-account";
import { openSignIn } from "../onboarding-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsTab } from "./comments-tab";
import { CommunityTab } from "./community-tab";
import { ForumTab } from "./forum-tab";
import { FeedTab } from "./feed-tab";
import { FriendsTab } from "./friends-tab";
import { LibraryTab } from "./library-tab";
import { LinksTab } from "./links-tab";
import { MessagesTab } from "./messages-tab";
import { NotificationsTab } from "./notifications-tab";
import { PartiesTab } from "./parties-tab";
import { PlaylistsTab } from "./playlists-tab";
import { RecommendedTab } from "./recommended-tab";
import { ScheduleTab } from "./schedule-tab";

const TAB_LABELS: Record<string, string> = {
  library: "Library",
  playlists: "Playlists",
  schedule: "Schedule",
  recommended: "Recommended",
  feed: "Feed",
  messages: "Messages",
  notifications: "Notifications",
  friends: "Friends",
  comments: "My Comments",
  community: "Community",
  forum: "Forum",
  links: "Links",
  parties: "Watch Parties",
};

/**
 * Account hub — the signed-in member's PrimeWire home: identity hero plus
 * a pill tab bar (Library / Playlists / Schedule / …) persisted in ?tab=.
 */
export function AccountView() {
  const router = useRouter();
  const sp = useSearchParams();
  const hydrated = useUserHydrated();
  const username = useUser((s) => s.username);
  const avatar = useUser((s) => s.avatar);

  const rawTab = sp.get("tab") ?? "library";
  const tab = (ACCOUNT_TABS as readonly string[]).includes(rawTab)
    ? rawTab
    : "library";

  const me = useAccountMe();
  const user = me.data?.user;
  const sidebar = me.data?.sidebar;

  const selectTab = (next: string) => {
    if (next === tab) return;
    toAccount(router, next, undefined, { replace: true });
  };

  /* signed out — onboarding is open, show a quiet panel underneath */
  if (hydrated && !username) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 pb-32 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
          <CircleUserRound className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Sign in to PrimeWire
          </h1>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your library, playlists, schedule and social activity live in your
            PrimeWire account.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => toBrowse(router, {})}>
          Browse the catalog
        </Button>
        <Button
          className="rounded-full"
          onClick={() => {
            if (typeof window !== "undefined") openSignIn();
          }}
        >
          Sign in
        </Button>
      </div>
    );
  }

  const avatarSrc = avatarUrl(avatar) ?? avatarUrl(user?.avatar ?? null);
  const heroLoading = me.isLoading && !me.data;

  return (
    <div>
      {/* ---------------- hero ---------------- */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6">
        {heroLoading ? (
          <div className="flex items-center gap-4 sm:gap-6" aria-busy="true">
            <Skeleton className="size-20 rounded-full sm:size-24" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-start gap-4 sm:items-center sm:gap-6">
            <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 sm:size-24">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${user.username}'s avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CircleUserRound className="size-9 text-muted-foreground/60" aria-hidden />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <SectionTitle as="h1" className="truncate text-2xl sm:text-3xl">
                {user.username}
              </SectionTitle>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <MetaChip>
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      user.online ? "bg-foreground" : "bg-muted-foreground/40",
                    )}
                  />
                  {user.online ? "Online" : "Offline"}
                </MetaChip>
                {user.from && (
                  <MetaChip>
                    <MapPin className="size-3" aria-hidden />
                    {user.from}
                  </MetaChip>
                )}
                {user.joined && <MetaChip>Joined {user.joined}</MetaChip>}
                {user.profileViews != null && (
                  <MetaChip>
                    <Eye className="size-3" aria-hidden />
                    {user.profileViews.toLocaleString()} views
                  </MetaChip>
                )}
                {user.kudos != null && (
                  <MetaChip>
                    <Gift className="size-3" aria-hidden />
                    {user.kudos.toLocaleString()} kudos
                  </MetaChip>
                )}
              </div>
            </div>

          </div>
        ) : me.isError ? (
          <div className="flex items-center gap-3">
            <span className="flex size-16 items-center justify-center rounded-full bg-muted">
              <CircleUserRound className="size-7 text-muted-foreground" aria-hidden />
            </span>
            <div>
              <SectionTitle as="h1" className="text-2xl">
                {username}
              </SectionTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Profile details are unavailable right now.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------------- sticky tab bar ---------------- */}
      <div className="glass sticky top-16 z-40 rounded-none border-x-0 border-t-0">
        <div className="mx-auto max-w-7xl px-4 pt-1 sm:px-6">
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto py-2.5"
            role="tablist"
            aria-label="Account sections"
          >
            {(ACCOUNT_TABS as readonly string[]).map((id) => {
              const active = id === tab;
              const unread =
                id === "messages"
                  ? sidebar?.messageCount
                  : id === "notifications"
                    ? sidebar?.notificationCount
                    : 0;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(id)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {TAB_LABELS[id] ?? id}
                  {!!unread && unread > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- tab content (pb-32 clears the dock) ---------------- */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-32 sm:px-6">
        {tab === "library" && <LibraryTab />}
        {tab === "playlists" && <PlaylistsTab />}
        {tab === "schedule" && <ScheduleTab />}
        {tab === "recommended" && <RecommendedTab />}
        {tab === "feed" && <FeedTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "friends" && <FriendsTab />}
        {tab === "comments" && <CommentsTab />}
        {tab === "community" && <CommunityTab />}
        {tab === "forum" && <ForumTab />}
        {tab === "links" && <LinksTab />}
        {tab === "parties" && <PartiesTab />}
      </div>
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}
