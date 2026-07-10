import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";

export type NotificationRow = typeof notifications.$inferSelect;

function startOfToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/** One nudge per recipient per day, regardless of who sends it — a cheap spam guard reusing the
 * existing notifications table instead of a dedicated one. */
export async function hasBeenNudgedToday(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.type, "nudge"), gte(notifications.createdAt, startOfToday())),
    );
  return (row?.count ?? 0) > 0;
}

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
