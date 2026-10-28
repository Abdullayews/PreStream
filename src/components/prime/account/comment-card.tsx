"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PwComment } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { useAccountMutation } from "../hooks/use-account";
import { toDetail, toUser } from "../nav";

/** Internal detail link for a /movie/… or /tv/… PrimeWire path. */
function parseInternalHref(href: string): {
  type: string;
  id: number;
  slug: string;
} | null {
  const m = /^\/(movie|tv)\/(\d+)-([^/?#]+)/.exec(href);
  if (!m) return null;
  return { type: m[1], id: Number(m[2]), slug: m[3] };
}

/**
 * One PrimeWire comment — author, points, rendered body, context link and
 * up/down votes. Nested replies render recursively, indented.
 * Used by the Feed and Comments tabs (and later detail pages).
 */
export function CommentCard({
  comment,
  depth = 0,
  onReply,
}: {
  comment: PwComment;
  depth?: number;
  /** When provided (detail pages), renders a Reply button that selects this comment. */
  onReply?: (comment: PwComment) => void;
}) {
  const router = useRouter();
  const vote = useAccountMutation<{ ok?: boolean; score?: number }>("comments", {
    invalidates: [
      ["account", "comments"],
      ["account", "feed"],
    ],
  });

  const castVote = (direction: "up" | "down") => {
    // clicking the active arrow again → "none" (unvote)
    const next = comment.voted === direction ? "none" : direction;
    vote.mutate(
      { action: "vote", commentId: comment.id, direction: next },
      {
        onError: (err) =>
          toast.error("Couldn't register the vote", { description: err.message }),
      },
    );
  };

  const internal = comment.contextHref
    ? parseInternalHref(comment.contextHref)
    : null;

  const openContext = () => {
    if (internal) toDetail(router, internal);
  };

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4",
        depth > 0 && "border-border/40 bg-card/60",
      )}
    >
      {/* tagline */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
        {comment.author ? (
          <button
            type="button"
            onClick={() => toUser(router, comment.author!)}
            className="rounded font-semibold text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {comment.author}
          </button>
        ) : (
          <span className="font-semibold text-foreground">Unknown</span>
        )}
        {comment.postedAgo && (
          <>
            <span aria-hidden className="text-muted-foreground/40">
              •
            </span>
            <span>{comment.postedAgo}</span>
          </>
        )}
        {comment.points != null && (
          <>
            <span aria-hidden className="text-muted-foreground/40">
              •
            </span>
            <span className="rounded-full bg-foreground/5 px-2 py-0.5 font-medium">
              {comment.points} {Math.abs(comment.points) === 1 ? "point" : "points"}
            </span>
          </>
        )}
      </div>

      {/* body — server-sanitised markdown HTML */}
      <div
        className="mt-2.5 text-sm leading-relaxed break-words text-foreground/90 [&_a]:text-foreground [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-foreground/5 [&_code]:px-1 [&_em]:italic [&_p+p]:mt-2.5 [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: comment.body }}
      />

      {/* context + votes */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {comment.context ? (
            internal ? (
              <button
                type="button"
                onClick={openContext}
                className="flex min-w-0 items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate">{comment.context}</span>
              </button>
            ) : (
              <span className="truncate rounded-full bg-foreground/5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                {comment.context}
              </span>
            )
          ) : null}
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reply
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <VoteButton
            direction="up"
            active={comment.voted === "up"}
            disabled={vote.isPending}
            onClick={() => castVote("up")}
            label={`Upvote comment by ${comment.author ?? "unknown"}`}
          />
          <VoteButton
            direction="down"
            active={comment.voted === "down"}
            disabled={vote.isPending}
            onClick={() => castVote("down")}
            label={`Downvote comment by ${comment.author ?? "unknown"}`}
          />
        </div>
      </div>

      {/* nested replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-border/60 pl-3 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </article>
  );
}

function VoteButton({
  direction,
  active,
  disabled,
  onClick,
  label,
}: {
  direction: "up" | "down";
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? `Remove ${label}` : label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        disabled && "opacity-50",
      )}
    >
      <Icon className={cn("size-4", active && "fill-current")} aria-hidden />
    </button>
  );
}
