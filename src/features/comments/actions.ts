"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { checkIns, comments } from "@/db/schema";
import { getClanMembersForClanIds, getUserClans, getUserClansAsOf } from "@/features/clans/queries";
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
    .select({ userId: checkIns.userId, createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(eq(checkIns.id, checkInId));
  if (!checkIn) return { error: "Check-in not found." };

  const [row] = await db.insert(comments).values({ checkInId, userId: user.id, text: trimmed }).returning();

  // Clans this check-in is visible in (owner's memberships as of when it was logged).
  const visibleClans = await getUserClansAsOf(checkIn.userId, checkIn.createdAt);
  const clanIds = visibleClans.map((c) => c.clan.id);
  for (const clanId of clanIds) revalidatePath(`/clans/${clanId}`);

  // Mention targets must be in a clan BOTH the commenter and the check-in owner share — the owner
  // might be visible in more clans than the commenter is actually in, and that gap shouldn't let
  // someone tag a stranger they have no clan in common with.
  const commenterClans = await getUserClans(user.id);
  const commenterClanIds = new Set(commenterClans.map((c) => c.clan.id));
  const sharedClanIds = clanIds.filter((id) => commenterClanIds.has(id));
  const members = await getClanMembersForClanIds(sharedClanIds);
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
    const url = clanIds[0] ? `/clans/${clanIds[0]}` : "/logs";
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

  const [checkIn] = await db
    .select({ userId: checkIns.userId, createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(eq(checkIns.id, existing.checkInId));

  await db.delete(comments).where(eq(comments.id, commentId));

  if (checkIn) {
    const visibleClans = await getUserClansAsOf(checkIn.userId, checkIn.createdAt);
    for (const clan of visibleClans) revalidatePath(`/clans/${clan.clan.id}`);
  }

  return {};
}
