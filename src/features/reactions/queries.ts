import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { reactions } from "@/db/schema";
import type { ReactionSummary } from "./types";

export async function getReactionsForCheckIns(
  checkInIds: string[],
  currentUserId: string,
): Promise<Record<string, ReactionSummary>> {
  const summaries: Record<string, ReactionSummary> = {};
  if (checkInIds.length === 0) return summaries;

  const rows = await db
    .select({ checkInId: reactions.checkInId, emoji: reactions.emoji, userId: reactions.userId })
    .from(reactions)
    .where(inArray(reactions.checkInId, checkInIds));

  for (const row of rows) {
    const summary = (summaries[row.checkInId] ??= {});
    const entry = (summary[row.emoji] ??= { count: 0, reactedByMe: false });
    entry.count++;
    if (row.userId === currentUserId) entry.reactedByMe = true;
  }

  return summaries;
}
