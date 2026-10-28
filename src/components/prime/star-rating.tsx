"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Five-star rating display (0–5 scale) in crisp monochrome —
 * filled foreground stars with a clipped overlay for fractional values.
 *
 * The fill overlay clips a NON-SHRINKING copy of the star row: the inner
 * row is `w-max` and every star `shrink-0`, so each filled star sits at
 * exactly the same x/width as its outline twin and the fraction clips
 * cleanly mid-star. (Without this, flex shrinking squeezes the filled
 * row — stars render ~11% narrower and drift progressively left of
 * their outlines.)
 */
export function StarRating({
  value,
  votes,
  size = "sm",
  showValue = false,
  className,
}: {
  /** 0–5 (fractional values supported, e.g. 4.3) */
  value: number;
  /** Optional vote count, rendered as "(123 votes)" */
  votes?: number | null;
  size?: "sm" | "md";
  /** Render the numeric value (e.g. "4.5") right after the stars */
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;
  const iconClass = size === "md" ? "size-5" : "size-4";

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${
        votes != null ? ` by ${votes} votes` : ""
      }`}
    >
      <span className="relative inline-flex leading-none">
        {/* empty track */}
        <span className="flex gap-0.5 text-muted-foreground/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(iconClass, "shrink-0")} aria-hidden />
          ))}
        </span>
        {/* filled overlay, clipped to the rating fraction */}
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <span className="flex w-max gap-0.5 text-foreground">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(iconClass, "shrink-0 fill-foreground")}
              />
            ))}
          </span>
        </span>
      </span>
      {showValue && (
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {clamped.toFixed(1)}
        </span>
      )}
      {votes != null && (
        <span className="text-xs text-muted-foreground">({votes} votes)</span>
      )}
    </span>
  );
}
