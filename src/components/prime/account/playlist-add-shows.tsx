"use client";

import { useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { MediaItem } from "@/lib/primewire/types";
import { imgUrl } from "../hooks/use-primewire";
import {
  useAccountMutation,
  useAccountPlaylistSearch,
} from "../hooks/use-account";

/**
 * Owner toolbar control: search PrimeWire's catalog and add shows to one
 * of your playlists (playlist-editor search + add-show actions).
 */
export function PlaylistAddShows({ playlistId }: { playlistId: number }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [type, setType] = useState<"all" | "movie" | "tv">("all");

  const search = useAccountPlaylistSearch(
    open ? playlistId : null,
    term,
    type === "all" ? undefined : type,
  );

  const qc = useQueryClient();
  const add = useAccountMutation<{ ok: boolean }>("playlists");

  const addShow = (item: MediaItem) => {
    add.mutate(
      { action: "add-show", id: playlistId, showId: item.id },
      {
        onSuccess: () => {
          toast.success(`Added to the playlist`, { description: item.title });
          // refresh the public playlist detail + my playlists
          void qc.invalidateQueries({ queryKey: ["primewire", "playlist"] });
          void qc.invalidateQueries({ queryKey: ["account", "playlists"] });
        },
        onError: (err) =>
          toast.error("Couldn't add the title", { description: err.message }),
      },
    );
  };

  const trimmed = term.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="rounded-full font-semibold">
          <Plus className="size-4" aria-hidden />
          Add shows
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,400px)] p-0">
        <div className="flex items-center gap-2 border-b border-border/60 p-2.5">
          <Search
            className="pointer-events-none size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search movies & TV…"
            autoFocus
            aria-label="Search titles to add"
            className="h-9 rounded-full border-transparent bg-foreground/5 text-sm focus-visible:ring-ring/40"
          />
          <Select
            value={type}
            onValueChange={(v) => setType(v as "all" | "movie" | "tv")}
          >
            <SelectTrigger
              className="h-9 w-[104px] shrink-0 rounded-full text-xs"
              aria-label="Filter search by type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="tv">TV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="thin-scrollbar max-h-80 overflow-y-auto p-1.5">
          {trimmed.length < 2 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search the catalog.
            </p>
          ) : search.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </div>
          ) : search.isError ? (
            <p className="px-3 py-8 text-center text-xs leading-relaxed text-muted-foreground">
              {search.error instanceof Error
                ? search.error.message
                : "Search failed — try again."}
            </p>
          ) : (search.data?.items.length ?? 0) === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              No matches for “{trimmed}”.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {search.data?.items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <div className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-foreground/5">
                    <span className="w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {imgUrl(item.poster, "w200") ? (
                        <img
                          src={imgUrl(item.poster, "w200") as string}
                          alt=""
                          loading="lazy"
                          className="aspect-[2/3] w-full object-cover"
                        />
                      ) : (
                        <span className="flex aspect-[2/3] w-full items-center justify-center text-[10px] text-muted-foreground">
                          {item.type === "movie" ? "M" : "TV"}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {item.year != null ? `${item.year} · ` : ""}
                        {item.type === "movie" ? "Movie" : "TV"}
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => addShow(item)}
                      disabled={add.isPending}
                      aria-label={`Add ${item.title} to the playlist`}
                      className="size-9 shrink-0 rounded-full"
                    >
                      {add.isPending && add.variables?.showId === item.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Plus className="size-4" aria-hidden />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground/70">
          Adds live on PrimeWire — anyone following the playlist sees them.
        </p>
      </PopoverContent>
    </Popover>
  );
}
