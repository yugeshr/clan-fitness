import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export async function getPushSubscriptionsForUser(userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}
