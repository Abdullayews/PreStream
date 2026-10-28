"use client";

import { UserPlus, Users } from "lucide-react";
import { avatarUrl } from "@/lib/account-client-types";
import { useAccountFriends } from "../hooks/use-account";
import { userHref } from "../nav";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/** Confirmed + unconfirmed PrimeWire friends. */
export function FriendsTab() {
  const friends = useAccountFriends();

  if (friends.isLoading && !friends.data) {
    return <TabLoading variant="grid" rows={6} />;
  }
  if (friends.isError) {
    return (
      <TabError
        message={friends.error.message}
        onRetry={() => void friends.refetch()}
        icon={Users}
      />
    );
  }
  const confirmed = friends.data?.confirmed ?? [];
  const unconfirmed = friends.data?.unconfirmed ?? [];
  if (confirmed.length === 0 && unconfirmed.length === 0) {
    return (
      <TabEmpty
        icon={UserPlus}
        title="No friends yet"
        description="Open any member's profile on PrimeWire and press “Add Friend” — your connections will show up here."
      />
    );
  }

  return (
    <div className="space-y-8">
      {confirmed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Friends · {confirmed.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {confirmed.map((f) => (
              <FriendCard key={f.username} username={f.username} avatar={f.avatar} />
            ))}
          </div>
        </section>
      )}
      {unconfirmed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Unconfirmed · {unconfirmed.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {unconfirmed.map((f) => (
              <FriendCard key={f.username} username={f.username} avatar={f.avatar} pending />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FriendCard({
  username,
  avatar,
  pending,
}: {
  username: string;
  avatar: string | null;
  pending?: boolean;
}) {
  const src = avatarUrl(avatar);
  return (
    <a
      href={userHref(username)}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">
            {username.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{username}</span>
        {pending && (
          <span className="text-[11px] font-medium text-muted-foreground">Pending</span>
        )}
      </span>
    </a>
  );
}
