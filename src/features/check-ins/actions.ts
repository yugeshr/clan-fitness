"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { getUserClans } from "@/features/clans/queries";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { getTodaysCheckIn } from "./queries";
import type { FoodStatus } from "./types";

export type CheckInActionState = { error?: string } | undefined;

async function getPrimaryClanId(userId: string) {
  const memberships = await getUserClans(userId);
  return memberships[0]?.clan.id ?? null;
}

export async function logGymCheckIn(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const note = String(formData.get("note") ?? "").trim() || undefined;
  const clanId = await getPrimaryClanId(user.id);

  await db
    .insert(checkIns)
    .values({ userId: user.id, clanId, type: "gym", value: { note }, visibility: "public_to_clan" });

  revalidatePath("/dashboard");
}

export async function logStepsCheckIn(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const count = Number(formData.get("count"));
  if (!Number.isFinite(count) || count < 0) return { error: "Enter a valid step count." };

  const existing = await getTodaysCheckIn(user.id, "steps");
  if (existing) {
    await db.update(checkIns).set({ value: { count } }).where(eq(checkIns.id, existing.id));
  } else {
    const clanId = await getPrimaryClanId(user.id);
    await db
      .insert(checkIns)
      .values({ userId: user.id, clanId, type: "steps", value: { count }, visibility: "public_to_clan" });
  }

  revalidatePath("/dashboard");
}

export async function logFoodCheckIn(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const status = String(formData.get("status") ?? "") as FoodStatus;
  if (!["yes", "no", "partial"].includes(status)) return { error: "Choose a status." };
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const clanId = await getPrimaryClanId(user.id);

  const existing = await getTodaysCheckIn(user.id, "food");
  if (existing) {
    await db.update(checkIns).set({ value: { status, note } }).where(eq(checkIns.id, existing.id));
  } else {
    await db
      .insert(checkIns)
      .values({ userId: user.id, clanId, type: "food", value: { status, note }, visibility: "private" });
  }

  revalidatePath("/dashboard");
}
