"use client";

import { Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { BrowseView } from "@/components/prime/browse-view";
import { DetailView } from "@/components/prime/detail-view";
import { HomeView } from "@/components/prime/home-view";
import { AccountView } from "@/components/prime/account/account-view";
import { ForumView } from "@/components/prime/forum-view";
import { UserProfileView } from "@/components/prime/user-profile-view";
import { OnboardingDialog } from "@/components/prime/onboarding-dialog";
import { PlaylistDetail } from "@/components/prime/playlist-detail";
import { PlayerView } from "@/components/prime/player-view";
import { PlaylistsView } from "@/components/prime/playlists-view";
import { ScheduleView } from "@/components/prime/schedule-view";
import { SiteDock } from "@/components/prime/site-dock";
import { SiteFooter } from "@/components/prime/site-footer";
import { SiteHeader } from "@/components/prime/site-header";
import { PageSkeleton } from "@/components/prime/skeletons";

/**
 * PreStream is a single-page app on `/` — the active view is driven by
 * search params (?view=home|browse|detail|schedule|playlists|playlist).
 */
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PreStreamApp />
    </Suspense>
  );
}

function PreStreamApp() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "home";

  let content: React.ReactNode;
  if (view === "browse") {
    content = <BrowseView />;
  } else if (view === "detail") {
    content = (
      <DetailView
        type={searchParams.get("type")}
        id={searchParams.get("id")}
        slug={searchParams.get("slug")}
      />
    );
  } else if (view === "schedule") {
    content = <ScheduleView />;
  } else if (view === "playlists") {
    content = <PlaylistsView />;
  } else if (view === "account") {
    content = <AccountView />;
  } else if (view === "user") {
    content = <UserProfileView name={searchParams.get("name")} />;
  } else if (view === "forum") {
    content = (
      <ForumView
        category={searchParams.get("category")}
        thread={searchParams.get("thread")}
      />
    );
  } else if (view === "playlist") {
    content = (
      <PlaylistDetail
        id={searchParams.get("id")}
        slug={searchParams.get("slug")}
      />
    );
  } else if (view === "player") {
    content = (
      <PlayerView
        type={searchParams.get("type")}
        id={searchParams.get("id")}
        slug={searchParams.get("slug")}
        season={searchParams.get("season")}
        number={searchParams.get("number")}
      />
    );
  } else {
    content = <HomeView />;
  }

  // remount on view change (and detail/playlist→same-view) so scroll + fade reset
  const viewKey =
    view === "detail"
      ? `detail-${searchParams.get("type")}-${searchParams.get("id")}`
      : view === "playlist"
        ? `playlist-${searchParams.get("id")}`
        : view === "player"
          ? `player-${searchParams.get("type")}-${searchParams.get("id")}-s${searchParams.get("season") ?? ""}-e${searchParams.get("number") ?? ""}`
          : view === "account"
            ? `account-${searchParams.get("tab")}`
            : view === "user"
              ? `user-${searchParams.get("name")}`
              : view === "forum"
                ? `forum-${searchParams.get("thread") ?? searchParams.get("category") ?? "index"}`
                : view;

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <ViewFade key={viewKey}>{content}</ViewFade>
      </main>
      {/* Footer sits just above the reserved dock lane (see globals.css
          .app-shell padding — calculated from the dock's measured
          footprint, so no fixed bottom padding is needed here anymore). */}
      <SiteFooter className="mt-auto" />
      {/* floating glass dock — primary navigation */}
      <SiteDock />
      {/* first-visit sign-in / account creation */}
      <OnboardingDialog />
    </div>
  );
}

/** View mount: fade in from below + scroll back to the top. */
function ViewFade({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
