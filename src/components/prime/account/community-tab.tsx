"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentsFeedResponse } from "@/lib/account-client-types";
import { useAccount } from "../hooks/use-account";
import { CommentCard } from "./comment-card";
import { TabEmpty, TabError, TabLoading } from "./account-states";

const SORTS = [
  { value: "latest", label: "Latest" },
  { value: "best-recent", label: "Top (recent)" },
] as const;

/** Site-wide community comments feed (all members). */
export function CommunityTab() {
  const [sort, setSort] = useState<"latest" | "best-recent">("latest");
  const feed = useAccount<CommentsFeedResponse>("comments", { sort });

  if (feed.isLoading && !feed.data) {
    return <TabLoading rows={6} />;
  }
  if (feed.isError) {
    return (
      <TabError
        message={feed.error.message}
        onRetry={() => void feed.refetch()}
        icon={MessagesSquare}
      />
    );
  }
  const comments = feed.data?.comments ?? [];
  if (comments.length === 0) {
    return (
      <TabEmpty
        icon={MessagesSquare}
        title="No comments yet"
        description="Community chatter from across PrimeWire will appear here."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex justify-end">
        <div
          className="flex items-center rounded-full border border-border bg-card p-1"
          role="tablist"
          aria-label="Community comments order"
        >
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={sort === s.value}
              onClick={() => setSort(s.value)}
              className={cn(
                "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                sort === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {comments.map((c) => (
        <CommentCard key={c.id} comment={c} />
      ))}
    </div>
  );
}
