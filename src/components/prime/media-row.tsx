"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { MediaCard } from "./media-card";
import { toBrowse } from "./nav";
import type { MediaItem } from "@/lib/primewire/types";

/**
 * Horizontal media shelf — Basement cut: a display-font section header on
 * the left with a quiet "See all" pill on the right, snap scrolling with
 * soft edge fades, and small round muted chevrons (revealed on hover from
 * md up; always visible on touch devices).
 */
export function MediaRow({
  title,
  items,
  params,
}: {
  title: string;
  items: MediaItem[];
  /** Browse params that reproduce this row in the Browse view */
  params?: Record<string, string>;
}) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="group/row relative" aria-label={title}>
      <div className="mb-3.5 flex items-center justify-between gap-4">
        <h2 className="font-display truncate text-[22px] leading-tight font-bold text-foreground">
          {title}
        </h2>
        {params && (
          <button
            type="button"
            onClick={() => toBrowse(router, params)}
            aria-label={`See all ${title}`}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.09] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            See all
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar shelf-fade flex snap-x gap-4 overflow-x-auto scroll-smooth py-1"
        >
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="w-[150px] shrink-0 snap-start sm:w-[160px] md:w-[168px]"
            >
              <MediaCard item={item} />
            </div>
          ))}
        </div>

        {/* edge chevrons — small round muted buttons */}
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label={`Scroll ${title} backwards`}
          className="absolute -left-1.5 top-[38%] z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-foreground md:group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label={`Scroll ${title} forwards`}
          className="absolute -right-1.5 top-[38%] z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-foreground md:group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
