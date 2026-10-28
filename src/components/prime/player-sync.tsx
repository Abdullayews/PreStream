"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BookmarkCheck,
  Check,
  CloudUpload,
  Eye,
  History,
  Loader2,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlayerResponse } from "@/lib/primewire/types";
import {
  LIBRARY_STATUSES,
  libraryStatusLabel,
} from "@/lib/primewire/library-statuses";
import { cn } from "@/lib/utils";
import { useAccount, useAccountMutation } from "./hooks/use-account";
import { useUser } from "./stores/user";
import {
  providerName,
  useExternalWatchLog,
  type ExternalWatchEntry,
} from "./stores/external-watch-log";

const NONE = "__none";

interface DetailStateResponse {
  tracker: {
    library: boolean;
    status: string | null;
    favorite: boolean;
    schedule: boolean;
  };
  episodes: { videoId: number; season: number; number: number; watched: boolean }[];
}

/* ------------------------------------------------------------------ */
/* Sync hook — the bridge between any player source and the account    */
/* ------------------------------------------------------------------ */

/**
 * The watch-sync system. While a video plays — no matter which source it
 * came from — these functions record the watch on the user's PrimeWire
 * account: TV episodes get their watched checkmark (video id = the embed
 * e_id), shows get library membership + a Watching/… status tag. That is
 * the record PrimeWire natively offers for plays from other sources; the
 * local watch log keeps the source attribution ("watched via VidSrc").
 */
export function useWatchSync(data: PlayerResponse) {
  const apiKey = useUser((s) => s.apiKey);
  const logStore = useExternalWatchLog();

  const state = useAccount<DetailStateResponse>("detail-state", {
    type: data.type,
    id: data.id,
    slug: data.slug,
  });
  // Latest query result for use inside async callbacks (auto-sync fires
  // right after a provider pick, possibly before detail-state resolved).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const itemAction = useAccountMutation<DetailStateResponse["tracker"]>("library-item", {
    invalidates: [["account", "detail-state"], ["account", "library"]],
  });
  const episodeAction = useAccountMutation<{ ok: boolean }>("episode", {
    invalidates: [["account", "detail-state"], ["account", "library"]],
  });

  const isEpisode = data.type === "tv";
  const tracker = state.data?.tracker ?? null;
  const episodeState = useMemo(() => {
    if (!isEpisode || data.season == null || data.number == null) return null;
    return (
      state.data?.episodes.find(
        (e) => e.season === data.season && e.number === data.number,
      ) ?? null
    );
  }, [state.data, isEpisode, data.season, data.number]);

  const busy = itemAction.isPending || episodeAction.isPending;

  /** Set/clear the library status tag (the manual tagging control). */
  const setStatus = useCallback(
    (status: string | null) => {
      itemAction.mutate(
        { showId: data.id, library: true, status },
        {
          onSuccess: () =>
            toast.success(
              status
                ? `Tagged as ${libraryStatusLabel(status) ?? status}`
                : "Status tag cleared",
              { description: `${data.title} · saved to your PrimeWire library` },
            ),
          onError: (err) =>
            toast.error("PrimeWire wouldn't save that", { description: err.message }),
        },
      );
    },
    [itemAction, data.id, data.title],
  );

  /** Mark / unmark the current episode watched on PrimeWire. */
  const setEpisodeWatched = useCallback(
    (watched: boolean) => {
      const videoId = data.videoId ?? episodeState?.videoId ?? null;
      if (videoId == null) return;
      episodeAction.mutate(
        { action: watched ? "watch" : "unwatch", episodeId: videoId },
        {
          onSuccess: () =>
            toast.success(watched ? "Episode marked watched" : "Episode marked unwatched", {
              description: `${data.title} · S${String(data.season).padStart(2, "0")}E${String(data.number).padStart(2, "0")} · PrimeWire account`,
            }),
          onError: (err) =>
            toast.error("PrimeWire wouldn't save that", { description: err.message }),
        },
      );
    },
    [episodeAction, data.videoId, episodeState, data.title, data.season, data.number],
  );

  /**
   * Record a watch that happened on ANOTHER provider (or refresh the record
   * for a PrimeWire-host play). Waits for the tracker state when it is still
   * loading so an existing tag is never clobbered, then writes to the
   * PrimeWire account:
   *  - TV: episode watched checkmark + status "Watching" (a more specific
   *    existing tag is kept) + library membership.
   *  - Movie: library membership + status "Watched" (existing tag kept).
   * Finally logs the entry with its source attribution.
   */
  const syncWatch = useCallback(
    async (provider: string | null): Promise<void> => {
      if (!apiKey) return;

      const findEpisode = (d: DetailStateResponse | undefined) =>
        data.season == null || data.number == null
          ? null
          : (d?.episodes.find(
              (e) => e.season === data.season && e.number === data.number,
            ) ?? null);

      let trackerState = stateRef.current.data?.tracker ?? null;
      let episode = findEpisode(stateRef.current.data);
      if (stateRef.current.isPending) {
        try {
          const fresh = await stateRef.current.refetch();
          trackerState = fresh.data?.tracker ?? null;
          episode = findEpisode(fresh.data ?? undefined);
        } catch {
          // keep the safe defaults below
        }
      }

      const alreadyWatched = isEpisode && (episode?.watched ?? false);
      const videoId = data.videoId ?? episode?.videoId ?? null;
      const statusToSet =
        trackerState?.status ?? (isEpisode ? "in-progress" : "watched");
      const needStatus =
        !trackerState?.library ||
        !trackerState?.status ||
        trackerState.status !== statusToSet;

      // ---- PrimeWire account writes -------------------------------------
      if (isEpisode && !alreadyWatched && videoId != null) {
        episodeAction.mutate({ action: "watch", episodeId: videoId });
      }
      if (needStatus) {
        itemAction.mutate({ showId: data.id, library: true, status: statusToSet });
      }

      // ---- local source-attributed log ----------------------------------
      logStore.log({
        type: data.type,
        pwId: data.id,
        tmdbId: data.tmdbId,
        title: data.title,
        season: data.season,
        number: data.number,
        provider,
        synced: true,
      });

      const via = provider ? ` via ${providerName(provider)}` : "";
      const epLabel = isEpisode
        ? `S${String(data.season).padStart(2, "0")}E${String(data.number).padStart(2, "0")} · `
        : "";
      const what = alreadyWatched
        ? `${epLabel}already marked watched`
        : isEpisode
          ? `${epLabel}marked watched + tagged Watching`
          : "tagged Watched in your library";
      toast.success(`Recorded to PrimeWire${via}`, {
        description: `${data.title} — ${what}`,
      });
    },
    [
      apiKey,
      isEpisode,
      data.videoId,
      data.id,
      data.tmdbId,
      data.title,
      data.season,
      data.number,
      data.type,
      episodeAction,
      itemAction,
      logStore,
    ],
  );

  return {
    signedIn: !!apiKey,
    tracker,
    episodeState,
    busy,
    stateLoading: state.isLoading,
    setStatus,
    setEpisodeWatched,
    syncWatch,
  };
}

