"use client";

import { useState } from "react";
import {
  CalendarPlus,
  Check,
  Heart,
  LibraryBig,
  ListPlus,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { LibraryItemState } from "@/lib/account-client-types";
import { LIBRARY_STATUSES as STATUS_OPTIONS } from "@/lib/primewire/library-statuses";
import { cn } from "@/lib/utils";
import {
  useAccount,
  useAccountMutation,
  useAccountPlaylists,
} from "../hooks/use-account";
import { useUser } from "../stores/user";

const NONE = "__none";

interface DetailStateResponse {
  tracker: LibraryItemState;
  episodes: { videoId: number; season: number; number: number; watched: boolean }[];
}

/**
 * Signed-in tracker card for a detail page — the full PrimeWire widget:
 * library / status / favorite / my-schedule toggles, your 1–5 rating and
 * add-to-playlist. Every action hits the real PrimeWire account.
 */
export function TrackerWidget({
  showId,
  type,
  slug,
  title,
}: {
  showId: number;
  type: "movie" | "tv";
  slug: string;
  title: string;
}) {
  const apiKey = useUser((s) => s.apiKey);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  const state = useAccount<DetailStateResponse>("detail-state", {
    type,
    id: showId,
    slug,
  });
  const myPlaylists = useAccountPlaylists();

  const tracker = state.data?.tracker ?? null;

  const itemAction = useAccountMutation<LibraryItemState>("library-item", {
    invalidates: [["account", "detail-state"], ["account", "library"]],
  });
  const rateAction = useAccountMutation<{ rating: number; votes: number }>("rate", {
    invalidates: [["account", "detail-state"], ["primewire", "detail"]],
  });
  const playlistAction = useAccountMutation<{ ok: boolean }>("playlists", {
    invalidates: [["account", "playlists"]],
  });

  if (!apiKey) return null;

  const update = (patch: Partial<{ library: boolean; status: string | null; favorite: boolean; schedule: boolean }>) => {
    itemAction.mutate(
      { showId, ...patch },
      {
        onError: (err) =>
          toast.error("PrimeWire wouldn't save that", { description: err.message }),
      },
    );
  };

  const submitRating = (value: number) => {
    setRating(value);
    rateAction.mutate(
      { showId, rating: value },
      {
        onSuccess: (data) =>
          toast.success(`Rated ${value} of 5`, {
            description: `${title} now averages ${data.rating.toFixed(1)}★ over ${data.votes} votes.`,
          }),
        onError: (err) =>
          toast.error("Couldn't save the rating", { description: err.message }),
      },
    );
  };

  const busy = itemAction.isPending || rateAction.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LibraryBig className="size-4" aria-hidden />
          My Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {state.isLoading && !tracker ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading your PrimeWire state…
          </div>
        ) : tracker ? (
          <>
            {/* library toggle */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">In my Library</span>
              <button
                type="button"
                role="switch"
                aria-checked={tracker.library}
                aria-label="Toggle library membership"
                disabled={busy}
                onClick={() => update({ library: !tracker.library })}
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tracker.library ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-5 rounded-full bg-background shadow transition-all",
                    tracker.library ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>

            {/* status */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <Select
                value={tracker.status ?? NONE}
                onValueChange={(v) => update({ status: v === NONE ? "" : v })}
                disabled={busy}
              >
                <SelectTrigger className="h-10 w-full rounded-xl" aria-label="Watch status">
                  <SelectValue placeholder="Set a status…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No status</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {/* favorite */}
              <button
                type="button"
                onClick={() => update({ favorite: !tracker.favorite })}
                disabled={busy}
                aria-pressed={tracker.favorite}
                aria-label={tracker.favorite ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tracker.favorite
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Heart
                  className={cn("size-4", tracker.favorite && "fill-current")}
                  aria-hidden
                />
                {tracker.favorite ? "Favorited" : "Favorite"}
              </button>

              {/* schedule */}
              <button
                type="button"
                onClick={() => update({ schedule: !tracker.schedule })}
                disabled={busy}
                aria-pressed={tracker.schedule}
                aria-label={
                  tracker.schedule ? "Remove from My Schedule" : "Add to My Schedule"
                }
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tracker.schedule
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <CalendarPlus className="size-4" aria-hidden />
                {tracker.schedule ? "Scheduled" : "My Schedule"}
              </button>
            </div>
          </>
        ) : null}

        {/* your rating */}
        <div className="pt-0.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your rating
          </p>
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Rate ${title}`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating !== null && value <= rating}
                aria-label={`Rate ${value} of 5`}
                onClick={() => submitRating(value)}
                disabled={busy}
                className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "size-6",
                    rating !== null && value <= rating
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground/50",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>

        {/* add to playlist */}
        <Popover open={playlistOpen} onOpenChange={setPlaylistOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 w-full rounded-full">
              <ListPlus className="size-4" aria-hidden />
              Add to playlist
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-64 p-2">
            <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your playlists
            </p>
            <div className="thin-scrollbar max-h-56 overflow-y-auto">
              {(myPlaylists.data?.mine ?? []).length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No playlists yet — create one under Account → Playlists.
                </p>
              ) : (
                (myPlaylists.data?.mine ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={playlistAction.isPending}
                    onClick={() => {
                      playlistAction.mutate(
                        { action: "add-show", id: p.id, showId },
                        {
                          onSuccess: () => {
                            toast.success(`Added to “${p.title}”`, { description: title });
                            setPlaylistOpen(false);
                          },
                          onError: (err) =>
                            toast.error("Couldn't add to the playlist", {
                              description: err.message,
                            }),
                        },
                      );
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 truncate">{p.title}</span>
                    <Check className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
