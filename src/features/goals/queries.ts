import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals } from "@/db/schema";
import type { GoalType } from "./types";

export async function getUserGoals(userId: string) {
  return db.select().from(goals).where(eq(goals.userId, userId));
}

export async function getUserGoal(userId: string, type: GoalType) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.type, type)));
  return goal ?? null;
}
