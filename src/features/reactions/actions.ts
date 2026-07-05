"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkIns, reactions } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";

export async function toggleReaction(checkInId: string, emoji: string) {
  const user = await getOrSyncCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const [checkIn] = await db
    .select({ clanId: checkIns.clanId })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));
  if (!checkIn) throw new Error("Check-in not found.");

  const [existing] = await db
    .select()
    .from(reactions)
    .where(
      and(eq(reactions.checkInId, checkInId), eq(reactions.userId, user.id), eq(reactions.emoji, emoji)),
    );

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else {
    await db.insert(reactions).values({ checkInId, userId: user.id, emoji });
  }

  if (checkIn.clanId) revalidatePath(`/clans/${checkIn.clanId}`);
}
