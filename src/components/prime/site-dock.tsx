"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CalendarDays,
  CircleUserRound,
  Clapperboard,
  House,
  ListVideo,
  Tv,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { avatarUrl } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { toAccount, toBrowse, toHome, toPlaylists, toSchedule } from "./nav";
import { useUser, useUserHydrated } from "./stores/user";
import { useWatchlist, useWatchlistHydrated } from "./stores/watchlist";

const DOCK_ITEMS = [
  { key: "home", label: "Home", icon: House },
  { key: "movie", label: "Movies", icon: Clapperboard },
  { key: "tv", label: "TV", icon: Tv },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "playlists", label: "Playlists", icon: ListVideo },
] as const;

/* ------------------------------------------------------------------ */
/* Calculated dock clearance                                            */
/* ------------------------------------------------------------------ */

/**
 * Measures the dock's real on-screen footprint (pill height + bottom
 * offset incl. mobile safe-area) and publishes it as --dock-clearance on
 * <html>. The page then reserves exactly that much space (+ a fixed gap)
 * at its bottom, so content can never end up under — or 1px from — the
 * floating dock, regardless of viewport, zoom, safe-area or future dock
 * size changes. Measured live (ResizeObserver + resize/orientation/
 * visualViewport listeners) instead of hardcoded, so it is self-maintaining.
 *
 * CSS fallback (globals.css) mirrors the dock geometry for first paint;
 * this effect refines it to the exact measured value.
 */
function useDockClearance(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      // The wrapper's layout box is stable: the pill's framer-motion intro
      // and hover translates are transforms on inner elements, which never
      // affect this box — so any measurement moment is safe.
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty(
          "--dock-clearance",
          `${Math.ceil(h)}px`,
        );
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    window.visualViewport?.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, [ref]);
}

/**
 * Floating glass dock — the primary navigation, Shiopa-style.
 * Fixed to the bottom of the viewport, centered, with a spring-loaded
 * active pill and tooltips on hover. Active states use theme tokens so
 * the selected theme colors the dock.
 *
 * Width audit (390px viewport): 8 targets × 44px + gap-0.5 + hairline
 * separator + p-1.5 → ~383px, fitting with a small margin.
 */
export function SiteDock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "home";
  const type = searchParams.get("type");

  const watchCount = useWatchlist((s) => s.items.length);
  const watchHydrated = useWatchlistHydrated();

  const userHydrated = useUserHydrated();
  const username = useUser((s) => s.username);
  const avatar = useUser((s) => s.avatar);
  const signedIn = userHydrated && !!username;
  const avatarSrc = avatarUrl(avatar);

  const [hovered, setHovered] = useState<string | null>(null);
  const dockWrapRef = useRef<HTMLDivElement>(null);
  useDockClearance(dockWrapRef);

  const activeKey =
    view === "home"
      ? "home"
      : view === "browse" && (type === "movie" || type === "tv")
        ? type
        : view === "schedule"
          ? "schedule"
          : view === "playlists" || view === "playlist"
            ? "playlists"
            : view === "account"
              ? "account"
              : null;

  const go = (key: string) => {
    if (key === "home") toHome(router);
    else if (key === "schedule") toSchedule(router);
    else if (key === "playlists") toPlaylists(router);
    else if (key === "account") toAccount(router);
    else toBrowse(router, { type: key });
  };

  return (
    <div
      ref={dockWrapRef}
      data-dock-lane=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="navigation"
      aria-label="Primary dock"
    >
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.15 }}
        className="glass pointer-events-auto flex items-end gap-0.5 rounded-[1.5rem] p-1.5"
        onMouseLeave={() => setHovered(null)}
      >
        {DOCK_ITEMS.map((item) => {
          const active = activeKey === item.key;
          const Icon = item.icon;
          return (
            <DockButton
              key={item.key}
              label={item.label}
              active={active}
              hovered={hovered === item.key}
              onHover={() => setHovered(item.key)}
              onClick={() => go(item.key)}
            >
              <Icon className="size-5" aria-hidden />
            </DockButton>
          );
        })}

        <DockSeparator />

        {/* watchlist */}
        <DockButton
          label={`Watchlist${watchHydrated && watchCount > 0 ? ` (${watchCount})` : ""}`}
          active={false}
          hovered={hovered === "watchlist"}
          onHover={() => setHovered("watchlist")}
          onClick={() => {
            // The drawer is opened via the header button; the dock entry
            // dispatches a custom event the header listens for.
            window.dispatchEvent(new CustomEvent("primestream:open-watchlist"));
          }}
          badge={watchHydrated && watchCount > 0 ? watchCount : null}
        >
          <Bookmark className="size-5" aria-hidden />
        </DockButton>

        {/* account */}
        <DockButton
          label={signedIn ? `Account — ${username}` : "Account"}
          active={activeKey === "account"}
          hovered={hovered === "account"}
          onHover={() => setHovered("account")}
          onClick={() => go("account")}
        >
          {signedIn && avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="size-[26px] rounded-full object-cover ring-1 ring-glass-foreground/30"
            />
          ) : (
            <CircleUserRound className="size-5" aria-hidden />
          )}
        </DockButton>
      </motion.nav>
    </div>
  );
}

function DockButton({
  label,
  active,
  hovered,
  onHover,
  onClick,
  badge,
  children,
}: {
  label: string;
  active: boolean;
  hovered: boolean;
  onHover: () => void;
  onClick: () => void;
  badge?: number | null;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/* tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.14 }}
            className="glass pointer-events-none absolute -top-11 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onHover}
        onFocus={onHover}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-2xl transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hovered && "-translate-y-1.5 scale-110",
          active
            ? "bg-primary text-primary-foreground"
            : "text-glass-foreground/70 hover:text-glass-foreground",
        )}
      >
        {children}
        {badge != null && (
          <span
            aria-hidden
            className={cn(
              "absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
              "bg-primary text-primary-foreground",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      {/* active dot */}
      <span
        aria-hidden
        className={cn(
          "-mt-0.5 h-1 w-1 rounded-full bg-glass-foreground transition-all duration-300",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function DockSeparator() {
  return (
    <span
      aria-hidden
      className="mx-0.5 h-8 w-px self-center bg-glass-foreground/15"
    />
  );
}
