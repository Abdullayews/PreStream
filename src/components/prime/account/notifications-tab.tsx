"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountMutation, useAccountNotifications } from "../hooks/use-account";
import { TabEmpty, TabError, TabLoading } from "./account-states";
import { useRelogin } from "../stores/relogin";

/** Notifications inbox with a "clear all" action. */
export function NotificationsTab() {
  const notifications = useAccountNotifications();
  const clear = useAccountMutation<{ ok: boolean }>("notifications", {
    invalidates: [["account", "notifications"], ["account", "me"]],
  });
  useRelogin((s) => s.open); // keep guard reactive to session errors

  if (notifications.isLoading && !notifications.data) {
    return <TabLoading rows={5} />;
  }
  if (notifications.isError) {
    return (
      <TabError
        message={notifications.error.message}
        onRetry={() => void notifications.refetch()}
        icon={BellOff}
      />
    );
  }
  const items = notifications.data?.notifications ?? [];
  if (items.length === 0) {
    return (
      <TabEmpty
        icon={BellOff}
        title="No notifications"
        description="Friend requests, replies, votes and other activity on your PrimeWire account will be notified here."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() =>
            clear.mutate(
              { action: "clear" },
              {
                onSuccess: () => toast.success("Notifications cleared"),
                onError: (err) =>
                  toast.error("Couldn't clear notifications", {
                    description: err.message,
                  }),
              },
            )
          }
          disabled={clear.isPending}
        >
          <CheckCheck className="size-4" aria-hidden />
          Clear all
        </Button>
      </div>
      {notifications.isFetching && (
        <Skeleton className="h-14 w-full rounded-2xl" aria-hidden />
      )}
      {items.map((n) => {
        const content = (
          <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm leading-relaxed text-foreground/90">
            {n.body}
          </div>
        );
        return <div key={n.id}>{content}</div>;
      })}
    </div>
  );
}
