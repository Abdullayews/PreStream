"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  Film,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PW_GENRES, PW_SORTS } from "@/lib/primewire/types";
import { useAutocomplete, useBrowse } from "./hooks/use-primewire";
import { browseHref } from "./nav";
import { openSearch } from "./search-spotlight";
import { MediaCard } from "./media-card";
import { Pagination } from "./pagination";
import { BrowseSkeleton } from "./skeletons";

const YEARS: number[] = Array.from(
  { length: 2026 - 1950 + 1 },
  (_, i) => 2026 - i,
);

const RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "2", label: "2+ ★" },
  { value: "2.5", label: "2.5+ ★" },
  { value: "3", label: "3+ ★" },
  { value: "3.5", label: "3.5+ ★" },
  { value: "4", label: "4+ ★" },
  { value: "4.5", label: "4.5+ ★" },
];

const QUALITY_OPTIONS = ["HD", "DVD", "TS", "CAM"] as const;

interface UrlParams {
  q: string;
  type: string;
  genre: string;
  sort: string;
  direction: string;
  yearFrom: string;
  yearTo: string;
  rating: string;
  cast: string;
  country: string;
  quality: string;
  page: number;
}

/** The catalog page: filters, active-filter chips, results grid, pagination. */
export function BrowseView() {
  const router = useRouter();
  const sp = useSearchParams();

  const params: UrlParams = {
    q: sp.get("q") ?? "",
    type: sp.get("type") === "movie" || sp.get("type") === "tv" ? sp.get("type")! : "",
    genre: sp.get("genre") ?? "",
    sort: sp.get("sort") ?? "",
    direction:
      sp.get("direction") === "asc" || sp.get("direction") === "desc"
        ? sp.get("direction")!
        : "",
    yearFrom: /^\d{4}$/.test(sp.get("yearFrom") ?? "") ? sp.get("yearFrom")! : "",
    yearTo: /^\d{4}$/.test(sp.get("yearTo") ?? "") ? sp.get("yearTo")! : "",
    rating: /^\d(\.\d)?$/.test(sp.get("rating") ?? "") ? sp.get("rating")! : "",
    cast: sp.get("cast") ?? "",
    country: sp.get("country") ?? "",
    quality: (sp.get("quality") ?? "") as (typeof QUALITY_OPTIONS)[number] | "",
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
  };

  const genres = useMemo(
    () => params.genre.split(",").map((g) => g.trim()).filter(Boolean),
    [params.genre],
  );

  // params for the API (empty values stripped; page sent only when > 1)
  const apiParams = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === "page") continue;
      const v = String(value).trim();
      if (v) out[key] = v;
    }
    if (params.page > 1) out.page = String(params.page);
    return out;
  }, [params]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useBrowse(apiParams);

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load data — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  /**
   * Merge a patch into the current URL params and navigate.
   * `replace: true` avoids history spam for filter tweaks;
   * page resets to 1 unless the patch itself sets a page.
   */
  const setParams = (
    patch: Partial<Record<keyof UrlParams, string | number | null>>,
    opts?: { replace?: boolean },
  ) => {
    const next: Record<string, string> = {};
    for (const [key, raw] of Object.entries({ ...params, ...patch })) {
      if (key === "page") continue;
      const value = raw === null || raw === undefined ? "" : String(raw).trim();
      if (value) next[key] = value;
    }
    const page =
      typeof patch.page === "number" && patch.page > 0 ? patch.page : 1;
    if (page > 1) next.page = String(page);

    const href = browseHref(next);
    if (opts?.replace) router.replace(href);
    else router.push(href);
  };

  const goToPage = (page: number) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setParams({ page });
  };

  const resetAll = () => router.replace(browseHref());

  /* ---------------- genre picker ---------------- */
  // local draft state; re-initialized from the URL whenever the popover opens
  const [genreOpen, setGenreOpen] = useState(false);
  const [pickedGenres, setPickedGenres] = useState<Set<string>>(
    () => new Set(genres),
  );

  /* ---------------- active filter chips ---------------- */
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (params.q)
    chips.push({
      key: "q",
      label: `“${params.q}”`,
      clear: () => setParams({ q: null }, { replace: true }),
    });
  for (const genre of genres)
    chips.push({
      key: `genre-${genre}`,
      label: genre,
      clear: () =>
        setParams(
          {
            genre:
              genres.filter((g) => g !== genre).join(",") || null,
          },
          { replace: true },
        ),
    });
  if (params.type)
    chips.push({
      key: "type",
      label: params.type === "movie" ? "Movies" : "TV Shows",
      clear: () => setParams({ type: null }, { replace: true }),
    });
  if (params.sort && params.sort !== "Featured")
    chips.push({
      key: "sort",
      label: PW_SORTS.find((s) => s.value === params.sort)?.label ?? params.sort,
      clear: () => setParams({ sort: null }, { replace: true }),
    });
  if (params.yearFrom)
    chips.push({
      key: "yearFrom",
      label: `From ${params.yearFrom}`,
      clear: () => setParams({ yearFrom: null }, { replace: true }),
    });
  if (params.yearTo)
    chips.push({
      key: "yearTo",
      label: `To ${params.yearTo}`,
      clear: () => setParams({ yearTo: null }, { replace: true }),
    });
  if (params.rating && params.rating !== "0")
    chips.push({
      key: "rating",
      label: `${params.rating}+ ★`,
      clear: () => setParams({ rating: null }, { replace: true }),
    });
  if (params.cast)
    chips.push({
      key: "cast",
      label: `Cast: ${params.cast}`,
      clear: () => setParams({ cast: null }, { replace: true }),
    });
  if (params.country)
    chips.push({
      key: "country",
      label: `Country: ${params.country}`,
      clear: () => setParams({ country: null }, { replace: true }),
    });
  if (params.quality)
    chips.push({
      key: "quality",
      label: params.quality,
      clear: () => setParams({ quality: null }, { replace: true }),
    });

  const showSkeleton = isLoading && !data;
  const items = data?.items ?? [];
  const showEmpty = !isLoading && !isError && data && items.length === 0;

  return (
    <div>
      {/* ---------------- filter bar (slim, glass-matched with the header) ---------------- */}
      <div className="glass sticky top-16 z-40 rounded-none border-x-0 border-t-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-2.5">
            {/* search pill — opens the spotlight palette */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search the catalog"
              className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-foreground/[0.04] pr-3 pl-3 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-3.5" aria-hidden />
              {params.q ? (
                <span className="max-w-32 truncate text-foreground">“{params.q}”</span>
              ) : (
                <span>Search</span>
              )}
            </button>

            <span
              aria-hidden
              className="h-5 w-px shrink-0 bg-glass-foreground/15"
            />
            <Tabs
              value={params.type || "all"}
              onValueChange={(v) =>
                setParams({ type: v === "all" ? null : v }, { replace: true })
              }
            >
              <TabsList className="h-9 shrink-0 rounded-full p-0.5">
                <TabsTrigger className="h-8 rounded-full px-4" value="all">
                  All
                </TabsTrigger>
                <TabsTrigger className="h-8 rounded-full px-4" value="movie">
                  Movies
                </TabsTrigger>
                <TabsTrigger className="h-8 rounded-full px-4" value="tv">
                  TV Shows
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              value={params.sort || "Featured"}
              onValueChange={(v) =>
                setParams(
                  { sort: v === "Featured" ? null : v },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                className="h-9 w-[150px] shrink-0 rounded-full"
                aria-label="Sort results"
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {PW_SORTS.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover
              open={genreOpen}
              onOpenChange={(open) => {
                setGenreOpen(open);
                if (open) setPickedGenres(new Set(genres));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 shrink-0 rounded-full"
                  aria-label="Filter by genre"
                >
                  {genres.length > 0
                    ? `Genre • ${genres.length}`
                    : "Genre"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 sm:w-[420px]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Genres
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pickedGenres.size}/4 selected
                  </p>
                </div>
                <div className="thin-scrollbar grid max-h-80 grid-cols-2 gap-0.5 overflow-y-auto pr-1 sm:grid-cols-3">
                  {PW_GENRES.map((genre) => {
                    const picked = pickedGenres.has(genre);
                    // cap of 4 genres (matches the API contract)
                    const blocked = !picked && pickedGenres.size >= 4;
                    return (
                      <label
                        key={genre}
                        htmlFor={`genre-${genre}`}
                        className={cn(
                          "flex min-h-11 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                          blocked
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer hover:bg-muted/70",
                        )}
                      >
                        <Checkbox
                          id={`genre-${genre}`}
                          checked={picked}
                          disabled={blocked}
                          onCheckedChange={(checked) =>
                            setPickedGenres((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(genre);
                              else next.delete(genre);
                              return next;
                            })
                          }
                        />
                        <span className="truncate">{genre}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground"
                    onClick={() => setPickedGenres(new Set())}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 rounded-full"
                    onClick={() => {
                      setParams(
                        {
                          genre:
                            pickedGenres.size > 0
                              ? [...pickedGenres].join(",")
                              : null,
                        },
                        { replace: true },
                      );
                      setGenreOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={params.yearFrom || "any"}
              onValueChange={(v) =>
                setParams(
                  { yearFrom: v === "any" ? null : v },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                className="h-9 w-[84px] shrink-0 rounded-full"
                aria-label="Release year from"
              >
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="any">From</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.yearTo || "any"}
              onValueChange={(v) =>
                setParams({ yearTo: v === "any" ? null : v }, { replace: true })
              }
            >
              <SelectTrigger
                className="h-9 w-[84px] shrink-0 rounded-full"
                aria-label="Release year to"
              >
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="any">To</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.rating || "0"}
              onValueChange={(v) =>
                setParams(
                  { rating: v === "0" ? null : v },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                className="h-9 w-[108px] shrink-0 rounded-full"
                aria-label="Minimum rating"
              >
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.quality || "any"}
              onValueChange={(v) =>
                setParams(
                  { quality: v === "any" ? null : v },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                className="h-9 w-[104px] shrink-0 rounded-full"
                aria-label="Stream quality"
              >
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any quality</SelectItem>
                {QUALITY_OPTIONS.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* sort direction — only meaningful once a sort is chosen */}
            {params.sort && params.sort !== "Featured" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Sort direction"
                title={
                  params.direction
                    ? `Sort direction: ${params.direction === "asc" ? "ascending" : "descending"}`
                    : "Sort direction: default"
                }
                className="size-9 shrink-0 rounded-full"
                onClick={() =>
                  setParams(
                    {
                      direction:
                        params.direction === ""
                          ? "asc"
                          : params.direction === "asc"
                            ? "desc"
                            : null,
                    },
                    { replace: true },
                  )
                }
              >
                {params.direction === "asc" ? (
                  <ArrowUpWideNarrow className="size-4" aria-hidden />
                ) : params.direction === "desc" ? (
                  <ArrowDownWideNarrow className="size-4" aria-hidden />
                ) : (
                  <ArrowUpDown className="size-4" aria-hidden />
                )}
              </Button>
            )}

            <AutocompleteFilter
              kind="countries"
              label="Country"
              placeholder="Search countries…"
              value={params.country}
              onSelect={(country) =>
                setParams({ country }, { replace: true })
              }
            />

            <AutocompleteFilter
              kind="people"
              label="Cast"
              placeholder="Search actors…"
              value={params.cast}
              onSelect={(cast) => setParams({ cast }, { replace: true })}
            />

            {/* reset — only while filters are active */}
            {chips.length > 0 && (
              <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Reset all filters"
                  title="Reset all filters"
                className="size-9 shrink-0 rounded-full"
                onClick={resetAll}
              >
                <RotateCcw className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* active filters */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-6">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                aria-label={`Remove filter: ${chip.label}`}
                className="group flex h-10 items-center gap-1.5 rounded-full border border-border bg-muted/60 pl-3.5 pr-2 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {chip.label}
                <span className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-foreground/10 group-hover:text-foreground">
                  <X className="size-3" aria-hidden />
                </span>
              </button>
            ))}
            {chips.length > 1 && (
              <button
                type="button"
                onClick={resetAll}
                className="h-10 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* subtle loading bar while swapping pages */}
        {isFetching && data && (
          <div className="pt-4" aria-hidden>
            <Progress value={100} className="h-1 animate-pulse rounded-full" />
          </div>
        )}

        {/* ---------------- results ---------------- */}
        <div className="py-8">
          {isError && !data ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <Film className="size-7 text-destructive" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Couldn&apos;t load results
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "PrimeWire could not be reached."}
                </p>
              </div>
              <Button
                className="rounded-full"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          ) : showSkeleton ? (
            <BrowseSkeleton />
          ) : showEmpty ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
                <Film className="size-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  No titles match your filters
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try removing a filter or searching for something else.
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={resetAll}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((item) => (
                  <MediaCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>

              <Pagination
                page={data?.page ?? params.page}
                pages={data?.pages ?? []}
                hasNext={data?.hasNext ?? false}
                onPage={goToPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- autocomplete filter (country / cast) ---------------- */

function AutocompleteFilter({
  kind,
  label,
  placeholder,
  value,
  onSelect,
}: {
  kind: "countries" | "people";
  label: string;
  placeholder: string;
  value: string;
  onSelect: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  // debounce the suggestion query ~300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  const { data: results, isFetching } = useAutocomplete(kind, debounced);

  const choose = (next: string) => {
    onSelect(next === value ? null : next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTerm(value);
          setDebounced(value);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 shrink-0 rounded-full"
          aria-label={`Filter by ${label.toLowerCase()}`}
        >
          {value ? (
            <>
              <span className="max-w-[120px] truncate font-normal">{label}: </span>
              <span className="max-w-[110px] truncate font-medium">{value}</span>
            </>
          ) : (
            label
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder={placeholder}
          />
          <CommandList>
            {term.trim().length < 2 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Keep typing — at least 2 characters.
              </p>
            ) : (
              <>
                {results?.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.text}
                    onSelect={() => choose(result.text)}
                    className="gap-2"
                  >
                    {result.text}
                    {result.text === value && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        current
                      </span>
                    )}
                  </CommandItem>
                ))}
                {isFetching && results?.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    Searching…
                  </p>
                )}
                {!isFetching && results?.length === 0 && (
                  <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                    No suggestions — apply your term below.
                  </p>
                )}
                {term.trim().length >= 2 && (
                  <CommandItem
                    value={`__apply__${term.trim()}`}
                    onSelect={() => choose(term.trim())}
                    className="border-t border-border/60"
                  >
                    <span className="text-muted-foreground">Apply</span>
                    <span className="max-w-[170px] truncate font-medium">
                      “{term.trim()}”
                    </span>
                  </CommandItem>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

