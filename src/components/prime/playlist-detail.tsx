"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Heart, ListVideo, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePlaylistDetail } from "./hooks/use-primewire";
import { useAccountMutation, useAccountPlaylists } from "./hooks/use-account";
import { PlaylistAddShows } from "./account/playlist-add-shows";
import { PlaylistFormDialog } from "./account/playlist-dialogs";
import { MediaCard } from "./media-card";
import { toPlaylists } from "./nav";
import { BrowseSkeleton } from "./skeletons";
import { SectionTitle } from "./section-title";
import { useUser } from "./stores/user";
import { cn } from "@/lib/utils";

/**
 * One community playlist — its items as a MediaCard grid, with a back
 * button and a link to the source page on PrimeWire.
 */
export function PlaylistDetail({
  id,
  slug,
}: {
  id: string | null;
  slug: string | null;
}) {
  const router = useRouter();
  const valid = id !== null && /^\d+$/.test(id);
  const numericId = valid ? parseInt(id as string, 10) : null;

  const apiKey = useUser((s) => s.apiKey);
  const { data, isLoading, isError, error } = usePlaylistDetail(
    valid ? id : null,
    slug,
  );

  /* owner + favorite state (signed-in only) */
  const myPlaylists = useAccountPlaylists();
  const mine = numericId != null
    ? (myPlaylists.data?.mine ?? []).find((p) => p.id === numericId) ?? null
    : null;
  const isFavorite = numericId != null
    ? (myPlaylists.data?.favoritePlaylists ?? []).some((p) => p.id === numericId)
    : false;

  const [editOpen, setEditOpen] = useState(false);
  const playlistAction = useAccountMutation<{ ok: boolean }>("playlists", {
    invalidates: [["account", "playlists"]],
  });

  const toggleFavorite = () => {
    if (numericId == null) return;
    playlistAction.mutate(
      { action: "favorite", id: numericId, on: !isFavorite },
      {
        onSuccess: () =>
          toast.success(isFavorite ? "Removed from favorites" : "Added to favorites"),
        onError: (err) =>
          toast.error("Couldn't update favorites", { description: err.message }),
      },
    );
  };

  const deletePlaylist = () => {
    if (numericId == null || !mine) return;
    if (!window.confirm(`Delete the playlist "${mine.title}"? This cannot be undone.`)) return;
    playlistAction.mutate(
      { action: "delete", id: numericId },
      {
        onSuccess: () => {
          toast.success("Playlist deleted");
          toPlaylists(router);
        },
        onError: (err) =>
          toast.error("Couldn't delete the playlist", { description: err.message }),
      },
    );
  };

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load this playlist — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      toPlaylists(router);
    }
  };

  if (!valid) {
    return (
      <PlaylistErrorPanel
        title="Playlist not found"
        message="This playlist doesn't exist or the link is malformed."
        onBack={() => toPlaylists(router)}
      />
    );
  }

  if (isLoading) return <BrowseSkeleton className="mx-auto max-w-7xl px-4 py-8 sm:px-6" />;

  if (isError || !data) {
    return (
      <PlaylistErrorPanel
        title="Couldn't load this playlist"
        message={
          error instanceof Error
            ? error.message
            : "PrimeWire could not be reached."
        }
        onBack={() => toPlaylists(router)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* back */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back to playlists"
        className="glass mb-6 flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-5" aria-hidden />
        Back
      </button>

      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Community Playlist
          </p>
          <SectionTitle as="h1" className="mt-2 text-2xl sm:text-3xl md:text-4xl">
            {data.title}
          </SectionTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.items.length} {data.items.length === 1 ? "title" : "titles"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {apiKey && numericId != null && (
            <Button
              variant="outline"
              size="icon"
              className={cn("size-11 rounded-full", isFavorite && "border-primary text-primary")}
              onClick={toggleFavorite}
              disabled={playlistAction.isPending}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Remove playlist from favorites" : "Add playlist to favorites"}
            >
              <Heart className={cn("size-4", isFavorite && "fill-current")} aria-hidden />
            </Button>
          )}
          {mine && numericId != null && (
            <>
              <PlaylistAddShows playlistId={numericId} />
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
              <Button
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                onClick={deletePlaylist}
                disabled={playlistAction.isPending}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {mine && (
        <PlaylistFormDialog
          key={`edit-${mine.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          target={{
            id: mine.id,
            title: mine.title,
            description: mine.description,
            private: mine.private,
          }}
        />
      )}

      {/* items */}
      {data.items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
            <ListVideo className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              This playlist is empty
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              None of its titles could be loaded right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.items.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistErrorPanel({
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
        <ListVideo className="size-7 text-destructive" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button className="rounded-full" onClick={onBack}>
        Back to playlists
      </Button>
    </div>
  );
}
