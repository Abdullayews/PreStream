"use client";

import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading / error / empty states for the account hub tabs —
 * keeps every tab consistent with the Shiopa monochrome language.
 */

export function TabLoading({
  variant = "list",
  rows = 6,
  className,
}: {
  variant?: "list" | "grid" | "schedule";
  rows?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={cn("py-2", className)}
    >
      {variant === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
              <Skeleton className="mt-2.5 h-4 w-3/4" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : variant === "schedule" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  );
}

export function TabError({
  message,
  onRetry,
  icon: Icon = TriangleAlert,
}: {
  message: string;
  onRetry: () => void;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="size-7 text-destructive" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Couldn&apos;t load this section
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <Button className="rounded-full" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function TabEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button className="rounded-full" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
