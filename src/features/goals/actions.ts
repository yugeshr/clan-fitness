"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { getOrSyncCurrentUser } from "@/lib/current-user";

export type GoalActionState = { error?: string } | undefined;

export async function setGoals(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const daysPerWeek = Number(formData.get("daysPerWeek"));
  if (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    return { error: "Enter a gym target between 1 and 7 days." };
  }

  const stepsPerDay = Number(formData.get("stepsPerDay"));
  if (!Number.isFinite(stepsPerDay) || stepsPerDay < 1) {
    return { error: "Enter a positive step goal." };
  }

  await Promise.all([
    db
      .insert(goals)
      .values({ userId: user.id, type: "gym", targetValue: daysPerWeek, period: "weekly" })
      .onConflictDoUpdate({
        target: [goals.userId, goals.type],
        set: { targetValue: daysPerWeek, period: "weekly" },
      }),
    db
      .insert(goals)
      .values({ userId: user.id, type: "steps", targetValue: stepsPerDay, period: "daily" })
      .onConflictDoUpdate({
        target: [goals.userId, goals.type],
        set: { targetValue: stepsPerDay, period: "daily" },
      }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/logs");
}
