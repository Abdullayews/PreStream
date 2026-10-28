"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessagesSquare,
  Send,
  StickyNote,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { avatarUrl, type ForumIndexResponse, type ForumThreadPage } from "@/lib/account-client-types";
import { useAccount, useAccountMutation } from "./hooks/use-account";
import { forumHref, toForum } from "./nav";
import { SectionTitle } from "./section-title";
import { TabEmpty, TabError, TabLoading } from "./account/account-states";
import { useUser } from "./stores/user";

/**
 * The PrimeWire forum (?view=forum): index of categories → threads in a
 * category → a thread with posts and a reply box. All real PrimeWire data.
 */
export function ForumView({
  category,
  thread,
}: {
  category: string | null;
  thread: string | null;
}) {
  const threadId = thread && /^\d+$/.test(thread) ? parseInt(thread, 10) : null;
  const categoryId = category && /^\d+$/.test(category) ? parseInt(category, 10) : null;

  if (threadId != null) return <ThreadPage threadId={threadId} />;
  if (categoryId != null) return <CategoryPage categoryId={categoryId} />;
  return <ForumIndex />;
}

/* ------------------------------------------------------------------ */
/* Index                                                               */
/* ------------------------------------------------------------------ */

function ForumIndex() {
  const router = useRouter();
  const index = useAccount<ForumIndexResponse>("forum");

  if (index.isLoading && !index.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabLoading rows={6} />
      </div>
    );
  }
  if (index.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabError
          message={index.error.message}
          onRetry={() => void index.refetch()}
          icon={MessagesSquare}
        />
      </div>
    );
  }

  const categories = index.data?.categories ?? [];
  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabEmpty
          icon={MessagesSquare}
          title="Forum unavailable"
          description="The PrimeWire forum could not be loaded right now — try again shortly."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
      <SectionTitle as="h1" className="text-2xl sm:text-3xl">
        Forum
      </SectionTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        The official PrimeWire community boards.
      </p>

      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toForum(router, { category: c.id })}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block font-semibold">{c.name}</span>
              {c.description && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {c.description}
                </span>
              )}
            </span>
            {c.threads.length > 0 && (
              <Badge variant="secondary" className="shrink-0 rounded-full font-normal">
                {c.threads.length} live threads
              </Badge>
            )}
          </button>
        ))}
      </div>

      {categories.some((c) => c.threads.length > 0) && (
        <section className="mt-10" aria-label="Latest threads">
          <SectionTitle className="mb-4 text-lg">Latest Threads</SectionTitle>
          <div className="space-y-2">
            {categories
              .flatMap((c) => c.threads.map((t) => ({ ...t, category: c.name })))
              .slice(0, 12)
              .map((t) => (
                <ThreadRow key={t.id} thread={t} meta={t.category} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Category                                                            */
/* ------------------------------------------------------------------ */

function CategoryPage({ categoryId }: { categoryId: number }) {
  const router = useRouter();
  const category = useAccount<{ category: ForumIndexResponse["categories"][number] }>(
    "forum",
    { category: categoryId },
  );

  if (category.isLoading && !category.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabLoading rows={6} />
      </div>
    );
  }
  if (category.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabError
          message={category.error.message}
          onRetry={() => void category.refetch()}
          icon={MessagesSquare}
        />
      </div>
    );
  }

  const cat = category.data?.category;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
      <BackRow label="All boards" onClick={() => toForum(router)} />
      <SectionTitle as="h1" className="text-2xl sm:text-3xl">
        {cat?.name ?? "Forum"}
      </SectionTitle>

      <div className="mt-6 space-y-2">
        {(cat?.threads ?? []).map((t) => (
          <ThreadRow key={t.id} thread={t} />
        ))}
        {(cat?.threads ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No threads in this board yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  meta,
}: {
  thread: ForumIndexResponse["categories"][number]["threads"][number];
  meta?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => toForum(router, { thread: thread.id })}
      className="flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{thread.title}</span>
          {thread.title.startsWith("Sticky") && (
            <StickyNote className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {meta ? `${meta} · ` : ""}
          {thread.author ? `by ${thread.author}` : ""}
          {thread.lastPostAgo ? ` · last post ${thread.lastPostAgo}` : ""}
        </span>
      </span>
      {thread.replies != null && (
        <Badge variant="secondary" className="shrink-0 rounded-full font-normal">
          {thread.replies} {thread.replies === 1 ? "reply" : "replies"}
        </Badge>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Thread                                                              */
/* ------------------------------------------------------------------ */

function ThreadPage({ threadId }: { threadId: number }) {
  const router = useRouter();
  const apiKey = useUser((s) => s.apiKey);
  const [body, setBody] = useState("");
  const thread = useAccount<{ thread: ForumThreadPage["thread"]; posts: ForumThreadPage["posts"] }>(
    "forum",
    { thread: threadId },
  );
  const reply = useAccountMutation<{ ok: boolean }>("forum", {
    invalidates: [["account", "forum"]],
  });

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    reply.mutate(
      { threadId, body: text },
      {
        onSuccess: () => {
          toast.success("Reply posted");
          setBody("");
        },
        onError: (err) =>
          toast.error("Couldn't post the reply", { description: err.message }),
      },
    );
  };

  if (thread.isLoading && !thread.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabLoading rows={5} />
      </div>
    );
  }
  if (thread.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
        <TabError
          message={thread.error.message}
          onRetry={() => void thread.refetch()}
          icon={MessagesSquare}
        />
      </div>
    );
  }

  const data = thread.data;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
      <BackRow label="Board" onClick={() => (window.history.length > 1 ? router.back() : toForum(router))} />
      <SectionTitle as="h1" className="text-2xl sm:text-3xl">
        {data?.thread.title ?? "Thread"}
      </SectionTitle>

      <div className="mt-6 space-y-3">
        {(data?.posts ?? []).map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {avatarUrl(post.avatar) ? (
                  <img
                    src={avatarUrl(post.avatar) as string}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold">
                    {(post.author ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="font-semibold text-foreground">
                {post.author ?? "Unknown"}
              </span>
              {post.postedAgo && <span>· {post.postedAgo}</span>}
            </div>
            <div
              className="mt-2.5 text-sm leading-relaxed break-words text-foreground/90 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-foreground/5 [&_code]:px-1 [&_p+p]:mt-2.5"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </article>
        ))}
      </div>

      {apiKey && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a reply… (markdown works)"
            rows={4}
            maxLength={20000}
            className="resize-none rounded-xl bg-background/60 text-sm"
            aria-label="Reply body"
          />
          <div className="mt-3 flex justify-end">
            <Button
              className="rounded-full"
              size="sm"
              onClick={submit}
              disabled={reply.isPending || !body.trim()}
            >
              {reply.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Back to ${label}`}
      className="glass mb-6 flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-5" aria-hidden />
      {label}
    </button>
  );
}
