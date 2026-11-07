"use client";

import { Bug, Keyboard, Popcorn } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PreStreamLogo } from "./logo";
import { toBrowse, toHome, toPlaylists, toSchedule } from "./nav";

export const REPORT_EMAIL = "08abdullayevv@gmail.com";

/** Quick destinations shown above the legal line. */
const FOOTER_LINKS: { label: string; go: (router: ReturnType<typeof useRouter>) => void }[] = [
  { label: "Movies", go: (r) => toBrowse(r, { type: "movie" }) },
  { label: "TV Shows", go: (r) => toBrowse(r, { type: "tv" }) },
  { label: "Schedule", go: (r) => toSchedule(r) },
  { label: "Playlists", go: (r) => toPlaylists(r) },
];

/**
 * Aurora footer — a quiet closing band for the stage: brand + a one-line
 * mission, quick destinations, keyboard hint and the bug-report contact,
 * all on a single breathing row that stacks gracefully on mobile.
 */
export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  const router = useRouter();

  return (
    <footer
      className={cn(
        "relative border-t border-border/50 bg-gradient-to-b from-transparent to-background/60",
        className,
      )}
      {...{ "data-footer": "" }}
    >
      {/* faint accent hairline on top of the band */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* brand + mission */}
          <div className="max-w-sm">
            <button
              type="button"
              onClick={() => {
                toHome(router);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="PreStream — back to home"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PreStreamLogo />
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Popcorn className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden />
              A cinematic front-end for the PrimeWire catalog — search,
              watch, track and collect, all in one quiet room.
            </p>
          </div>

          {/* quick destinations */}
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => link.go(router)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* hints + contact */}
          <div className="flex flex-col items-start gap-2.5 text-xs text-muted-foreground md:items-end">
            <span className="flex items-center gap-1.5">
              <Keyboard className="size-3.5 text-primary/80" aria-hidden />
              <kbd className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground/80">
                Ctrl K
              </kbd>
              to search anything
            </span>
            <a
              href={`mailto:${REPORT_EMAIL}`}
              className="flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Bug className="size-3.5" aria-hidden />
              Report bugs and problems to{" "}
              <span className="font-medium underline decoration-muted-foreground/40 underline-offset-2">
                {REPORT_EMAIL}
              </span>
            </a>
          </div>
        </div>

        {/* legal line */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/40 pt-5">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              toHome(router);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="PreStream — back to home"
            className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* suppressHydrationWarning covers the year text: SSR/prerendered
                HTML can straddle a year boundary vs the client clock. */}
            © {year} PreStream
          </button>
          <p className="text-[11px] text-muted-foreground/60">
            An independent, open-source front-end — not affiliated with PrimeWire.
          </p>
        </div>
      </div>
    </footer>
  );
}
