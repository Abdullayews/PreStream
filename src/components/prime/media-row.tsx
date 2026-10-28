"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MediaCard } from "./media-card";
import { SectionTitle } from "./section-title";
import { toBrowse } from "./nav";
import type { MediaItem } from "@/lib/primewire/types";

/**
 * Netflix-style horizontal shelf with snap scrolling, edge fades and
 * hover-reveal chevrons (always visible on touch devices).
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
      <div className="mb-4 flex items-end justify-between gap-4">
        <SectionTitle>{title}</SectionTitle>
        {params && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 gap-1 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => toBrowse(router, params)}
            aria-label={`See all ${title}`}
          >
            See all
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth py-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
        >
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="w-[150px] shrink-0 snap-start sm:w-[165px] md:w-[180px]"
            >
              <MediaCard item={item} />
            </div>
          ))}
        </div>

        {/* edge chevrons — glass, always visible on touch, on hover from md up */}
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label={`Scroll ${title} backwards`}
          className="glass absolute -left-2 top-[35%] z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:bg-background md:opacity-0 md:group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label={`Scroll ${title} forwards`}
          className="glass absolute -right-2 top-[35%] z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:bg-background md:opacity-0 md:group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    </section>
  );
}
