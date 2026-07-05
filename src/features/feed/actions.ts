"use server";

import { auth } from "@clerk/nextjs/server";
import { FEED_PAGE_SIZE, getClanFeed } from "@/features/check-ins";
import { getClanMembership } from "@/features/clans";
import { getReactionsForCheckIns } from "@/features/reactions";

export async function loadMoreFeed(clanId: string, beforeIso: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in.");

  const membership = await getClanMembership(userId, clanId);
  if (!membership) throw new Error("Not a member of this clan.");

  const rows = await getClanFeed(clanId, new Date(beforeIso));
  const reactions = await getReactionsForCheckIns(
    rows.map((row) => row.checkIn.id),
    userId,
  );

  return { rows, reactions, hasMore: rows.length === FEED_PAGE_SIZE };
}
