"use client";

import { useState } from "react";
import { MessageSquare, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountMyComments } from "../hooks/use-account";
import { useUser } from "../stores/user";
import { CommentCard } from "./comment-card";
import { TabEmpty, TabError, TabLoading } from "./account-states";

const SORTS = [
  { value: "latest", label: "Latest" },
  { value: "best-recent", label: "Top (recent)" },
] as const;

/** The signed-in user's comment history. */
export function CommentsTab() {
  const username = useUser((s) => s.username);
  const [sort, setSort] = useState<"latest" | "best-recent">("latest");
  const comments = useAccountMyComments(sort, username);

  if (comments.isLoading && !comments.data) {
    return <TabLoading rows={5} />;
  }
  if (comments.isError) {
    return (
      <TabError
        message={comments.error.message}
        onRetry={() => void comments.refetch()}
        icon={MessageSquare}
      />
    );
  }
  const items = comments.data?.comments ?? [];
  if (items.length === 0) {
    return (
      <TabEmpty
        icon={MessageSquareText}
        title="No comments yet"
        description="Join the conversation on any movie or show page — your comments will be collected here."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex justify-end">
        <div
          className="flex items-center rounded-full border border-border bg-card p-1"
          role="tablist"
          aria-label="Comment order"
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
      {items.map((c) => (
        <CommentCard key={c.id} comment={c} />
      ))}
    </div>
  );
}
