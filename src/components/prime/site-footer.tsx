"use client";

import { Bug, Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PreStreamLogo } from "./logo";
import { toBrowse, toHome, toPlaylists, toSchedule } from "./nav";

export const REPORT_EMAIL = "08abdullayevv@gmail.com";

/** Quick destinations shown in the footer columns. */
const FOOTER_LINKS: { label: string; go: (router: ReturnType<typeof useRouter>) => void }[] = [
  { label: "Movies", go: (r) => toBrowse(r, { type: "movie" }) },
  { label: "TV Shows", go: (r) => toBrowse(r, { type: "tv" }) },
  { label: "Schedule", go: (r) => toSchedule(r) },
  { label: "Playlists", go: (r) => toPlaylists(r) },
];

/**
 * Basement-style footer — a giant display-font statement, quick
 * destinations, keyboard hint and the bug-report contact, closing on a
 * quiet legal line. All colors are theme tokens.
 */
export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  const router = useRouter();

  return (
    <footer
      className={cn(
        "relative mt-16 border-t border-border/60 bg-background",
        className,
      )}
      {...{ "data-footer": "" }}
    >
      <div className="shell py-14">
        {/* giant statement */}
        <button
          type="button"
          onClick={() => {
            toHome(router);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="PreStream — back to home"
          className="block max-w-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-display block text-[clamp(2rem,5vw,4.2rem)] leading-[1.02] font-bold tracking-tight text-foreground">
            Movies and series,
            <br />
            arranged around{" "}
            <span className="text-muted-foreground">what you want to watch.</span>
          </span>
        </button>

        {/* links + hints row */}
        <div className="mt-12 flex flex-col items-start justify-between gap-8 border-t border-border/60 pt-8 md:flex-row md:items-center">
          {/* quick destinations */}
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-1">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => link.go(router)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* hints + contact */}
          <div className="flex flex-col items-start gap-2.5 text-xs text-muted-foreground md:items-end">
            <span className="flex items-center gap-1.5">
              <Keyboard className="size-3.5" aria-hidden />
              <kbd className="rounded-md bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground/80">
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
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/60 pt-6">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              toHome(router);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="PreStream — back to home"
            className="rounded-full px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* suppressHydrationWarning covers the year text: SSR/prerendered
                HTML can straddle a year boundary vs the client clock. */}
            © {year} PreStream
          </button>
          <p className="text-[11px] text-muted-foreground/70">
            An independent, open-source front-end — not affiliated with PrimeWire.
          </p>
        </div>
      </div>
    </footer>
  );
}