/* ------------------------------------------------------------------ */
/* Control-bar button + panel                                          */
/* ------------------------------------------------------------------ */

export function WatchSyncButton({ sync }: { sync: ReturnType<typeof useWatchSync> }) {
  const signedIn = sync.signedIn;
  const label = sync.tracker
    ? libraryStatusLabel(sync.tracker.status) ?? "Tag this"
    : signedIn
      ? "Tag this"
      : "Sync";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Sync and tag this watch on your PrimeWire account"
          title="Sync & tag on your PrimeWire account"
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            sync.tracker?.status
              ? "bg-foreground/10 ring-1 ring-foreground/20"
              : "bg-foreground/5",
          )}
        >
          {sync.busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : sync.tracker?.status ? (
            <BookmarkCheck className="size-4" aria-hidden />
          ) : (
            <CloudUpload className="size-4" aria-hidden />
          )}
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <SyncPanel sync={sync} />
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Panel body                                                          */
/* ------------------------------------------------------------------ */

function SyncPanel({ sync }: { sync: ReturnType<typeof useWatchSync> }) {
  const log = useExternalWatchLog();

  if (!sync.signedIn) {
    return (
      <div className="p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <LogIn className="size-4" aria-hidden /> Sign in to sync watches
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Watching from another provider can be recorded on your PrimeWire
          account — episodes get their watched checkmark and shows get a
          Watching / Plan to Watch tag. Sign in from the account menu to
          turn that on.
        </p>
      </div>
    );
  }

  const current = sync.tracker?.status ?? NONE;

  return (
    <div>
      <div className="border-b border-border/70 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CloudUpload className="size-4" aria-hidden /> Sync to PrimeWire
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Watching on another source is recorded here — episode checkmarks
          and status tags land in your PrimeWire library.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {/* status tag */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status tag
          </p>
          <Select
            value={current}
            onValueChange={(v) => sync.setStatus(v === NONE ? "" : v)}
            disabled={sync.busy}
          >
            <SelectTrigger className="h-10 w-full rounded-xl" aria-label="Watch status">
              <SelectValue placeholder="Set a status…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No status</SelectItem>
              {LIBRARY_STATUSES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* episode watched toggle */}
        {sync.episodeState !== null && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Eye className="size-4 text-muted-foreground" aria-hidden />
              Episode watched
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={sync.episodeState.watched}
              aria-label="Toggle episode watched"
              disabled={sync.busy || sync.episodeState.videoId == null}
              onClick={() => sync.setEpisodeWatched(!sync.episodeState?.watched)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sync.episodeState.watched ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-background shadow transition-all",
                  sync.episodeState.watched ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>
        )}

        {/* library line */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {sync.tracker?.library ? (
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" aria-hidden />
              In your PrimeWire library
            </span>
          ) : (
            "Not in your library yet — tagging adds it."
          )}
        </p>

        {/* watch log */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="size-3.5" aria-hidden />
            Watch log
          </p>
          {log.entries.length === 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nothing recorded yet. Plays from other providers are listed
              here with their source.
            </p>
          ) : (
            <div className="thin-scrollbar max-h-44 space-y-1 overflow-y-auto pr-1">
              {log.entries.slice(0, 12).map((e) => (
                <LogRow key={e.at} entry={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: ExternalWatchEntry }) {
  const remove = useExternalWatchLog((s) => s.remove);
  const ep =
    entry.season != null && entry.number != null
      ? ` S${String(entry.season).padStart(2, "0")}E${String(entry.number).padStart(2, "0")}`
      : "";
  return (
    <div className="group/log flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs">
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium">{entry.title}</span>
        <span className="text-muted-foreground">{ep}</span>
      </span>
      <span
        className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
        title={entry.synced ? "Recorded on your PrimeWire account" : "Not recorded yet"}
      >
        {providerName(entry.provider)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover/log:opacity-100"
        onClick={() => remove(entry.at)}
        aria-label={`Remove ${entry.title} from the watch log`}
      >
        <span aria-hidden className="text-muted-foreground">
          ×
        </span>
      </Button>
    </div>
  );
}
