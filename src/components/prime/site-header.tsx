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
 * Slim glass header — logo, a spotlight search trigger (⌘K), and the
 * account chip (the only action on the right). Watchlist, appearance and
 * every other control live inside the settings sheet the account opens.
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
      <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
        {/* main row — h-16 */}
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
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

          <div className="ml-auto flex items-center gap-1.5">
            {/* search trigger — opens the spotlight palette */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              aria-keyshortcuts="Control+K"
              className="group flex h-11 items-center gap-2.5 rounded-full border border-border/70 bg-foreground/[0.04] pr-2 pl-3.5 text-muted-foreground transition-all hover:border-foreground/25 hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden text-sm font-medium sm:block">Search</span>
              <kbd className="hidden items-center gap-0.5 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground md:flex">
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
                className="flex h-11 items-center gap-2 rounded-full pr-1 pl-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CircleUserRound className="size-5" aria-hidden />
                  )}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium md:block">
                  {username}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openSignIn()}
                aria-label="Sign in to PrimeWire"
                className="glass flex h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
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
