"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { getNotificationsForUser } from "./queries";
import type { PushSubscriptionInput } from "./types";

export async function subscribeToPush(subscription: PushSubscriptionInput): Promise<{ error?: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    });

  return {};
}

export async function unsubscribeFromPush(endpoint: string): Promise<{ error?: string }> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));

  return {};
}

/** Fetches recent notifications, then marks them all read — the returned rows still reflect who was unread before this call. */
export async function getNotificationsAndMarkRead() {
  const user = await getOrSyncCurrentUser();
  if (!user) return [];

  const items = await getNotificationsForUser(user.id);

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  return items;
}
