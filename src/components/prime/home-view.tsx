"use client";

import { useEffect } from "react";
import { AlertCircle, Popcorn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "./hero-carousel";
import { useHome } from "./hooks/use-primewire";
import { MediaRow } from "./media-row";
import { HomeSkeleton } from "./skeletons";


/**
 * Editorial titles for the home shelves — curated, personality-driven
 * names keyed by the row definitions in the home API.
 */
const EDITORIAL_TITLES: Record<string, string> = {
  "trending-today": "Everyone's Watching",
  "popular-week": "Hot This Week",
  "just-added-movies": "Fresh Off the Reel",
  "new-tv": "New Series Alert",
  "top-rated": "The All-Time Greats",
  "in-theaters": "On the Big Screen",
  action: "Adrenaline Rush",
  comedy: "The Laugh Factory",
};

/** Home: cinematic hero + editorial catalog shelves. */
export function HomeView() {
  const { data, isLoading, isError, error } = useHome();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load data — please try again", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [isError, error]);

  if (isLoading) return <HomeSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="size-7 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Couldn&apos;t reach PrimeWire
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the catalog."}
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["primewire", "home"] })
          }
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <HeroCarousel items={data.hero} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* editorial intro strip — one quiet line welcoming the viewer */}
        <div className="flex items-center gap-3 border-b border-border/50 pb-5 pt-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Popcorn className="size-4 text-primary" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              Tonight&apos;s stage
            </span>{" "}
            — shelves refresh live from the PrimeWire catalog. Press{" "}
            <kbd className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground/80">
              Ctrl K
            </kbd>{" "}
            to search everything.
          </p>
        </div>

        <div className="space-y-12 py-10">
          {data.rows.map((row) => (
            <MediaRow
              key={row.key}
              title={EDITORIAL_TITLES[row.key] ?? row.title}
              items={row.items}
              params={row.params}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
