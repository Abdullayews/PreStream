"use client";

import { useEffect } from "react";
import { ListVideo } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PlaylistSummary } from "@/lib/primewire/types";
import { imgUrl, usePlaylists } from "./hooks/use-primewire";
import { playlistsHref, toPlaylistDetail } from "./nav";
import { Pagination } from "./pagination";
import { PlaylistsSkeleton } from "./skeletons";
import { SectionTitle } from "./section-title";

/**
 * Community playlists — browsable grid of curated PrimeWire playlists with
 * pagination. Cards open the playlist detail view.
 */
export function PlaylistsView() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const { data, isLoading, isError, error, refetch } = usePlaylists(page);

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load playlists — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  const goToPage = (next: number) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    router.push(playlistsHref(next));
  };

  if (isLoading) return <PlaylistsSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <ListVideo className="size-7 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Couldn&apos;t load playlists
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

  const items = data.items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SectionTitle as="h1" className="text-2xl sm:text-3xl">
          Community Playlists
        </SectionTitle>
        <p className="text-xs text-muted-foreground">
          Curated collections from PrimeWire members
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
            <ListVideo className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              No playlists here
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This page has no playlists — try heading back a page.
            </p>
          </div>
          {page > 1 && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => goToPage(1)}
            >
              First page
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((playlist) => (
              <PlaylistCard
                key={`${playlist.id}-${playlist.slug}`}
                playlist={playlist}
              />
            ))}
          </div>

          <Pagination
            page={data.page ?? page}
            pages={data.pages ?? []}
            hasNext={data.hasNext ?? false}
            onPage={goToPage}
          />
        </>
      )}
    </div>
  );
}

/** A playlist card — poster + title + stats; NOT a MediaCard (it's a list). */
function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const router = useRouter();
  const poster = imgUrl(playlist.poster, "w500");

  const meta: string[] = [];
  if (playlist.itemCount != null) meta.push(`${playlist.itemCount} items`);
  if (playlist.views != null)
    meta.push(
      `${playlist.views.toLocaleString()} view${playlist.views === 1 ? "" : "s"}`,
    );

  return (
    <button
      type="button"
      onClick={() => toPlaylistDetail(router, playlist)}
      aria-label={`Open playlist: ${playlist.title}`}
      className="group relative w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
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

        {/* item count badge */}
        {playlist.itemCount != null && (
          <span className="glass absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-semibold">
            {playlist.itemCount} items
          </span>
        )}
      </div>

      <div className="px-0.5 pt-2.5">
        <p className="truncate text-sm font-medium text-foreground">
          {playlist.title}
        </p>
        {meta.length > 0 && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {meta.join(" • ")}
          </p>
        )}
        {(playlist.author || playlist.createdAgo) && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
            {playlist.author ?? "Unknown"}
            {playlist.createdAgo ? ` • ${playlist.createdAgo}` : ""}
          </p>
        )}
        {playlist.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {playlist.description}
          </p>
        )}
      </div>
    </button>
  );
}
