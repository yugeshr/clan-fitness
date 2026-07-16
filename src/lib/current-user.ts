import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Returns the local `users` row for the signed-in user, upserting it on first sight. Deduped per
 * request.
 *
 * Only calls Clerk's `currentUser()` (a real network round-trip to Clerk's API, unlike `auth()`'s
 * local JWT verification) for a brand-new user's very first request — every returning user is
 * served straight from our own already-synced DB row. Calling `currentUser()` on every request
 * (the previous behavior, given how widely this function is called) was fine in isolation but at
 * real concurrent traffic tripped Clerk's backend API rate limit, surfacing as intermittent 429s
 * across /profile, /logs, and check-in/reaction actions. Trade-off: a name/avatar change made via
 * Clerk's own account UI no longer auto-propagates here — this app's own profile fields
 * (bio/height/etc., see schema.ts) are the ones meant to be edited live in-app.
 */
export const getOrSyncCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await getUserById(userId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    "Anonymous";
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  const [user] = await db
    .insert(users)
    .values({
      id: clerkUser.id,
      name,
      email,
      avatarUrl: clerkUser.imageUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name, email, avatarUrl: clerkUser.imageUrl },
    })
    .returning();

  return user;
});

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}
