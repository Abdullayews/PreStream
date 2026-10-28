"use client";

import { Bookmark, Film, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { imgUrl } from "./hooks/use-primewire";
import { toBrowse, toDetail, toPlayer } from "./nav";
import { useWatchlist } from "./stores/watchlist";

/** Right-side sheet listing saved titles. */
export function WatchlistDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const items = useWatchlist((s) => s.items);
  const remove = useWatchlist((s) => s.remove);
  const clear = useWatchlist((s) => s.clear);

  const openDetail = (item: (typeof items)[number]) => {
    onOpenChange(false);
    toDetail(router, item);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5">
            Watchlist
            {items.length > 0 && (
              <Badge variant="secondary" className="rounded-full px-2">
                {items.length}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Titles you saved for later.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Bookmark className="size-7 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium">Your watchlist is empty</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Tap the bookmark on any title to save it for later.
              </p>
            </div>
            <Button
              className="rounded-full"
              onClick={() => {
                onOpenChange(false);
                toBrowse(router, { type: "movie" });
              }}
            >
              Discover movies
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end border-b border-border/40 px-4 py-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Clear all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear the watchlist?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all {items.length} saved titles. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => {
                        clear();
                        toast.success("Watchlist cleared");
                      }}
                    >
                      Clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ul className="thin-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
              {items.map((item) => {
                const poster = imgUrl(item.poster, "w200");
                return (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-muted/60"
                  >
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Open ${item.title}`}
                    >
                      <span className="block w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {poster ? (
                          <img
                            src={poster}
                            alt={`${item.title} poster`}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[2/3] w-full object-cover"
                          />
                        ) : (
                          <span className="flex aspect-[2/3] w-full items-center justify-center">
                            <Film
                              className="size-5 text-muted-foreground/50"
                              aria-hidden
                            />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.year ?? "—"} •{" "}
                          {item.type === "movie" ? "Movie" : "TV"}
                        </span>
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => toPlayer(router, item)}
                      aria-label={`Play ${item.title}`}
                    >
                      <Play className="size-4 fill-current" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        remove(item.id, item.type);
                        toast.success("Removed from watchlist", {
                          description: item.title,
                        });
                      }}
                      aria-label={`Remove ${item.title} from watchlist`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
