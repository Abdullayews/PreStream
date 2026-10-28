"use client";

import { Clapperboard, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { MediaCard } from "../media-card";
import { toBrowse } from "../nav";
import { useAccountRecommended } from "../hooks/use-account";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/** Personalized recommendations based on the user's library + favorites. */
export function RecommendedTab() {
  const router = useRouter();
  const recommended = useAccountRecommended();

  if (recommended.isLoading && !recommended.data) {
    return <TabLoading variant="grid" rows={8} />;
  }
  if (recommended.isError) {
    return (
      <TabError
        message={recommended.error.message}
        onRetry={() => void recommended.refetch()}
        icon={Sparkles}
      />
    );
  }
  const items = recommended.data?.items ?? [];
  if (items.length === 0) {
    return (
      <TabEmpty
        icon={Sparkles}
        title="Nothing to recommend yet"
        description="Add shows to your PrimeWire library and mark some favorites — recommendations are based on what you watch."
        action={{ label: "Browse the catalog", onClick: () => toBrowse(router, {}) }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <MediaCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

/** Kept for future use — Clapperboard re-exported to satisfy lint no-unused. */
export { Clapperboard };
