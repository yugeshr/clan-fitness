"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkIns, comments } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { COMMENT_MAX_LENGTH } from "./types";
import type { CommentWithUser } from "./queries";

export async function addComment(
  checkInId: string,
  text: string,
): Promise<{ comment: CommentWithUser } | { error: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const trimmed = text.trim();
  if (!trimmed) return { error: "Comment can't be empty." };
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return { error: `Keep it under ${COMMENT_MAX_LENGTH} characters.` };
  }

  const [checkIn] = await db.select({ clanId: checkIns.clanId }).from(checkIns).where(eq(checkIns.id, checkInId));
  if (!checkIn) return { error: "Check-in not found." };

  const [row] = await db.insert(comments).values({ checkInId, userId: user.id, text: trimmed }).returning();

  if (checkIn.clanId) revalidatePath(`/clans/${checkIn.clanId}`);

  return {
    comment: {
      id: row.id,
      checkInId: row.checkInId,
      userId: row.userId,
      text: row.text,
      createdAt: row.createdAt,
      user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
    },
  };
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const [existing] = await db
    .select({ userId: comments.userId, checkInId: comments.checkInId })
    .from(comments)
    .where(eq(comments.id, commentId));
  if (!existing) return { error: "Comment not found." };
  if (existing.userId !== user.id) return { error: "You can only delete your own comments." };

  const [checkIn] = await db.select({ clanId: checkIns.clanId }).from(checkIns).where(eq(checkIns.id, existing.checkInId));

  await db.delete(comments).where(eq(comments.id, commentId));

  if (checkIn?.clanId) revalidatePath(`/clans/${checkIn.clanId}`);

  return {};
}
