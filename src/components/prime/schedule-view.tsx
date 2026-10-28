"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Film, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScheduleDay, ScheduleEpisode } from "@/lib/primewire/types";
import { imgUrl, useSchedule } from "./hooks/use-primewire";
import { toDetail, toPlayer } from "./nav";
import { ScheduleSkeleton } from "./skeletons";
import { SectionTitle } from "./section-title";

function timeAgoImpl(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Humanized "Xm ago" for ISO timestamps (exported for the account tab). */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "recently";
  return timeAgoImpl(iso);
}

/**
 * TV Schedule — a 7-day airing calendar. Day pills select the active day
 * (defaulting to the first day with unaired episodes); episodes are listed
 * as rows linking to the show's detail page.
 */
export function ScheduleView() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSchedule();
  const [dayIndex, setDayIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load the schedule — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  if (isLoading) return <ScheduleSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <CalendarDays className="size-7 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Couldn&apos;t load the schedule
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "PrimeWire could not be reached."}
          </p>
        </div>
        <Button className="rounded-full" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const days = data.days;
  // default day: the first with at least one unaired episode, else day one
  const defaultIndex = Math.max(
    0,
    days.findIndex((day) => day.episodes.some((ep) => !ep.aired)),
  );
  const activeIndex =
    dayIndex === null || dayIndex >= days.length ? defaultIndex : dayIndex;
  const activeDay = days[activeIndex] ?? days[0];

  return (
    <div>
      {/* ---------------- sticky sub-header: title + day pills ---------------- */}
      <div className="glass sticky top-16 z-40 rounded-none border-x-0 border-t-0">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <SectionTitle as="h1" className="text-2xl sm:text-3xl">
              TV Schedule
            </SectionTitle>
            <p className="text-xs text-muted-foreground">
              Updated {timeAgo(data.updatedAt)}
            </p>
          </div>

          <ScheduleDayPicker
            days={days}
            activeIndex={activeIndex}
            onSelect={setDayIndex}
          />
        </div>
      </div>

      {/* ---------------- episode list ---------------- */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!activeDay || activeDay.episodes.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
              <CalendarDays className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Nothing airing this day
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another day from the schedule above.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {activeDay.episodes.map((episode) => (
              <ScheduleRow key={`${episode.showId}-${episode.href}`} episode={episode} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Scrollable day-pill strip (role=tablist) shared by the public schedule
 * and the personal account schedule.
 */
export function ScheduleDayPicker({
  days,
  activeIndex,
  onSelect,
}: {
  days: ScheduleDay[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1"
      role="tablist"
      aria-label="Airing day"
    >
      {days.map((day, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={day.day}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {day.day}
            <span
              className={cn(
                "ml-2 text-xs",
                active ? "opacity-75" : "text-muted-foreground/70",
              )}
            >
              {day.episodes.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** One airing episode — poster, show title, S/E info, aired badge, links. */
export function ScheduleRow({ episode }: { episode: ScheduleEpisode }) {
  const router = useRouter();
  const poster = imgUrl(episode.poster, "w200");

  const openShow = () =>
    toDetail(router, {
      type: "tv",
      id: episode.showId,
      slug: episode.showSlug,
    });

  return (
    <li className="group flex items-stretch gap-2 rounded-2xl border border-border/60 bg-card transition-colors hover:border-foreground/25">
      <button
        type="button"
        onClick={openShow}
        aria-label={`Open ${episode.title} — season ${episode.season}, episode ${episode.number}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-4 sm:p-3"
      >
        {/* poster thumbnail (56px wide) */}
        <span className="w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {poster ? (
            <img
              src={poster}
              alt={`${episode.title} poster`}
              loading="lazy"
              decoding="async"
              className="aspect-[2/3] w-full object-cover"
            />
          ) : (
            <span className="flex aspect-[2/3] w-full items-center justify-center">
              <Film className="size-5 text-muted-foreground/50" aria-hidden />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {episode.title}
            </span>
            <span className="shrink-0 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              S{episode.season} E{episode.number}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                episode.aired
                  ? "bg-muted text-muted-foreground"
                  : "border border-foreground/30 text-foreground",
              )}
            >
              {episode.aired ? "Aired" : "Upcoming"}
            </span>
          </span>
          <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
            {episode.aired
              ? "Available now — open for links"
              : "Hasn't aired yet — set a reminder"}
          </span>
        </span>
      </button>

      {/* play the episode in the in-app player */}
      <button
        type="button"
        onClick={() =>
          toPlayer(router, {
            type: "tv",
            id: episode.showId,
            slug: episode.showSlug,
            season: episode.season,
            number: episode.number,
          })
        }
        aria-label={`Play ${episode.title} season ${episode.season} episode ${episode.number}`}
        title="Play episode"
        className="my-auto ml-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Play className="size-4 fill-current" aria-hidden />
      </button>
    </li>
  );
}
