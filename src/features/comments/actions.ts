"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { checkIns, comments } from "@/db/schema";
import { getClanMembers } from "@/features/clans/queries";
import { notifyUser } from "@/features/notifications/send";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { extractMentionedUserIds, mentionsToPlainText } from "./mentions";
import { COMMENT_MAX_LENGTH, COMMENT_MAX_RAW_LENGTH } from "./types";
import type { CommentWithUser } from "./queries";

export async function addComment(
  checkInId: string,
  text: string,
): Promise<{ comment: CommentWithUser } | { error: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const trimmed = text.trim();
  if (!trimmed) return { error: "Comment can't be empty." };
  if (trimmed.length > COMMENT_MAX_RAW_LENGTH) {
    return { error: "Comment is too long." };
  }
  const displayText = mentionsToPlainText(trimmed);
  if (displayText.length > COMMENT_MAX_LENGTH) {
    return { error: `Keep it under ${COMMENT_MAX_LENGTH} characters.` };
  }

  const [checkIn] = await db
    .select({ clanId: checkIns.clanId, userId: checkIns.userId })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));
  if (!checkIn) return { error: "Check-in not found." };

  const [row] = await db.insert(comments).values({ checkInId, userId: user.id, text: trimmed }).returning();

  if (checkIn.clanId) revalidatePath(`/clans/${checkIn.clanId}`);

  // Only notify members of this clan, even if the raw text claims to mention someone else's user ID.
  const members = checkIn.clanId ? await getClanMembers(checkIn.clanId) : [];
  const memberIds = new Set(members.map((m) => m.user.id));
  const mentionedIds = new Set(extractMentionedUserIds(trimmed).filter((id) => memberIds.has(id) && id !== user.id));

  const recipients = new Map<string, { title: string; body: string }>();
  if (checkIn.userId !== user.id && !mentionedIds.has(checkIn.userId)) {
    recipients.set(checkIn.userId, { title: `${user.name} commented on your check-in`, body: displayText });
  }
  for (const mentionedId of mentionedIds) {
    recipients.set(mentionedId, { title: `${user.name} mentioned you in a comment`, body: displayText });
  }

  if (recipients.size > 0) {
    const url = checkIn.clanId ? `/clans/${checkIn.clanId}` : "/logs";
    after(() => Promise.all([...recipients].map(([userId, payload]) => notifyUser(userId, { ...payload, url }))));
  }

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
