"use client";

import { useMemo } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Download,
  Film,
  Heart,
  LibraryBig,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LibraryItem,
  LibraryItemState,
  LibraryResponse,
  WatchStatus,
} from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import {
  exportLibraryHref,
  useAccountLibrary,
  useAccountMutation,
} from "../hooks/use-account";
import { imgUrl } from "../hooks/use-primewire";
import { accountHref, toBrowse, toDetail } from "../nav";
import { Pagination } from "../pagination";
import { SectionTitle } from "../section-title";
import { useUser } from "../stores/user";
import { TabEmpty, TabError, TabLoading } from "./account-states";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "watched", label: "Watched" },
  { value: "in-progress", label: "Watching" },
  { value: "plan-to-watch", label: "Plan to Watch" },
  { value: "on-hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
] as const;

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
] as const;

const SORT_OPTIONS = [
  { value: "recent", label: "Recently updated" },
  { value: "release", label: "Release date" },
  { value: "rating", label: "PrimeWire rating" },
  { value: "views", label: "Most viewed" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

const CARD_STATUS_OPTIONS = [
  { value: "in-progress", label: "Watching" },
  { value: "plan-to-watch", label: "Plan to Watch" },
  { value: "watched", label: "Watched" },
  { value: "on-hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
] as const;

const NONE = "__none";
const REMOVE = "__remove";

interface UrlParams {
  status: string;
  favorite: string;
  type: string;
  sort: string;
  direction: string;
  page: number;
}

/**
 * The user's PrimeWire library — filterable tracker grid with overlay
 * status/favorite controls (optimistic), pagination and CSV export.
 */
export function LibraryTab() {
  const router = useRouter();
  const sp = useSearchParams();
  const apiKey = useUser((s) => s.apiKey);

  const params: UrlParams = {
    status: STATUS_OPTIONS.some((o) => o.value === sp.get("status"))
      ? (sp.get("status") ?? "")
      : "",
    favorite: sp.get("favorite") === "on" ? "on" : "",
    type: sp.get("type") === "movie" || sp.get("type") === "tv" ? sp.get("type")! : "",
    sort: SORT_OPTIONS.some((o) => o.value === sp.get("sort")) ? (sp.get("sort") ?? "recent") : "recent",
    direction: sp.get("direction") === "asc" ? "asc" : "desc",
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
  };

  const apiParams = useMemo(
    () => ({
      status: params.status,
      favorite: params.favorite,
      type: params.type,
      sort: params.sort,
      direction: params.direction,
      page: params.page > 1 ? String(params.page) : "",
    }),
    [params.status, params.favorite, params.type, params.sort, params.direction, params.page],
  );

  const { data, isLoading, isError, error, refetch } = useAccountLibrary(apiParams);

  const setParams = (
    patch: Partial<Record<keyof UrlParams, string | number | null>>,
  ) => {
    const next: Record<string, string | number | null> = {
      status: params.status || null,
      favorite: params.favorite || null,
      type: params.type || null,
      sort: params.sort !== "recent" ? params.sort : null,
      direction: params.direction !== "desc" ? params.direction : null,
      ...patch,
    };
    const page = typeof patch.page === "number" && patch.page > 0 ? patch.page : 1;
    router.replace(accountHref("library", { ...next, page }));
  };

  const goToPage = (page: number) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setParams({ page });
  };

  const favoriteOn = params.favorite === "on";

  return (
    <div>
      {/* header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle as="h2" className="text-xl">
          My Library
        </SectionTitle>
        {apiKey && (
          <Button variant="outline" className="rounded-full" asChild>
            <a
              href={exportLibraryHref(apiKey)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Export your library as CSV (downloads a file)"
            >
              <Download className="size-4" aria-hidden />
              Export CSV
            </a>
          </Button>
        )}
      </div>

      {/* filter row */}
      <div className="no-scrollbar -mx-1 mt-4 flex items-center gap-2 overflow-x-auto px-1">
        <Select
          value={params.status || "all"}
          onValueChange={(v) => setParams({ status: v === "all" ? null : v, page: 1 })}
        >
          <SelectTrigger className="h-10 w-[150px] shrink-0 rounded-full" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setParams({ favorite: favoriteOn ? null : "on", page: 1 })}
          aria-pressed={favoriteOn}
          aria-label="Show favorites only"
          className={cn(
            "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            favoriteOn
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Heart className={cn("size-4", favoriteOn && "fill-current")} aria-hidden />
          Favorites
        </button>

        <Select
          value={params.type || "all"}
          onValueChange={(v) => setParams({ type: v === "all" ? null : v, page: 1 })}
        >
          <SelectTrigger className="h-10 w-[128px] shrink-0 rounded-full" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.sort}
          onValueChange={(v) => setParams({ sort: v, page: 1 })}
        >
          <SelectTrigger className="h-10 w-[176px] shrink-0 rounded-full" aria-label="Sort library">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={() => setParams({ direction: params.direction === "asc" ? "desc" : "asc" })}
          aria-label={`Sort direction: ${params.direction === "asc" ? "ascending" : "descending"} — tap to switch`}
          title="Toggle sort direction"
        >
          {params.direction === "asc" ? (
            <ArrowUpWideNarrow className="size-4" aria-hidden />
          ) : (
            <ArrowDownWideNarrow className="size-4" aria-hidden />
          )}
        </Button>
      </div>

      {/* body */}
      <div className="mt-5">
        {isLoading ? (
          <TabLoading variant="grid" rows={12} />
        ) : isError ? (
          <TabError
            icon={LibraryBig}
            message={
              error instanceof Error ? error.message : "PrimeWire could not be reached."
            }
            onRetry={() => refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <TabEmpty
            icon={LibraryBig}
            title="Your library is empty"
            description="Open any movie or TV show and pick a watch status — it lands here, synced with your PrimeWire account."
            action={{ label: "Browse the catalog", onClick: () => toBrowse(router, {}) }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.items.map((item) => (
                <LibraryCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
            <Pagination
              page={data.page ?? params.page}
              pages={data.pages ?? []}
              hasNext={data.hasNext ?? false}
              onPage={goToPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card with overlay tracker controls                                  */
/* ------------------------------------------------------------------ */

type LibraryPatch = Partial<Pick<LibraryItem, "status" | "favorite">> & {
  remove?: boolean;
};

/** Optimistically patch an item inside every cached library query. */
function patchCachedLibrary(
  qc: ReturnType<typeof useQueryClient>,
  showId: number,
  patch: LibraryPatch,
) {
  qc.setQueriesData<LibraryResponse>({ queryKey: ["account", "library"] }, (old) => {
    if (!old) return old;
    if (patch.remove) {
      return { ...old, items: old.items.filter((i) => i.id !== showId) };
    }
    return {
      ...old,
      items: old.items.map((i) => (i.id === showId ? { ...i, ...patch } : i)),
    };
  });
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const router = useRouter();
  const qc = useQueryClient();
  const poster = imgUrl(item.poster, "w500");

  const mutate = useAccountMutation<LibraryItemState>("library-item", {
    invalidates: [["account", "library"]],
  });

  const apply = (
    vars: Record<string, unknown>,
    optimistic: LibraryPatch,
    rollback: LibraryPatch,
    successMessage?: string,
  ) => {
    patchCachedLibrary(qc, item.id, optimistic);
    mutate.mutate(
      { showId: item.id, ...vars },
      {
        onError: (err) => {
          patchCachedLibrary(qc, item.id, rollback);
          toast.error("Couldn't update the tracker", { description: err.message });
        },
        onSuccess: () => {
          if (successMessage) toast.success(successMessage, { description: item.title });
        },
      },
    );
  };

  const setStatus = (value: string) => {
    if (value === REMOVE) {
      apply({ library: false }, { remove: true }, {}, "Removed from library");
      return;
    }
    const status = (value === NONE ? null : value) as WatchStatus | null;
    const prev = item.status;
    apply(
      { status: value === NONE ? "" : value },
      { status },
      { status: prev },
      "Status updated",
    );
  };

  const toggleFavorite = () => {
    const next = !item.favorite;
    apply({ favorite: next }, { favorite: next }, { favorite: item.favorite });
  };

  const open = () => toDetail(router, item);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="group relative w-full cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300 group-hover:ring-foreground/30 group-hover:shadow-lg group-hover:shadow-black/20 dark:ring-white/5 dark:group-hover:ring-white/25">
        {poster ? (
          <img
            src={poster}
            alt={`${item.title} poster`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted p-3 text-center">
            <Film className="size-8 text-muted-foreground/50" aria-hidden />
            <span className="line-clamp-3 text-xs text-muted-foreground">{item.title}</span>
          </div>
        )}

        {/* gradient legibility strip */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
        />

        {/* favorite heart — same spot as the MediaCard bookmark (44px) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          aria-pressed={item.favorite}
          aria-label={
            item.favorite ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`
          }
          className={cn(
            "absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            item.favorite
              ? "bg-primary text-primary-foreground opacity-100"
              : "glass text-glass-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <Heart
            className={cn("size-4", item.favorite && "fill-current")}
            aria-hidden
          />
        </button>

        {/* status pill on the poster legibility strip */}
        <div
          className="absolute inset-x-2 bottom-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Select value={item.status ?? NONE} onValueChange={setStatus}>
            <SelectTrigger
              className="glass h-10 w-full rounded-full border-0 px-3 text-[11px] font-medium text-glass-foreground shadow-none focus-visible:ring-ring"
              aria-label={`Watch status for ${item.title}`}
            >
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>In library · no status</SelectItem>
              {CARD_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value={REMOVE} className="text-destructive focus:text-destructive">
                Remove from library
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* title + meta */}
      <div className="px-0.5 pt-2.5">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {item.year != null && <span>{item.year}</span>}
          {item.year != null && (
            <span aria-hidden className="text-muted-foreground/40">•</span>
          )}
          <span className="uppercase tracking-wide">{item.type === "movie" ? "Movie" : "TV"}</span>
          {item.status && (
            <span className="ml-auto shrink-0 truncate rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium">
              {CARD_STATUS_OPTIONS.find((o) => o.value === item.status)?.label ?? item.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
