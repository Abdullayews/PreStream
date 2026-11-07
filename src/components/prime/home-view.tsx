"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
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
  "trending-today": "Top 10 today",
  "popular-week": "Hot this week",
  "just-added-movies": "Fresh off the reel",
  "new-tv": "New series alert",
  "top-rated": "The all-time greats",
  "in-theaters": "On the big screen",
  action: "Adrenaline rush",
  comedy: "The laugh factory",
};

/** Home: full-bleed cinematic hero + editorial catalog shelves. */
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-7 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Couldn&apos;t reach PrimeWire
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
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
      <div className="shell space-y-10 py-10 sm:space-y-12">
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
  );
}
