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

export async function logDailyCheckIn(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const stepsRaw = String(formData.get("count") ?? "").trim();
  const count = stepsRaw ? Number(stepsRaw) : undefined;
  if (count !== undefined && (!Number.isFinite(count) || count < 0)) {
    return { error: "Enter a valid step count." };
  }

  const status = String(formData.get("status") ?? "") as FoodStatus;
  const hasFoodStatus = ["yes", "no", "partial"].includes(status);

  const workedOut = formData.get("workedOut") === "on";
  const clanId = await getPrimaryClanId(user.id);

  if (workedOut) {
    const alreadyLogged = await getTodaysCheckIn(user.id, "gym");
    if (!alreadyLogged) {
      const gymNote = String(formData.get("gymNote") ?? "").trim() || undefined;
      await db.insert(checkIns).values({
        userId: user.id,
        clanId,
        type: "gym",
        value: { note: gymNote },
        visibility: "public_to_clan",
      });
    }
  }

  if (count !== undefined) {
    const existingSteps = await getTodaysCheckIn(user.id, "steps");
    if (existingSteps) {
      await db.update(checkIns).set({ value: { count } }).where(eq(checkIns.id, existingSteps.id));
    } else {
      await db.insert(checkIns).values({
        userId: user.id,
        clanId,
        type: "steps",
        value: { count },
        visibility: "public_to_clan",
      });
    }
  }

  if (hasFoodStatus) {
    const foodNote = String(formData.get("foodNote") ?? "").trim() || undefined;
    const existingFood = await getTodaysCheckIn(user.id, "food");
    if (existingFood) {
      await db
        .update(checkIns)
        .set({ value: { status, note: foodNote } })
        .where(eq(checkIns.id, existingFood.id));
    } else {
      await db.insert(checkIns).values({
        userId: user.id,
        clanId,
        type: "food",
        value: { status, note: foodNote },
        visibility: "private",
      });
    }
  }

  revalidatePath("/dashboard");
}
