"use client";

import { CircleUserRound, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { avatarUrl } from "@/lib/account-client-types";
import { PreStreamLogo } from "./logo";
import { toHome } from "./nav";
import { SearchSpotlight, openSearch } from "./search-spotlight";
import { openSignIn } from "./onboarding-dialog";
import { SettingsSheet, openSettings } from "./settings-sheet";
import { useUser, useUserHydrated } from "./stores/user";
import { WatchlistDrawer } from "./watchlist-drawer";
import { useEffect, useState } from "react";

/**
 * Basement-style header — a slim FIXED transparent bar floating over the
 * stage (the hero artwork runs beneath it). Logo left; a quiet search
 * pill and the account chip right. Primary navigation lives in the
 * floating dock below (PreStream's own system, unchanged).
 */
export function SiteHeader() {
  const router = useRouter();

  const userHydrated = useUserHydrated();
  const username = useUser((s) => s.username);
  const avatar = useUser((s) => s.avatar);
  const signedIn = userHydrated && !!username;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // the dock + settings sheet dispatch a custom event to open the watchlist
  // (event name keeps the legacy "primestream" prefix — internal only)
  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener("primestream:open-watchlist", open);
    return () => window.removeEventListener("primestream:open-watchlist", open);
  }, []);

  const avatarSrc = avatarUrl(avatar);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl backdrop-saturate-150">
        {/* main row */}
        <div className="shell flex h-14 items-center gap-3 sm:h-16">
          <button
            type="button"
            onClick={() => {
              toHome(router);
              // even when already home, snap back to the top
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="PreStream — home"
            className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PreStreamLogo />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* search trigger — a quiet pill that opens the spotlight palette */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              aria-keyshortcuts="Control+K"
              className="flex h-9 items-center gap-2.5 rounded-full bg-foreground/[0.05] pr-2 pl-3.5 text-muted-foreground transition-colors hover:bg-foreground/[0.09] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="hidden text-[13px] font-medium sm:block">Search</span>
              <kbd
                className="hidden shrink-0 items-center gap-0.5 rounded-md bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground md:flex"
                aria-hidden
              >
                Ctrl K
              </kbd>
            </button>

            {/* account chip — the only persistent action */}
            {signedIn ? (
              <button
                type="button"
                onClick={() => openSettings()}
                aria-label={`Account & settings — signed in as ${username}`}
                title={`Signed in as ${username}`}
                className="flex h-9 items-center gap-2.5 rounded-full pr-2.5 pl-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative flex size-7 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CircleUserRound className="size-4.5" aria-hidden />
                  )}
                  {/* live-dot: signed-in state */}
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-foreground ring-2 ring-background"
                  />
                </span>
                <span className="hidden max-w-28 truncate text-[13px] font-semibold md:block">
                  {username}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openSignIn()}
                aria-label="Sign in to PrimeWire"
                className="flex h-9 items-center rounded-full bg-primary px-4 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <WatchlistDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <SettingsSheet />
      <SearchSpotlight />
    </>
  );
}
