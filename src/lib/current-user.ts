import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";

/** Returns the local `users` row for the signed-in Clerk user, upserting it on first sight. Deduped per request. */
export const getOrSyncCurrentUser = cache(async () => {
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
