import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, users } from "@/db/schema";
import type { CheckInType } from "./types";

const FEED_PAGE_SIZE = 20;

function startOfToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

export async function getClanFeed(clanId: string, before?: Date) {
  const conditions = [eq(checkIns.clanId, clanId), eq(checkIns.visibility, "public_to_clan")];
  if (before) conditions.push(lt(checkIns.createdAt, before));

  return db
    .select({ checkIn: checkIns, user: users })
    .from(checkIns)
    .innerJoin(users, eq(checkIns.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(checkIns.createdAt))
    .limit(FEED_PAGE_SIZE);
}

export async function getTodaysCheckIn(userId: string, type: CheckInType) {
  const [existing] = await db
    .select()
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.type, type), gte(checkIns.createdAt, startOfToday())));
  return existing ?? null;
}

export async function getUserWeeklyCount(userId: string, type: CheckInType) {
  const rows = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.type, type), gte(checkIns.createdAt, startOfWeek())));
  return rows.length;
}

export async function getUserStreak(userId: string, type: CheckInType) {
  const rows = await db
    .select({ createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.type, type)))
    .orderBy(desc(checkIns.createdAt));

  const dayKeys = new Set(rows.map((row) => row.createdAt.toISOString().slice(0, 10)));

  const cursor = startOfToday();
  if (!dayKeys.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
