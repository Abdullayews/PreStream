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
 * Aurora header — a slim glass band anchoring the stage. Logo left; a
 * widening command-bar search trigger and the account chip right. All
 * navigation lives in the floating dock below; watchlist, appearance and
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
      <header className="sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
        {/* main row — h-16 */}
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* faint top accent hairline — the stage's proscenium */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
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
            {/* search trigger — a widening command bar that opens the spotlight palette */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              aria-keyshortcuts="Control+K"
              className="group flex h-11 items-center gap-2.5 rounded-full border border-border/70 bg-card/60 pr-2 pl-4 text-muted-foreground shadow-inner transition-all duration-300 hover:w-64 hover:border-primary/40 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-44 sm:w-52 md:hover:w-72"
            >
              <Search className="size-4 shrink-0 transition-colors group-hover:text-primary" aria-hidden />
              <span className="hidden flex-1 text-left text-sm font-medium sm:block">
                Search titles…
              </span>
              <kbd
                className="hidden shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground md:flex"
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
                className="flex h-11 items-center gap-2.5 rounded-full border border-transparent pr-3 pl-1 text-muted-foreground transition-all hover:border-border/70 hover:bg-card/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-primary/0 transition-all ring-offset-0 group-hover:ring-primary/40">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CircleUserRound className="size-5" aria-hidden />
                  )}
                  {/* live-dot: signed-in state */}
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background"
                  />
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
                className="flex h-11 items-center gap-2.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
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
