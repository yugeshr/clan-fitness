"use server";

import { auth } from "@clerk/nextjs/server";
import { getCommentsForCheckIns } from "@/features/comments";
import { getClanFeed } from "@/features/check-ins";
import { getClanMembership } from "@/features/clans";
import { getReactionsForCheckIns } from "@/features/reactions";

export async function loadMoreFeed(clanId: string, beforeIso: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in.");

  // Authorization and the data fetch don't depend on each other — run them concurrently, but
  // still gate the return on membership so an unauthorized caller never sees the fetched rows.
  const [membership, feed] = await Promise.all([
    getClanMembership(userId, clanId),
    getClanFeed(clanId, new Date(beforeIso)),
  ]);
  if (!membership) throw new Error("Not a member of this clan.");

  const { rows, hasMore } = feed;
  const checkInIds = rows.map((row) => row.checkIn.id);
  const [reactions, comments] = await Promise.all([
    getReactionsForCheckIns(checkInIds, clanId, userId),
    getCommentsForCheckIns(checkInIds, clanId),
  ]);

  return { rows, reactions, comments, hasMore };
}
