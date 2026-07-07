"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { checkIns, reactions } from "@/db/schema";
import { getUserClansAsOf } from "@/features/clans/queries";
import { notifyUser } from "@/features/notifications/send";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { getReactionsForCheckIns } from "./queries";
import type { ReactionSummary } from "./types";

export async function toggleReaction(
  checkInId: string,
  emoji: string,
): Promise<{ summary: ReactionSummary } | { error: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const [checkIn] = await db
    .select({ userId: checkIns.userId, createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));
  if (!checkIn) return { error: "Check-in not found." };

  const [existing] = await db
    .select()
    .from(reactions)
    .where(
      and(eq(reactions.checkInId, checkInId), eq(reactions.userId, user.id), eq(reactions.emoji, emoji)),
    );

  // Clans this check-in is visible in (owner's memberships as of when it was logged) — the
  // recipient below is always the owner, who is by construction a member of all of them, so any
  // one is a valid deep link.
  const visibleClanIds = (await getUserClansAsOf(checkIn.userId, checkIn.createdAt)).map((c) => c.clan.id);

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else {
    await db.insert(reactions).values({ checkInId, userId: user.id, emoji });
    if (checkIn.userId !== user.id) {
      after(() =>
        notifyUser(checkIn.userId, {
          type: "reaction",
          title: `${user.name} reacted ${emoji} to your check-in`,
          body: "Tap to see it.",
          url: visibleClanIds[0] ? `/clans/${visibleClanIds[0]}` : "/logs",
          checkInId,
        }),
      );
    }
  }

  for (const clanId of visibleClanIds) revalidatePath(`/clans/${clanId}`);

  const summaries = await getReactionsForCheckIns([checkInId], user.id);
  return { summary: summaries[checkInId] ?? {} };
}
