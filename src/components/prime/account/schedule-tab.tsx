"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAccountSchedule } from "../hooks/use-account";
import { ScheduleDayPicker, ScheduleRow, timeAgo } from "../schedule-view";
import { SectionTitle } from "../section-title";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/**
 * Personal schedule — upcoming episodes of the shows in the user's
 * PrimeWire library. Same day-pill + episode-row layout as the public
 * schedule (shared components).
 */
export function ScheduleTab() {
  const { data, isLoading, isError, error, refetch } = useAccountSchedule();
  // user's day pick, tagged with the schedule version it belongs to —
  // picks reset naturally when fresh data arrives (no effects needed)
  const [pick, setPick] = useState<{ version: string; index: number } | null>(null);

  if (isLoading) return <TabLoading variant="schedule" rows={8} />;

  if (isError) {
    return (
      <TabError
        icon={CalendarDays}
        message={error instanceof Error ? error.message : "PrimeWire could not be reached."}
        onRetry={() => refetch()}
      />
    );
  }

  const days = data?.days ?? [];
  if (days.length === 0) {
    return (
      <TabEmpty
        icon={CalendarDays}
        title="Your schedule is empty"
        description="Add shows to your library and they'll land here with their upcoming episodes."
      />
    );
  }

  const defaultIndex = Math.max(
    0,
    days.findIndex((day) => day.episodes.some((ep) => !ep.aired)),
  );
  const version = data?.updatedAt ?? "";
  const picked = pick && pick.version === version ? pick.index : null;
  const activeIndex =
    picked === null || picked >= days.length ? defaultIndex : picked;
  const activeDay = days[activeIndex] ?? days[0];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SectionTitle as="h2" className="text-xl">
          My Schedule
        </SectionTitle>
        <p className="text-xs text-muted-foreground">
          Updated {timeAgo(data?.updatedAt)}
        </p>
      </div>

      <ScheduleDayPicker
        days={days}
        activeIndex={activeIndex}
        onSelect={(index) => setPick({ version, index })}
      />

      <div className="mt-5">
        {!activeDay || activeDay.episodes.length === 0 ? (
          <TabEmpty
            icon={CalendarDays}
            title="Nothing airing this day"
            description="Try another day from the schedule above."
          />
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
