import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clanMemberships, clans, users } from "@/db/schema";

export async function getUserClans(userId: string) {
  return db
    .select({ clan: clans, role: clanMemberships.role })
    .from(clanMemberships)
    .innerJoin(clans, eq(clanMemberships.clanId, clans.id))
    .where(eq(clanMemberships.userId, userId));
}

export async function getClanById(clanId: string) {
  const [clan] = await db.select().from(clans).where(eq(clans.id, clanId));
  return clan ?? null;
}

export async function getClanByInviteCode(inviteCode: string) {
  const [clan] = await db.select().from(clans).where(eq(clans.inviteCode, inviteCode));
  return clan ?? null;
}

export async function getClanMembership(userId: string, clanId: string) {
  const [membership] = await db
    .select()
    .from(clanMemberships)
    .where(and(eq(clanMemberships.userId, userId), eq(clanMemberships.clanId, clanId)));
  return membership ?? null;
}

export async function getClanMembers(clanId: string) {
  return db
    .select({ user: users, role: clanMemberships.role, joinedAt: clanMemberships.joinedAt })
    .from(clanMemberships)
    .innerJoin(users, eq(clanMemberships.userId, users.id))
    .where(eq(clanMemberships.clanId, clanId));
}

export async function getClanMemberCount(clanId: string) {
  const members = await db
    .select({ userId: clanMemberships.userId })
    .from(clanMemberships)
    .where(eq(clanMemberships.clanId, clanId));
  return members.length;
}
