"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PwComment } from "@/lib/account-client-types";
import { useAccount, useAccountMutation } from "../hooks/use-account";
import { useUser } from "../stores/user";
import { CommentCard } from "../account/comment-card";
import { TabEmpty, TabError, TabLoading } from "../account/account-states";

interface CommentsSectionResponse {
  comments: PwComment[];
}

/**
 * The comments tree for one show (loaded via /comments/section) plus the
 * post form (top-level or reply) with spoiler + review toggles.
 */
export function CommentsSection({
  showId,
  showTitle,
}: {
  showId: number;
  showTitle: string;
}) {
  const apiKey = useUser((s) => s.apiKey);
  const comments = useAccount<CommentsSectionResponse>("comments", {
    type: "show",
    id: showId,
  });

  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [review, setReview] = useState(false);
  const [replyTo, setReplyTo] = useState<PwComment | null>(null);

  const post = useAccountMutation<{ ok: boolean }>("comments", {
    invalidates: [["account", "comments"]],
  });

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Sign in with your PrimeWire account to read and post comments.
      </div>
    );
  }

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    post.mutate(
      {
        action: "create",
        showId,
        parentId: replyTo?.id,
        body: text,
        spoiler,
        review,
      },
      {
        onSuccess: () => {
          toast.success(replyTo ? "Reply posted" : "Comment posted", {
            description:
              "New comments may take a moment to appear — PrimeWire reviews posts from newer accounts.",
          });
          setBody("");
          setSpoiler(false);
          setReview(false);
          setReplyTo(null);
        },
        onError: (err) =>
          toast.error("Couldn't post the comment", { description: err.message }),
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* form */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquarePlus className="size-4" aria-hidden />
          {replyTo ? (
            <>
              Reply to {replyTo.author ?? "comment"}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </>
          ) : (
            `Comment on ${showTitle}`
          )}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts — markdown works…"
          rows={3}
          maxLength={8000}
          className="mt-3 resize-none rounded-xl bg-background/60 text-sm"
          aria-label="Comment body"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={spoiler}
                onCheckedChange={(v) => setSpoiler(v === true)}
                aria-label="Mark as spoiler"
              />
              Contains spoilers
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={review}
                onCheckedChange={(v) => setReview(v === true)}
                aria-label="Mark as review"
              />
              Review
            </label>
          </div>
          <Button
            className="rounded-full"
            size="sm"
            onClick={submit}
            disabled={post.isPending || !body.trim()}
          >
            {post.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            {replyTo ? "Reply" : "Post comment"}
          </Button>
        </div>
      </div>

      {/* tree */}
      {comments.isLoading && !comments.data ? (
        <TabLoading rows={3} />
      ) : comments.isError ? (
        <TabError
          message={comments.error.message}
          onRetry={() => void comments.refetch()}
        />
      ) : (comments.data?.comments ?? []).length === 0 ? (
        <TabEmpty
          icon={MessageSquarePlus}
          title="No comments yet"
          description="Be the first to share what you think about this title."
        />
      ) : (
        <div className="space-y-3">
          {(comments.data?.comments ?? []).map((c) => (
            <CommentCard key={c.id} comment={c} onReply={setReplyTo} />
          ))}
        </div>
      )}
    </div>
  );
}
