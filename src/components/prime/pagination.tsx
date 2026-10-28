"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared pagination control (browse + playlists). PrimeWire exposes a
 * sliding window of page numbers; the current page is merged in when the
 * window doesn't include it. 44px touch targets, themed active pill.
 */
export function Pagination({
  page,
  pages,
  hasNext,
  onPage,
}: {
  page: number;
  pages: number[];
  hasNext: boolean;
  onPage: (page: number) => void;
}) {
  const list = useMemo(() => {
    const unique = [...new Set(pages)];
    if (page > 0 && !unique.includes(page)) unique.push(page);
    return unique.sort((a, b) => a - b);
  }, [pages, page]);

  if (list.length <= 1 && !hasNext) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 pt-10 pb-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      {list.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => p !== page && onPage(p)}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={cn(
            "flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors",
            p === page
              ? "bg-primary text-primary-foreground shadow-lg shadow-black/20"
              : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      <span className="ml-3 text-xs text-muted-foreground">
        Page {page}
      </span>
    </nav>
  );
}
