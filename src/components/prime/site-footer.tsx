"use client";

import { Bug } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toHome } from "./nav";

export const REPORT_EMAIL = "08abdullayevv@gmail.com";

/** Minimal site footer — a single quiet line, sticky to the bottom.
 *  Clicking "PreStream" returns to the home view. */
export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  const router = useRouter();

  return (
    <footer
      className={cn("border-t border-border/40 bg-background", className)}
      {...{ "data-footer": "" }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-5 sm:px-6">
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => {
            toHome(router);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="PreStream — back to home"
          className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* suppressHydrationWarning covers the year text: SSR/prerendered
              HTML can straddle a year boundary vs the client clock. */}
          © {year} PreStream
        </button>

        <span aria-hidden className="hidden text-xs text-muted-foreground/40 sm:inline">
          ·
        </span>

        <a
          href={`mailto:${REPORT_EMAIL}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bug className="size-3.5" aria-hidden />
          Report bugs and problems to{" "}
          <span className="font-medium underline decoration-muted-foreground/40 underline-offset-2">
            {REPORT_EMAIL}
          </span>
        </a>
      </div>
    </footer>
  );
}
