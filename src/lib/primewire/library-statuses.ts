/**
 * PrimeWire library statuses — the "tags" a show can carry in the user's
 * PrimeWire library (Watching / Plan to Watch / …). Shared by the detail
 * page tracker widget and the player's watch-sync panel so both write the
 * exact same vocabulary to the account.
 */
export const LIBRARY_STATUSES = [
  { value: "in-progress", label: "Watching" },
  { value: "plan-to-watch", label: "Plan to Watch" },
  { value: "watched", label: "Watched" },
  { value: "on-hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
] as const;

export type LibraryStatusValue = (typeof LIBRARY_STATUSES)[number]["value"];

export function libraryStatusLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return LIBRARY_STATUSES.find((s) => s.value === value)?.label ?? null;
}
