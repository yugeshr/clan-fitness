import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { reactions } from "@/db/schema";
import type { ReactionSummary } from "./types";

export async function getReactionsForCheckIns(checkInIds: string[], currentUserId: string) {
  const summaries = new Map<string, ReactionSummary>();
  if (checkInIds.length === 0) return summaries;

  const rows = await db
    .select({ checkInId: reactions.checkInId, emoji: reactions.emoji, userId: reactions.userId })
    .from(reactions)
    .where(inArray(reactions.checkInId, checkInIds));

  for (const row of rows) {
    if (!summaries.has(row.checkInId)) summaries.set(row.checkInId, new Map());
    const summary = summaries.get(row.checkInId)!;
    const entry = summary.get(row.emoji) ?? { count: 0, reactedByMe: false };
    entry.count++;
    if (row.userId === currentUserId) entry.reactedByMe = true;
    summary.set(row.emoji, entry);
  }

  return summaries;
}
