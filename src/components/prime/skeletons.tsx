"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Full-page skeleton — Suspense fallback while search params resolve. */
export function PageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="sticky top-0 z-50 h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl" />
      <main className="flex-1">
        <Skeleton className="h-[70vh] max-h-[640px] min-h-[480px] w-full rounded-none" />
        <div className="shell space-y-10 pt-8">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </main>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <Skeleton className="h-5 w-1 rounded-full" />
        <Skeleton className="h-6 w-52" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[150px] shrink-0 sm:w-[170px] md:w-[190px]">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="mt-2.5 h-4 w-4/5" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Home view loading state — hero + three rows of cards. */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading home">
      <div className="relative h-[76vh] max-h-[760px] min-h-[520px] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1344px] flex-col gap-4 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12">
          <Skeleton className="h-3.5 w-40 rounded-full" />
          <Skeleton className="h-12 w-3/4 max-w-xl md:h-16" />
          <Skeleton className="h-4 w-56" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </div>
      <div className="shell space-y-10 py-8">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

/** Browse grid loading state — 24 poster cards. */
export function BrowseSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading results"
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="mt-2.5 h-4 w-4/5" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** TV schedule loading state — title, day pills + episode rows. */
export function ScheduleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading schedule">
      <div className="border-b border-border/60">
        <div className="shell py-4">
          <Skeleton className="h-8 w-48" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="shell space-y-2 py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Playlists grid loading state — poster cards with meta lines. */
export function PlaylistsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading playlists"
      className="shell py-8"
    >
      <Skeleton className="h-8 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
            <Skeleton className="mt-2.5 h-4 w-3/4" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Detail view loading state — hero band + content blocks. */
export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading title">
      <div className="h-[42vh] min-h-[320px] w-full" />
      <div className="shell">
        <div className="relative z-10 -mt-28 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Skeleton className="aspect-[2/3] w-[200px] shrink-0 rounded-xl md:w-[240px]" />
          <div className="flex-1 space-y-4 pb-4">
            <Skeleton className="h-10 w-3/4 md:h-14" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-48 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="hidden h-80 rounded-xl lg:block" />
        </div>
      </div>
    </div>
  );
}
