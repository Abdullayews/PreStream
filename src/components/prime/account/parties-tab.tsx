"use client";

import { PartyPopper, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "../hooks/use-account";
import type { PartiesResponse } from "@/lib/account-client-types";
import { TabEmpty, TabError, TabLoading } from "./account-states";
import { PRIMARY_MIRROR } from "@/lib/primewire/mirrors";

/** Active PrimeWire watch parties — synced viewing rooms. */
export function PartiesTab() {
  const parties = useAccount<PartiesResponse>("parties");

  if (parties.isLoading && !parties.data) {
    return <TabLoading rows={4} />;
  }
  if (parties.isError) {
    return (
      <TabError
        message={parties.error.message}
        onRetry={() => void parties.refetch()}
        icon={PartyPopper}
      />
    );
  }
  const items = parties.data?.parties ?? [];
  if (items.length === 0) {
    return (
      <TabEmpty
        icon={PartyPopper}
        title="No watch parties right now"
        description={`Watch parties are synced viewing rooms on PrimeWire. Start one from any streaming link on ${PRIMARY_MIRROR.replace("https://", "")}, or check back later to join an open party.`}
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      {items.map((p) => (
        <div
          key={p.code}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-foreground/5">
            <Users className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name ?? `Party ${p.code}`}</p>
            <p className="text-xs text-muted-foreground">Watch party</p>
          </div>
          <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {p.members != null ? `${p.members} watching` : "Active"}
          </span>
        </div>
      ))}
    </div>
  );
}
