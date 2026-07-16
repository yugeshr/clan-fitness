import "server-only";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";

// No roles/permissions system — the admin dashboard is authorized to a fixed list of emails,
// checked directly rather than via an env var. An env var has to be kept correctly set in every
// environment it runs in, with no way to notice if it silently isn't; this can't drift.
const ADMIN_EMAILS = ["yugeshr16@gmail.com", "balakristarun@gmail.com"];

// Goes through getOrSyncCurrentUser (our own already-synced DB row) rather than calling Clerk's
// currentUser() API directly here — that used to be a second, separate Clerk API call on top of
// the one every other page/action already makes, doubling this codebase's exposure to Clerk's
// rate limit for zero benefit (email doesn't change per-request).
export async function isAdminUser(): Promise<boolean> {
  const user = await getOrSyncCurrentUser();
  return !!user?.email && ADMIN_EMAILS.includes(user.email);
}

/** Every admin's own local `users` row id, for notifying all of them (e.g. new feedback messages). */
export async function getAdminUserIds() {
  const rows = await db.select({ id: users.id }).from(users).where(inArray(users.email, ADMIN_EMAILS));
  return rows.map((row) => row.id);
}
