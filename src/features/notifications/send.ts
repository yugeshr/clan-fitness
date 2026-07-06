import "server-only";

import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getPushSubscriptionsForUser } from "./queries";
import type { NotificationPayload } from "./types";

let vapidConfigured = false;

/**
 * Configures web-push lazily, on first send, rather than at module load. VAPID env vars live
 * in per-environment config (not committed), so validating them at import time would fail the
 * build for every route that transitively imports this module, even ones that never send a push.
 */
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/** Sends a push notification to every device the user has subscribed on. Silently drops subscriptions the push service reports as gone. */
export async function notifyUser(userId: string, payload: NotificationPayload) {
  if (!ensureVapidConfigured()) {
    console.warn("Push notifications are not configured (missing VAPID env vars); skipping.");
    return;
  }

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
