"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Film, Search, Tv, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { imgUrl, useBrowse } from "./hooks/use-primewire";
import { browseHref, toDetail } from "./nav";
import type { MediaItem } from "@/lib/primewire/types";

/**
 * Spotlight search — a macOS-style command palette for the catalog.
 * Opened from the header's search icon, the dock's Search item, or with
 * ⌘K / Ctrl+K anywhere. Live results (with posters) update as you type;
 * ↑/↓ navigate, ↵ opens the highlighted title, Esc closes.
 */

/** Custom event other components dispatch to open the spotlight. */
export const OPEN_SEARCH_EVENT = "primestream:open-search";

export function openSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}

export function SearchSpotlight() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmed = debounced.trim();

  /* open requests from elsewhere in the app (dock, browse bar) */
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setActive(0);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
  }, []);

  /* ⌘K / Ctrl+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
        setActive(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* debounce the query */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(term);
      setActive(0);
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

  const { data, isFetching } = useBrowse(
    { q: trimmed, page: "1" },
    { enabled: trimmed.length >= 2 },
  );
  const results: MediaItem[] = useMemo(
    () => (data?.items ?? []).slice(0, 6),
    [data],
  );

  /* focus the input whenever the palette opens */
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  /* lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setTerm("");
    setDebounced("");
    setActive(0);
  };

  const seeAll = () => {
    if (!trimmed) return;
    router.push(browseHref({ q: trimmed }));
    close();
  };

  const openItem = (item: MediaItem) => {
    toDetail(router, { type: item.type, id: String(item.id), slug: item.slug });
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) openItem(results[active]);
      else seeAll();
    }
  };

  /* keep the highlighted row in view */
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-spotlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Search the catalog"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search movies & TV shows…"
                aria-label="Search movies and TV shows"
                className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>

            {/* results */}
            <div ref={listRef} className="thin-scrollbar max-h-[52vh] overflow-y-auto p-2">
              {trimmed.length < 2 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search the PrimeWire catalog.
                </p>
              ) : isFetching && results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Searching…
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No titles match “{trimmed}”.
                </p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    data-idx={i}
                    onClick={() => openItem(item)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none",
                      i === active ? "bg-foreground/10" : "hover:bg-foreground/5",
                    )}
                  >
                    <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
                      {item.poster ? (
                        <img
                          src={imgUrl(item.poster, "w200") ?? undefined}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : item.type === "tv" ? (
                        <Tv className="size-4 text-muted-foreground/60" aria-hidden />
                      ) : (
                        <Film className="size-4 text-muted-foreground/60" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide">
                          {item.type === "tv" ? "TV" : "Movie"}
                        </span>
                        {item.year != null && <span>{item.year}</span>}
                        {item.rating != null && (
                          <span className="text-foreground/70">★ {item.rating.toFixed(1)}</span>
                        )}
                      </span>
                    </span>
                    {i === active && (
                      <CornerDownLeft
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </button>
                ))
              )}

              {trimmed.length >= 2 && (
                <button
                  type="button"
                  onClick={seeAll}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none"
                >
                  <Search className="size-3.5" aria-hidden />
                  See all results for “{trimmed}”
                </button>
              )}
            </div>

            {/* footer hints */}
            <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Key>↑↓</Key> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Key>↵</Key> open
              </span>
              <span className="flex items-center gap-1.5">
                <Key>esc</Key> close
              </span>
              <span className="ml-auto hidden sm:block">Search by PrimeWire</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground/80">
      {children}
    </kbd>
  );
}
