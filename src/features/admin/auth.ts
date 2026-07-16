import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// No roles/permissions system — the admin dashboard is authorized to a fixed list of emails,
// checked directly rather than via an env var. An env var has to be kept correctly set in every
// environment it runs in, with no way to notice if it silently isn't; this can't drift.
const ADMIN_EMAILS = ["yugeshr16@gmail.com", "balakristarun@gmail.com"];

export async function isAdminUser(): Promise<boolean> {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  return !!email && ADMIN_EMAILS.includes(email);
}

/** Every admin's own local `users` row id, for notifying all of them (e.g. new feedback messages). */
export async function getAdminUserIds() {
  const rows = await db.select({ id: users.id }).from(users).where(inArray(users.email, ADMIN_EMAILS));
  return rows.map((row) => row.id);
}
