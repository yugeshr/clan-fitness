"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clanMemberships, clans } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { generateInviteCode } from "@/lib/invite-code";
import { getClanByInviteCode, getClanMemberCount, getClanMembership } from "./queries";

export type ClanActionState = { error?: string } | undefined;

export async function createClan(
  _prevState: ClanActionState,
  formData: FormData,
): Promise<ClanActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Clan name is required." };
  if (name.length > 60) return { error: "Clan name is too long." };
  const description = String(formData.get("description") ?? "").trim() || null;

  let inviteCode = generateInviteCode();
  for (let attempts = 0; attempts < 5 && (await getClanByInviteCode(inviteCode)); attempts++) {
    inviteCode = generateInviteCode();
  }

  const [clan] = await db
    .insert(clans)
    .values({ name, description, inviteCode, createdBy: user.id })
    .returning();

  await db.insert(clanMemberships).values({ userId: user.id, clanId: clan.id, role: "admin" });

  revalidatePath("/dashboard");
  redirect(`/clans/${clan.id}`);
}

export async function joinClanByInviteCode(
  _prevState: ClanActionState,
  formData: FormData,
): Promise<ClanActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  if (!inviteCode) return { error: "Invite code is required." };

  const clan = await getClanByInviteCode(inviteCode);
  if (!clan) return { error: "Invalid invite code." };

  const existingMembership = await getClanMembership(user.id, clan.id);
  if (existingMembership) redirect(`/clans/${clan.id}`);

  const memberCount = await getClanMemberCount(clan.id);
  if (memberCount >= clan.maxSize) return { error: "This clan is full." };

  await db.insert(clanMemberships).values({ userId: user.id, clanId: clan.id, role: "member" });

  revalidatePath("/dashboard");
  redirect(`/clans/${clan.id}`);
}

export async function leaveClan(clanId: string) {
  const user = await getOrSyncCurrentUser();
  if (!user) throw new Error("Not signed in.");

  await db
    .delete(clanMemberships)
    .where(and(eq(clanMemberships.userId, user.id), eq(clanMemberships.clanId, clanId)));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function renameClan(
  clanId: string,
  _prevState: ClanActionState,
  formData: FormData,
): Promise<ClanActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const membership = await getClanMembership(user.id, clanId);
  if (!membership || membership.role !== "admin") {
    return { error: "Only clan admins can rename the clan." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Clan name is required." };
  if (name.length > 60) return { error: "Clan name is too long." };

  await db.update(clans).set({ name }).where(eq(clans.id, clanId));

  revalidatePath(`/clans/${clanId}`);
  revalidatePath(`/clans/${clanId}/manage`);
}

export async function removeMember(clanId: string, memberUserId: string) {
  const user = await getOrSyncCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const membership = await getClanMembership(user.id, clanId);
  if (!membership || membership.role !== "admin") {
    throw new Error("Only clan admins can remove members.");
  }
  if (memberUserId === user.id) {
    throw new Error("Use 'Leave clan' to remove yourself.");
  }

  const target = await getClanMembership(memberUserId, clanId);
  if (!target) throw new Error("That user is not a member of this clan.");

  await db
    .delete(clanMemberships)
    .where(and(eq(clanMemberships.userId, memberUserId), eq(clanMemberships.clanId, clanId)));

  revalidatePath(`/clans/${clanId}/manage`);
}

export async function regenerateInviteCode(clanId: string) {
  const user = await getOrSyncCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const membership = await getClanMembership(user.id, clanId);
  if (!membership || membership.role !== "admin") {
    throw new Error("Only clan admins can regenerate the invite code.");
  }

  let inviteCode = generateInviteCode();
  for (let attempts = 0; attempts < 5 && (await getClanByInviteCode(inviteCode)); attempts++) {
    inviteCode = generateInviteCode();
  }

  await db.update(clans).set({ inviteCode }).where(eq(clans.id, clanId));

  revalidatePath(`/clans/${clanId}/manage`);
}
