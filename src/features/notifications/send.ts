import "server-only";

import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getPushSubscriptionsForUser } from "./queries";
import type { NotificationPayload } from "./types";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

/** Sends a push notification to every device the user has subscribed on. Silently drops subscriptions the push service reports as gone. */
export async function notifyUser(userId: string, payload: NotificationPayload) {
  const subscriptions = await getPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error("Failed to send push notification:", error);
        }
      }
    }),
  );
}
