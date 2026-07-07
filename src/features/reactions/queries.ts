import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reactions, users } from "@/db/schema";
import type { ReactionSummary } from "./types";

export async function getReactionsForCheckIns(
  checkInIds: string[],
  currentUserId: string,
): Promise<Record<string, ReactionSummary>> {
  const summaries: Record<string, ReactionSummary> = {};
  if (checkInIds.length === 0) return summaries;

  const rows = await db
    .select({
      checkInId: reactions.checkInId,
      emoji: reactions.emoji,
      userId: reactions.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(reactions)
    .innerJoin(users, eq(reactions.userId, users.id))
    .where(inArray(reactions.checkInId, checkInIds));

  for (const row of rows) {
    const summary = (summaries[row.checkInId] ??= {});
    const entry = (summary[row.emoji] ??= { reactedByMe: false, users: [] });
    entry.users.push({ id: row.userId, name: row.userName, avatarUrl: row.userAvatarUrl });
    if (row.userId === currentUserId) entry.reactedByMe = true;
  }

  return summaries;
}
