import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// No roles/permissions system — the admin dashboard has exactly one authorized user, the app's
// creator, checked directly against this email rather than an env var. An env var has to be kept
// correctly set in every environment it runs in, with no way to notice if it silently isn't;
// this can't drift.
const ADMIN_EMAIL = "yugeshr16@gmail.com";

export async function isAdminUser(): Promise<boolean> {
  const user = await currentUser();
  return user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL;
}

/** The admin's own local `users` row id, for notifying them (e.g. new feedback messages). */
export async function getAdminUserId() {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, ADMIN_EMAIL));
  return row?.id ?? null;
}
