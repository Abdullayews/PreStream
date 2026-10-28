"use client";

import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAccountLinks } from "../hooks/use-account";
import { toDetail } from "../nav";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/** Streaming links the user has submitted to PrimeWire. */
export function LinksTab() {
  const router = useRouter();
  const links = useAccountLinks();

  if (links.isLoading && !links.data) {
    return <TabLoading rows={5} />;
  }
  if (links.isError) {
    return (
      <TabError
        message={links.error.message}
        onRetry={() => void links.refetch()}
        icon={Link2}
      />
    );
  }
  const items = links.data?.links ?? [];
  if (items.length === 0) {
    return (
      <TabEmpty
        icon={Link2}
        title="No links submitted"
        description="Share streaming links from any movie or show page on PrimeWire (“Add Link”) — your submissions and their stats appear here."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-2.5">
      {items.map((l) => {
        const m = /^\/(movie|tv)\/(\d+)-([^/?#]+)/.exec(l.showHref ?? "");
        return (
          <div
            key={l.id}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              {m ? (
                <button
                  type="button"
                  onClick={() => toDetail(router, { type: m[1], id: Number(m[2]), slug: m[3] })}
                  className="truncate font-semibold underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {l.showTitle ?? "Unknown show"}
                </button>
              ) : (
                <span className="truncate font-semibold">{l.showTitle ?? "Unknown show"}</span>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {l.episodeLabel && <span>{l.episodeLabel}</span>}
                {l.views != null && <span>{l.views.toLocaleString()} views</span>}
                {l.postedAgo && <span>{l.postedAgo}</span>}
              </div>
            </div>
            {l.quality && (
              <Badge variant="outline" className="rounded-full border-border">
                {l.quality}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
