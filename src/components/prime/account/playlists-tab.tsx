"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ListVideo, Lock, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MyPlaylistsResponse } from "@/lib/account-client-types";
import { imgUrl } from "../hooks/use-primewire";
import { useAccount, useAccountMutation, useAccountPlaylists } from "../hooks/use-account";
import { toPlaylistDetail } from "../nav";
import { SectionTitle } from "../section-title";
import { TabEmpty, TabError, TabLoading } from "./account-states";
import {
  DeletePlaylistButton,
  PlaylistFormDialog,
} from "./playlist-dialogs";

type MyPlaylist = MyPlaylistsResponse["mine"][number];
type FavoritePlaylist = MyPlaylistsResponse["favoritePlaylists"][number];
type PlaylistCardData = Pick<
  MyPlaylist,
  "id" | "slug" | "title" | "itemCount" | "views" | "favorites" | "poster" | "description"
> &
  Partial<Pick<MyPlaylist, "private" | "createdAgo">>;

/**
 * My playlists — create, edit, delete and open the signed-in user's
 * PrimeWire playlists, plus the playlists they favorited.
 */
export function PlaylistsTab() {
  const { data, isLoading, isError, error, refetch } = useAccountPlaylists();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MyPlaylist | null>(null);
  const [manageTarget, setManageTarget] = useState<MyPlaylist | null>(null);

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (playlist: MyPlaylist) => {
    setEditTarget(playlist);
    setFormOpen(true);
  };

  if (isLoading) return <TabLoading variant="grid" rows={8} />;

  if (isError) {
    return (
      <TabError
        icon={ListVideo}
        message={error instanceof Error ? error.message : "PrimeWire could not be reached."}
        onRetry={() => refetch()}
      />
    );
  }

  const mine = data?.mine ?? [];
  const favorites = data?.favoritePlaylists ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle as="h2" className="text-xl">
          My Playlists
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {mine.length} {mine.length === 1 ? "list" : "lists"}
          </span>
        </SectionTitle>
        <Button className="rounded-full font-semibold" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          New playlist
        </Button>
      </div>

      {mine.length === 0 ? (
        <TabEmpty
          icon={ListVideo}
          title="No playlists yet"
          description="Group your favorite titles into playlists — create your first one and add shows from any playlist page."
          action={{ label: "Create a playlist", onClick: openCreate }}
        />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {mine.map((playlist) => (
            <MyPlaylistCard
              key={`${playlist.id}-${playlist.slug}`}
              playlist={playlist}
              onEdit={() => openEdit(playlist)}
              onManage={() => setManageTarget(playlist)}
            />
          ))}
        </div>
      )}

      {/* favorite playlists */}
      <div className="mt-10">
        <SectionTitle as="h2" className="text-xl">
          Favorite Playlists
        </SectionTitle>
        {favorites.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Playlists you favorite on PrimeWire will appear here.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((playlist) => (
              <PlaylistPosterCard
                key={`fav-${playlist.id}-${playlist.slug}`}
                playlist={playlist}
              />
            ))}
          </div>
        )}
      </div>

      <PlaylistFormDialog
        key={editTarget ? `edit-${editTarget.id}` : "create"}
        open={formOpen}
        onOpenChange={setFormOpen}
        target={editTarget}
      />

      <ManageItemsDialog
        key={manageTarget ? `manage-${manageTarget.id}` : "closed"}
        playlist={manageTarget}
        onOpenChange={(open) => {
          if (!open) setManageTarget(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function metaLine(p: { itemCount: number | null; views: number | null; favorites: number | null }): string {
  const parts: string[] = [];
  if (p.itemCount != null) parts.push(`${p.itemCount} ${p.itemCount === 1 ? "item" : "items"}`);
  if (p.views != null) parts.push(`${p.views.toLocaleString()} ${p.views === 1 ? "view" : "views"}`);
  if (p.favorites != null) parts.push(`${p.favorites.toLocaleString()} ♥`);
  return parts.join(" • ");
}

/** Base poster card — clicking opens the playlist detail view. */
function PlaylistPosterCard({
  playlist,
  toolbar,
}: {
  playlist: PlaylistCardData;
  toolbar?: React.ReactNode;
}) {
  const router = useRouter();
  const poster = imgUrl(playlist.poster, "w500");

  return (
    <div className="group relative w-full">
      <button
        type="button"
        onClick={() => toPlaylistDetail(router, playlist)}
        aria-label={`Open playlist: ${playlist.title}`}
        className="w-full cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300 group-hover:ring-foreground/30 group-hover:shadow-lg group-hover:shadow-black/20 dark:ring-white/5 dark:group-hover:ring-white/25">
          {poster ? (
            <img
              src={poster}
              alt={`${playlist.title} cover`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted p-3 text-center">
              <ListVideo className="size-8 text-muted-foreground/50" aria-hidden />
              <span className="line-clamp-3 text-xs text-muted-foreground">
                {playlist.title}
              </span>
            </div>
          )}

          {playlist.itemCount != null && (
            <span className="glass absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-semibold">
              {playlist.itemCount} {playlist.itemCount === 1 ? "item" : "items"}
            </span>
          )}

          {playlist.private && (
            <span
              className="glass absolute top-2 right-2 flex size-7 items-center justify-center rounded-full"
              title="Private playlist"
              aria-label="Private playlist"
            >
              <Lock className="size-3.5" aria-hidden />
            </span>
          )}
        </div>

        <div className="px-0.5 pt-2.5">
          <p className="truncate text-sm font-medium text-foreground">{playlist.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {metaLine(playlist)}
          </p>
          {playlist.createdAgo && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
              Created {playlist.createdAgo}
            </p>
          )}
          {playlist.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {playlist.description}
            </p>
          )}
        </div>
      </button>

      {toolbar && <div className="mt-2 flex items-center gap-2">{toolbar}</div>}
    </div>
  );
}

/** Owner card with edit + manage items + delete actions. */
function MyPlaylistCard({
  playlist,
  onEdit,
  onManage,
}: {
  playlist: MyPlaylist;
  onEdit: () => void;
  onManage: () => void;
}) {
  return (
    <PlaylistPosterCard
      playlist={playlist}
      toolbar={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            aria-label={`Edit playlist ${playlist.title}`}
            className="h-10 rounded-full text-xs"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            aria-label={`Manage items in playlist ${playlist.title}`}
            className="h-10 rounded-full text-xs"
          >
            <ListVideo className="size-3.5" aria-hidden />
            Items
          </Button>
          <DeletePlaylistButton
            playlist={playlist}
            label="Delete"
            className="h-10 w-full rounded-full"
          />
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Manage items dialog (remove + reorder — uses the real item ids)     */
/* ------------------------------------------------------------------ */

type PlaylistEditItem = {
  itemId: number;
  showId: number | null;
  type: "movie" | "tv" | null;
  title: string;
  year: number | null;
  poster: string | null;
};

/**
 * Manage one of MY playlists' items: reorder (up/down) and remove —
 * PrimeWire's edit-page item ids, fetched live via ?items={id}.
 */
function ManageItemsDialog({
  playlist,
  onOpenChange,
}: {
  playlist: MyPlaylist | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = playlist !== null;
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAccount<{
    items: PlaylistEditItem[];
  }>("playlists", playlist ? { items: String(playlist.id) } : {}, {
    enabled: open,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["account", "playlists"] });
    void refetch();
  };

  const moveAction = useAccountMutation<{ ok: boolean }, {
    action: string; id?: number; itemId?: number; up?: boolean; nextItemId?: number;
  }>("playlists", { onOk: invalidate });

  const move = (item: PlaylistEditItem, dir: "up" | "down", next?: PlaylistEditItem) => {
    moveAction.mutate(
      {
        action: "move-item",
        id: playlist!.id,
        itemId: item.itemId,
        up: dir === "up",
        ...(dir === "down" && next ? { nextItemId: next.itemId } : {}),
      },
      {
        onError: (err) =>
          toast.error("Couldn't move the item", { description: err.message }),
      },
    );
  };

  const remove = (item: PlaylistEditItem) => {
    moveAction.mutate(
      { action: "remove-item", id: playlist!.id, itemId: item.itemId },
      {
        onSuccess: () =>
          toast.success(`Removed “${item.title}” from ${playlist!.title}`),
        onError: (err) =>
          toast.error("Couldn't remove the item", { description: err.message }),
      },
    );
  };

  const items = data?.items ?? [];
  const busy = moveAction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage items — {playlist?.title}</DialogTitle>
          <DialogDescription>
            Reorder or remove titles in this PrimeWire playlist.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "PrimeWire could not be reached."}
            </p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            This playlist is empty — add shows from any title's page.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => {
              const poster = imgUrl(item.poster, "w200");
              return (
                <li
                  key={item.itemId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-2.5"
                >
                  <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {poster && (
                      <img
                        src={poster}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.type === "tv" ? "TV Show" : "Movie"}
                      {item.year ? ` • ${item.year}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      disabled={busy || i === 0}
                      onClick={() => move(item, "up")}
                      aria-label={`Move ${item.title} up`}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      disabled={busy || i === items.length - 1}
                      onClick={() => move(item, "down", items[i + 1])}
                      aria-label={`Move ${item.title} down`}
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => remove(item)}
                      aria-label={`Remove ${item.title} from playlist`}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
