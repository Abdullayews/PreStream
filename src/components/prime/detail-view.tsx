"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Film,
  ListChecks,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { imgUrl, useDetail } from "./hooks/use-primewire";
import { useAccount, useAccountMutation } from "./hooks/use-account";
import { TrackerWidget } from "./detail/tracker-widget";
import { toBrowse, toHome, toPlayer } from "./nav";
import { SectionTitle } from "./section-title";
import { DetailSkeleton } from "./skeletons";
import { StarRating } from "./star-rating";
import { useWatchlist, useWatchlistHas } from "./stores/watchlist";
import { useUser } from "./stores/user";
import type { MediaType } from "@/lib/primewire/types";

/** Detail page for one title: hero band, actions, cast, episodes, sidebar. */
export function DetailView({
  type,
  id,
  slug,
}: {
  type: string | null;
  id: string | null;
  slug: string | null;
}) {
  const router = useRouter();

  const valid =
    (type === "movie" || type === "tv") &&
    id !== null &&
    /^\d+$/.test(id) &&
    typeof slug === "string" &&
    slug.length > 0;

  const { data, isLoading, isError, error } = useDetail(
    valid ? type : null,
    id,
    slug,
  );

  const numericId = valid && id ? parseInt(id, 10) : -1;
  const wlType: MediaType = type === "tv" ? "tv" : "movie";
  const inWatchlist = useWatchlistHas(numericId, wlType);
  const toggleWatchlist = useWatchlist((s) => s.toggle);
  const apiKey = useUser((s) => s.apiKey);

  /* signed-in episode watched state (video ids keyed by season+number) */
  const detailState = useAccount<{
    tracker: { library: boolean; status: string | null; favorite: boolean; schedule: boolean };
    episodes: { videoId: number; season: number; number: number; watched: boolean }[];
  }>("detail-state", { type, id, slug: slug ?? "" }, { enabled: !!apiKey });
  const episodeAction = useAccountMutation<{ ok: boolean }>("episode", {
    invalidates: [["account", "detail-state"], ["account", "library"]],
  });

  const watchedMap = new Map<string, { videoId: number; watched: boolean }>();
  for (const ep of detailState.data?.episodes ?? []) {
    watchedMap.set(`${ep.season}-${ep.number}`, { videoId: ep.videoId, watched: ep.watched });
  }

  const toggleEpisode = (
    episode: { season: number; number: number; name: string },
    watched: boolean,
  ) => {
    const entry = watchedMap.get(`${episode.season}-${episode.number}`);
    if (!entry) return;
    episodeAction.mutate(
      { action: watched ? "unwatch" : "watch", episodeId: entry.videoId },
      {
        onError: (err) =>
          toast.error("Couldn't update the episode", { description: err.message }),
      },
    );
  };

  const markSeason = (season: number, watchedCount: number, total: number) => {
    const allWatched = total > 0 && watchedCount === total;
    episodeAction.mutate(
      {
        action: allWatched ? "unwatch-season" : "watch-season",
        showId: numericId,
        season,
      },
      {
        onError: (err) =>
          toast.error("Couldn't update the season", { description: err.message }),
      },
    );
  };

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [season, setSeason] = useState<number | null>(null);

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load data — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  if (!valid) {
    return (
      <ErrorPanel
        title="Title not found"
        message="The title you are looking for does not exist or the link is malformed."
        onBack={() => toHome(router)}
      />
    );
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <ErrorPanel
        title="Couldn't load this title"
        message={
          error instanceof Error
            ? error.message
            : "PrimeWire could not be reached."
        }
        onBack={() => toHome(router)}
      />
    );
  }

  const poster = imgUrl(data.poster, "w500");
  const backdrop = imgUrl(data.poster, "w1280");
  const seasons = data.seasons;
  const currentSeason =
    seasons.find((s) => s.season === season) ?? seasons[0] ?? null;
  const trailer = data.trailers[0] ?? null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      toHome(router);
    }
  };

  const handleToggleWatchlist = () => {
    const added = toggleWatchlist({
      id: data.id,
      slug: data.slug,
      type: data.type,
      title: data.title,
      year: data.year,
      poster: data.poster,
      rating: data.primewireRating,
    });
    toast.success(added ? "Added to watchlist" : "Removed from watchlist", {
      description: data.title,
    });
  };

  return (
    <div>
      {/* ---------------- hero band ---------------- */}
      <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-40 blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />

        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="glass absolute top-4 left-4 z-10 flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-6"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Back
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ---------------- head ---------------- */}
        <div className="relative z-10 -mt-28 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div className="w-[200px] shrink-0 md:w-[240px]">
            {poster ? (
              <img
                src={poster}
                alt={`${data.title} poster`}
                className="w-full rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-card shadow-2xl ring-1 ring-white/10">
                <Film className="size-10 text-muted-foreground/50" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-2 sm:pt-16 md:pt-24">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {data.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              {data.year != null && <span>{data.year}</span>}
              <span className="uppercase tracking-wide">
                {data.type === "movie" ? "Movie" : "TV Series"}
              </span>
              {data.status && (
                <Badge
                  variant="outline"
                  className="border-foreground/20 text-foreground"
                >
                  {data.status}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {data.primewireRating != null && data.primewireRating > 0 && (
                <StarRating
                  value={data.primewireRating}
                  votes={data.primewireVotes}
                  size="md"
                  showValue
                />
              )}
              {data.tmdbRating != null && data.tmdbRating > 0 && (
                <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                  TMDB {data.tmdbRating.toFixed(1)}
                </span>
              )}
            </div>

            {data.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="rounded-full px-3 py-1 font-normal"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- body ---------------- */}
        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            {/* actions */}
            <div className="flex flex-wrap items-center gap-3">
              {(() => {
                const firstEp =
                  data.type === "tv" && currentSeason
                    ? currentSeason.episodes.find((e) => e.released) ??
                      currentSeason.episodes[0]
                    : null;
                return (
                  <Button
                    className="h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/85"
                    onClick={() =>
                      toPlayer(router, {
                        type: data.type,
                        id: data.id,
                        slug: data.slug,
                        season: firstEp?.season ?? null,
                        number: firstEp?.number ?? null,
                      })
                    }
                  >
                    <Play className="size-4 fill-current" aria-hidden />
                    {data.type === "movie"
                      ? "Play movie"
                      : firstEp
                        ? `Play S${firstEp.season}E${firstEp.number}`
                        : "Play"}
                  </Button>
                );
              })()}

              {trailer && (
                <Button
                  variant="outline"
                  className="h-11 rounded-full px-6 text-sm font-semibold"
                  onClick={() => setTrailerOpen(true)}
                >
                  Trailer
                </Button>
              )}

              <Button
                variant={inWatchlist ? "secondary" : "outline"}
                className="h-11 rounded-full px-6 text-sm font-semibold"
                onClick={handleToggleWatchlist}
                aria-pressed={inWatchlist}
              >
                <Bookmark
                  className={cn("size-4", inWatchlist && "fill-current")}
                  aria-hidden
                />
                {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </Button>

            </div>

            {/* description */}
            <section aria-label="Description">
              <SectionTitle className="mb-4">Description</SectionTitle>
              <p className="max-w-3xl leading-relaxed text-muted-foreground">
                {data.description ?? "No description available yet."}
              </p>
            </section>

            {/* episodes (TV) */}
            {data.type === "tv" && seasons.length > 0 && (
              <section aria-label="Episodes">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <SectionTitle>Episodes</SectionTitle>
                  <Select
                    value={currentSeason ? String(currentSeason.season) : undefined}
                    onValueChange={(v) => setSeason(Number(v))}
                  >
                    <SelectTrigger
                      className="h-10 w-[190px] rounded-full"
                      aria-label="Select season"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((s) => (
                        <SelectItem key={s.season} value={String(s.season)}>
                          Season {s.season} ({s.episodes.length} episodes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="thin-scrollbar max-h-[480px] space-y-2 overflow-y-auto pr-1">
                  {currentSeason && apiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        const eps = currentSeason.episodes.map((e) => watchedMap.get(`${e.season}-${e.number}`)?.watched ?? false);
                        markSeason(currentSeason.season, eps.filter(Boolean).length, eps.length);
                      }}
                      disabled={episodeAction.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-foreground/[0.03] py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ListChecks className="size-4" aria-hidden />
                      {currentSeason.episodes.every(
                        (e) => watchedMap.get(`${e.season}-${e.number}`)?.watched,
                      )
                        ? "Unmark season watched"
                        : "Mark season watched"}
                    </button>
                  )}
                  {currentSeason?.episodes.map((episode) => {
                    const watchedEntry = watchedMap.get(`${episode.season}-${episode.number}`);
                    return (
                    <div
                      key={`${episode.season}-${episode.number}`}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:border-foreground/25",
                        !episode.released && "opacity-60",
                      )}
                    >
                      {apiKey && watchedEntry ? (
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={watchedEntry.watched}
                          disabled={episodeAction.isPending}
                          onClick={() => toggleEpisode(episode, watchedEntry.watched)}
                          aria-label={`Mark ${episode.name || `episode ${episode.number}`} as watched`}
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            watchedEntry.watched
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-transparent hover:border-foreground/40",
                          )}
                        >
                          <CheckCircle2 className="size-4" aria-hidden />
                        </button>
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                          E{episode.number}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {episode.name || `Episode ${episode.number}`}
                        </p>
                        {episode.airDate && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {episode.airDate}
                          </p>
                        )}
                      </div>
                      {episode.links > 0 && (
                        <span className="shrink-0 rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-medium text-foreground">
                          {episode.links} links
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          toPlayer(router, {
                            type: "tv",
                            id: data.id,
                            slug: data.slug,
                            season: episode.season,
                            number: episode.number,
                          })
                        }
                        aria-label={`Play ${data.title} season ${episode.season} episode ${episode.number}`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Play className="size-4 fill-current" aria-hidden />
                      </button>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ---------------- sidebar ---------------- */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {apiKey && (
              <TrackerWidget
                showId={data.id}
                type={data.type}
                slug={data.slug}
                title={data.title}
              />
            )}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-4 text-sm">
                <DetailRow label="Released" value={data.released} />
                <DetailRow label="Runtime" value={data.runtime} />
                <DetailRow label="Status" value={data.status} />
                <DetailRow
                  label="Countries"
                  value={
                    data.countries.length > 0
                      ? data.countries.join(", ")
                      : null
                  }
                />
                {data.companies.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Companies
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {data.companies.map((company) => (
                        <Badge
                          key={company}
                          variant="secondary"
                          className="font-normal"
                        >
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {data.aka.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Also known as
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {data.aka.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Explore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pb-4">
                {data.genres.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Genres
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.genres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toBrowse(router, { genre })}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* ---------------- trailer dialog ---------------- */}
      {trailer && (
        <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
          <DialogContent className="max-w-3xl overflow-hidden p-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Play className="size-4" aria-hidden />
                {trailer.title || `${data.title} — Trailer`}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Watch the trailer for {data.title}.
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${data.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value || "—"}</span>
    </div>
  );
}

function ErrorPanel({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <Film className="size-7 text-destructive" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button className="rounded-full" onClick={onBack}>
        Back to home
      </Button>
    </div>
  );
}
