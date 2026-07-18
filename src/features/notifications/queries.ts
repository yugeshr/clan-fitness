import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications, pushSubscriptions, users } from "@/db/schema";

export type NotificationRow = typeof notifications.$inferSelect;

export async function getPushSubscriptionsForUser(userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function getNotificationsForUser(userId: string, limit = 30) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}

export async function getNotificationPreferences(userId: string) {
  const [prefs] = await db
    .select({
      notifyOnComments: users.notifyOnComments,
      notifyOnMentions: users.notifyOnMentions,
      notifyOnReactions: users.notifyOnReactions,
      notifyOnCheckIns: users.notifyOnCheckIns,
    })
    .from(users)
    .where(eq(users.id, userId));
  return prefs ?? null;
}
