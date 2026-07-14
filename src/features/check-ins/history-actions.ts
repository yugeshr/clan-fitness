"use server";

import { getOrSyncCurrentUser } from "@/lib/current-user";
import { userDayKey } from "@/lib/timezone-date";
import { getUserCheckInHistory, type CheckInHistoryRow } from "./queries";
import type { CheckInType } from "./types";

export type HistoryRange = "7d" | "30d" | "90d" | "all";
export type HistoryDayGroup = { dayKey: string; entries: CheckInHistoryRow[] };

function rangeStart(range: HistoryRange, now: Date): Date | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// getUserCheckInHistory's own trim already guarantees a day never splits across a page's
// boundary, so grouping consecutive same-day rows here (rather than merging across separate
// "Load more" calls) is safe — each day appears in exactly one page, never partially in two.
function groupByDay(rows: CheckInHistoryRow[], timezone: string | null): HistoryDayGroup[] {
  const groups: HistoryDayGroup[] = [];
  for (const row of rows) {
    const dayKey = userDayKey(timezone, row.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) last.entries.push(row);
    else groups.push({ dayKey, entries: [row] });
  }
  return groups;
}

// Powers the profile History section — both its initial server-render and every client-side
// filter change / "Load more" call this same action, so there's one code path for both
// (getOrSyncCurrentUser is request-deduped, so calling it again server-side costs nothing extra).
export async function getFilteredHistory(type: CheckInType | "all", range: HistoryRange, before?: string) {
  const user = await getOrSyncCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const { rows, hasMore } = await getUserCheckInHistory(
    user.id,
    {
      type: type === "all" ? undefined : type,
      start: rangeStart(range, new Date()),
      before: before ? new Date(before) : undefined,
    },
    user.timezone,
  );

  return { days: groupByDay(rows, user.timezone), hasMore };
}
