"use client";

import { useState } from "react";
import {
  Ban,
  CircleUserRound,
  Eye,
  Gift,
  Loader2,
  Mail,
  MapPin,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { avatarUrl, type ProfileResponse } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { useAccount, useAccountMutation } from "./hooks/use-account";
import { toAccount, toUser } from "./nav";
import { SectionTitle } from "./section-title";
import { TabError, TabLoading } from "./account/account-states";
import { useUser } from "./stores/user";

/**
 * Public PrimeWire member profile (?view=user&name=…): avatar, stats,
 * about/hobbies, social actions (friend / block / message) and the wall.
 */
export function UserProfileView({ name }: { name: string | null }) {
  const router = useRouter();
  const valid = !!name && name.trim().length > 0 && name.length <= 40;
  const myUsername = useUser((s) => s.username);
  const [messageOpen, setMessageOpen] = useState(false);

  const profile = useAccount<ProfileResponse>(
    "profile",
    { name: name ?? "" },
    { enabled: valid },
  );

  const friendAction = useAccountMutation<{ ok: boolean }>("friends", {
    invalidates: [["account", "friends"]],
  });

  if (!valid) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <CircleUserRound className="size-10 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Pick a member from comments, friends or forum posts to open their profile.
        </p>
      </div>
    );
  }

  if (profile.isLoading && !profile.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <TabLoading rows={4} />
      </div>
    );
  }
  if (profile.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <TabError
          message={profile.error.message}
          onRetry={() => void profile.refetch()}
          icon={CircleUserRound}
        />
      </div>
    );
  }

  const user = profile.data?.profile;
  if (!user) return null;

  const isSelf = myUsername === user.username;
  const actionId = user.userIdForActions ?? user.userId;

  const addFriend = () => {
    if (!actionId) return;
    friendAction.mutate(
      { action: "add", userId: actionId },
      {
        onSuccess: () => toast.success(`Friend request sent to ${user.username}`),
        onError: (err) =>
          toast.error("Couldn't send the request", { description: err.message }),
      },
    );
  };

  const block = () => {
    if (!actionId) return;
    if (!window.confirm(`Block ${user.username}? They won't be able to message or follow you.`)) return;
    friendAction.mutate(
      { action: "block", userId: actionId },
      {
        onSuccess: () => toast.success(`${user.username} blocked`),
        onError: (err) => toast.error("Couldn't block", { description: err.message }),
      },
    );
  };

  const avatarSrc = avatarUrl(user.avatar);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 sm:px-6">
      {/* head */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 sm:size-28">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={`${user.username}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <CircleUserRound className="size-12 text-muted-foreground/60" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <SectionTitle as="h1" className="truncate text-2xl sm:text-3xl">
            {user.username}
          </SectionTitle>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <MetaChip>
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  user.online ? "bg-foreground" : "bg-muted-foreground/40",
                )}
              />
              {user.online ? "Online" : "Offline"}
            </MetaChip>
            {user.gender && <MetaChip>{user.gender}</MetaChip>}
            {user.from && (
              <MetaChip>
                <MapPin className="size-3" aria-hidden />
                {user.from}
              </MetaChip>
            )}
            {user.joined && <MetaChip>Joined {user.joined}</MetaChip>}
            {user.profileViews != null && (
              <MetaChip>
                <Eye className="size-3" aria-hidden />
                {user.profileViews.toLocaleString()} views
              </MetaChip>
            )}
            {user.kudos != null && (
              <MetaChip>
                <Gift className="size-3" aria-hidden />
                {user.kudos.toLocaleString()} kudos
              </MetaChip>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      {!isSelf && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={() => setMessageOpen(true)}>
            <Send className="size-4" aria-hidden />
            Message
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={addFriend}
            disabled={friendAction.isPending || !actionId}
          >
            {friendAction.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <UserPlus className="size-4" aria-hidden />
            )}
            Add Friend
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => toAccount(router, "friends")}
          >
            <Users className="size-4" aria-hidden />
            Friends
          </Button>
          <Button
            variant="outline"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={block}
            disabled={friendAction.isPending || !actionId}
          >
            <Ban className="size-4" aria-hidden />
            Block
          </Button>
        </div>
      )}

      {/* about / hobbies */}
      {(user.about || user.hobbies) && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {user.about && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {user.about}
              </p>
            </div>
          )}
          {user.hobbies && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hobbies
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {user.hobbies}
              </p>
            </div>
          )}
        </div>
      )}

      {/* wall */}
      <WallSection username={user.username} userId={user.userIdForActions ?? user.userId} wall={user.wall} />

      {/* DM dialog */}
      <MessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        username={user.username}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wall                                                                */
/* ------------------------------------------------------------------ */

function WallSection({
  username,
  userId,
  wall,
}: {
  username: string;
  userId: number | null;
  wall: ProfileResponse["profile"]["wall"];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const post = useAccountMutation<{ ok: boolean }>("wall", {
    invalidates: [["account", "profile"]],
  });

  const submit = () => {
    const text = body.trim();
    if (!text || !userId) return;
    post.mutate(
      { toUserId: userId, body: text },
      {
        onSuccess: () => {
          toast.success(`Posted on ${username}'s wall`);
          setBody("");
        },
        onError: (err) =>
          toast.error("Couldn't post to the wall", { description: err.message }),
      },
    );
  };

  return (
    <section aria-label={`${username}'s wall`} className="mt-10">
      <SectionTitle className="mb-4">Wall</SectionTitle>

      {userId && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Say something to ${username}… (markdown works)`}
            rows={3}
            maxLength={4000}
            className="resize-none rounded-xl bg-background/60 text-sm"
            aria-label={`Write on ${username}'s wall`}
          />
          <div className="mt-3 flex justify-end">
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
              Post
            </Button>
          </div>
        </div>
      )}

      {wall.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No wall posts yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {wall.map((entry) => {
            const src = avatarUrl(entry.authorAvatar);
            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-border/60 bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {src ? (
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {(entry.author ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 text-xs text-muted-foreground">
                    {entry.author ? (
                      <button
                        type="button"
                        className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        onClick={() => toUser(router, entry.author!)}
                      >
                        {entry.author}
                      </button>
                    ) : (
                      <span className="font-semibold text-foreground">Unknown</span>
                    )}
                    {entry.postedAgo && <span> · {entry.postedAgo}</span>}
                  </div>
                </div>
                <div
                  className="mt-2.5 text-sm leading-relaxed break-words text-foreground/90 [&_a]:underline [&_p+p]:mt-2"
                  dangerouslySetInnerHTML={{ __html: entry.body }}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* DM dialog                                                           */
/* ------------------------------------------------------------------ */

function MessageDialog({
  open,
  onOpenChange,
  username,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}) {
  const [body, setBody] = useState("");
  const send = useAccountMutation<{ ok: boolean }>("messages");

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate(
      { toName: username, body: text },
      {
        onSuccess: () => {
          toast.success(`Message sent to ${username}`);
          setBody("");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error("Couldn't send the message", { description: err.message }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden />
            Message {username}
          </DialogTitle>
          <DialogDescription>
            This sends a private PrimeWire message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="profile-dm-body" className="sr-only">
            Message body
          </Label>
          <Textarea
            id="profile-dm-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={5}
            maxLength={8000}
          />
        </div>
        <DialogFooter>
          <Button className="rounded-full" onClick={submit} disabled={send.isPending || !body.trim()}>
            {send.isPending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}
