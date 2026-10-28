"use client";

import { MessagesSquare } from "lucide-react";
import { useAccount, type AccountParams } from "../hooks/use-account";
import type { ForumIndexResponse } from "@/lib/account-client-types";
import { forumHref } from "../nav";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/**
 * Forum index inside the account hub — links out to the full ?view=forum
 * experience (categories → threads → posts + replies).
 */
export function ForumTab() {
  const forum = useAccount<ForumIndexResponse>("forum");

  if (forum.isLoading && !forum.data) {
    return <TabLoading rows={6} />;
  }
  if (forum.isError) {
    return (
      <TabError
        message={forum.error.message}
        onRetry={() => void forum.refetch()}
        icon={MessagesSquare}
      />
    );
  }

  const categories = forum.data?.categories ?? [];
  const latest = categories
    .flatMap((c) => c.threads.map((t) => ({ ...t, category: c.name })))
    .slice(0, 10);

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Boards · {categories.length}
          </h2>
          <a
            href={forumHref()}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open the forum →
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <a
              key={c.id}
              href={forumHref({ category: c.id })}
              className="rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="font-semibold">{c.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.threads.length > 0 ? `${c.threads.length} live threads` : "Open board"}
              </p>
            </a>
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest threads
          </h2>
          <div className="space-y-2">
            {latest.map((t) => (
              <a
                key={t.id}
                href={forumHref({ thread: t.id })}
                className="block rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="truncate font-medium">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.category}
                  {t.author ? ` · by ${t.author}` : ""}
                  {t.lastPostAgo ? ` · ${t.lastPostAgo}` : ""}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export type { AccountParams };
