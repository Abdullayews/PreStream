"use client";

import { Newspaper } from "lucide-react";
import { useAccountFeed } from "../hooks/use-account";
import { CommentCard } from "./comment-card";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/** The user's activity feed — recent comments and interactions. */
export function FeedTab() {
  const feed = useAccountFeed();

  if (feed.isLoading && !feed.data) {
    return <TabLoading rows={5} />;
  }
  if (feed.isError) {
    return (
      <TabError
        message={feed.error.message}
        onRetry={() => void feed.refetch()}
        icon={Newspaper}
      />
    );
  }
  const comments = feed.data?.comments ?? [];
  if (comments.length === 0) {
    return (
      <TabEmpty
        icon={Newspaper}
        title="Your feed is quiet"
        description="Comments, replies and votes from around PrimeWire will show up here as you and the community interact."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      {comments.map((c) => (
        <CommentCard key={c.id} comment={c} />
      ))}
    </div>
  );
}
