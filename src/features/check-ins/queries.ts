import "server-only";

import { and, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, clanMemberships, users } from "@/db/schema";
import { daysInIstMonth, istDayKey, startOfIstDay, startOfIstMonth } from "@/lib/ist-date";
import { startOfUserDay, userDayKey } from "@/lib/timezone-date";
import type { CheckInType, StepsCheckInValue } from "./types";

// Busy clans can generate a check-in every few minutes across members — 20 covered only a couple
// hours of combined activity, so an older post (with its reactions/comments) would drop off the
// default view well before anyone thought to scroll for it.
export const FEED_PAGE_SIZE = 50;

export function startOfToday(now = new Date()) {
  return startOfIstDay(now);
}

export function startOfYesterday(now = new Date()) {
  return new Date(startOfIstDay(now).getTime() - 24 * 60 * 60 * 1000);
}

// Sunday 08:00 IST (=02:30 UTC) — the app's week boundary. IST has no DST, so this fixed UTC
// offset is safe year-round. Returns the most recent such instant at or before `now`.
export function startOfWeek(now = new Date()) {
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2, 30, 0, 0),
  );
  candidate.setUTCDate(candidate.getUTCDate() - candidate.getUTCDay()); // this-or-last Sunday
  if (candidate.getTime() > now.getTime()) candidate.setUTCDate(candidate.getUTCDate() - 7); // hasn't crossed yet today
  return candidate;
}

export function startOfMonth(now = new Date()) {
  return startOfIstMonth(now);
}

export function daysInMonth(now = new Date()) {
  return daysInIstMonth(now);
}

// A check-in has no clanId of its own — it's visible in a clan's feed whenever its author is
// (still) a member of that clan and it was logged from the day they joined onward. Compares
// against the start of joinedAt's calendar day, not the exact joinedAt instant: otherwise a
// check-in logged earlier the same day someone joins (a common case — log first thing, join a
// clan later) would be wrongly excluded, since its createdAt would fall before the precise
// joinedAt timestamp despite being the same day. No row-fanout risk: the unique (userId, clanId)
// index on clanMemberships means at most one membership row matches per checkIns.userId for a
// fixed clanId filter.
//
// Gym/steps/food are separate rows (see logDailyCheckIn's per-type upsert) and can be logged
// hours apart on the same IST day — a plain row-count LIMIT can cut a page off mid-person's-day,
// showing e.g. their food+photos but not the gym check-in from earlier that morning until the next
// "Load more". Fetches one extra row past the page size to detect that, and trims the split-off
// tail so a page's last (user, day) group is always either fully included or deferred whole to the
// next page — never partial.
export async function getClanFeed(clanId: string, before?: Date) {
  const conditions = [
    eq(clanMemberships.clanId, clanId),
    eq(checkIns.visibility, "public_to_clan"),
    gte(checkIns.createdAt, sql`date_trunc('day', ${clanMemberships.joinedAt})`),
  ];
  if (before) conditions.push(lt(checkIns.createdAt, before));

  const fetched = await db
    .select({ checkIn: checkIns, user: users })
    .from(checkIns)
    .innerJoin(clanMemberships, eq(checkIns.userId, clanMemberships.userId))
    .innerJoin(users, eq(checkIns.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(checkIns.createdAt))
    .limit(FEED_PAGE_SIZE + 1);

  const hasMore = fetched.length > FEED_PAGE_SIZE;
  const rows = fetched.slice(0, FEED_PAGE_SIZE);

  if (hasMore) {
    const dayGroupKey = (row: (typeof fetched)[number]) => `${row.checkIn.userId}:${istDayKey(row.checkIn.createdAt)}`;
    const boundaryKey = dayGroupKey(fetched[FEED_PAGE_SIZE]);
    while (rows.length > 0 && dayGroupKey(rows[rows.length - 1]) === boundaryKey) {
      rows.pop();
    }
  }

  return { rows, hasMore };
}

export type FeedRow = Awaited<ReturnType<typeof getClanFeed>>["rows"][number];

/** Looked up only for its `createdAt`, to anchor a feed page around it — clan-visibility is enforced by getClanFeed's own join, not here. */
export async function getCheckInById(checkInId: string) {
  const [row] = await db.select({ id: checkIns.id, createdAt: checkIns.createdAt }).from(checkIns).where(eq(checkIns.id, checkInId));
  return row ?? null;
}

export async function getLatestCheckInAt(clanId: string, excludeUserId?: string) {
  const conditions = [
    eq(clanMemberships.clanId, clanId),
    eq(checkIns.visibility, "public_to_clan"),
    gte(checkIns.createdAt, sql`date_trunc('day', ${clanMemberships.joinedAt})`),
  ];
  if (excludeUserId) conditions.push(ne(checkIns.userId, excludeUserId));

  const [row] = await db
    .select({ createdAt: checkIns.createdAt })
    .from(checkIns)
    .innerJoin(clanMemberships, eq(checkIns.userId, clanMemberships.userId))
    .where(and(...conditions))
    .orderBy(desc(checkIns.createdAt))
    .limit(1);

  return row?.createdAt ?? null;
}

export async function getUsersLoggedToday(userIds: string[]) {
  if (userIds.length === 0) return new Set<string>();

  const rows = await db
    .selectDistinct({ userId: checkIns.userId })
    .from(checkIns)
    .where(and(inArray(checkIns.userId, userIds), gte(checkIns.createdAt, startOfToday())));

  return new Set(rows.map((row) => row.userId));
}

// Uses the user's OWN timezone (unlike startOfToday/the rest of this file, which stay on the
// shared IST reference for cross-member views) — this is what "today" means to *them* for the
// purpose of "have I already logged this today," so a user whose local day rolls over hours away
// from IST's doesn't get an attempted new check-in silently treated as an update to an earlier one.
export async function getTodaysCheckIn(userId: string, type: CheckInType, timezone: string | null) {
  const [existing] = await db
    .select()
    .from(checkIns)
    .where(
      and(eq(checkIns.userId, userId), eq(checkIns.type, type), gte(checkIns.createdAt, startOfUserDay(timezone))),
    );
  return existing ?? null;
}

export async function getUserWeeklyCount(userId: string, type: CheckInType) {
  const rows = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.type, type), gte(checkIns.createdAt, startOfWeek())));
  return rows.length;
}

export type DateWindow = { start: Date; end?: Date };

export async function getWeeklyCounts(userIds: string[], type: CheckInType, { start, end = new Date() }: DateWindow) {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;

  const rows = await db
    .select({ userId: checkIns.userId })
    .from(checkIns)
    .where(
      and(
        inArray(checkIns.userId, userIds),
        eq(checkIns.type, type),
        gte(checkIns.createdAt, start),
        lt(checkIns.createdAt, end),
      ),
    );

  for (const row of rows) counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
  return counts;
}

export async function getWeeklyStepsTotals(userIds: string[], { start, end = new Date() }: DateWindow) {
  const totals = new Map<string, number>();
  if (userIds.length === 0) return totals;

  const rows = await db
    .select({ userId: checkIns.userId, value: checkIns.value })
    .from(checkIns)
    .where(
      and(
        inArray(checkIns.userId, userIds),
        eq(checkIns.type, "steps"),
        gte(checkIns.createdAt, start),
        lt(checkIns.createdAt, end),
      ),
    );

  for (const row of rows) {
    const { count } = row.value as StepsCheckInValue;
    totals.set(row.userId, (totals.get(row.userId) ?? 0) + count);
  }
  return totals;
}

// asOf anchors the cursor's starting day — defaults to today so existing callers (streak "as of
// now") are unaffected. Callers computing a past week's streak (see getStepGoalStreaks) pass the
// end of that week instead, so the walk-backward never considers days beyond it.
//
// Streaks use the PERSON'S OWN timezone (unlike getClanFeed's day-grouping above, or
// startOfToday/startOfWeek/startOfMonth) — a streak is "did I show up on my own consecutive days,"
// not a shared-clock comparison metric, so it should stay correct regardless of who's viewing it.
function streakFromDayKeys(dayKeys: Set<string>, timezone: string | null, asOf: Date = new Date()) {
  const cursor = startOfUserDay(timezone, asOf);
  if (!dayKeys.has(userDayKey(timezone, cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (dayKeys.has(userDayKey(timezone, cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function getUserStreak(userId: string, type: CheckInType, timezone: string | null) {
  const rows = await db
    .select({ createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.type, type)));

  return streakFromDayKeys(new Set(rows.map((row) => userDayKey(timezone, row.createdAt))), timezone);
}

export async function getStreaks(userIds: string[], type: CheckInType, timezoneByUserId: Map<string, string>) {
  const streaks = new Map<string, number>();
  if (userIds.length === 0) return streaks;

  const rows = await db
    .select({ userId: checkIns.userId, createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(and(inArray(checkIns.userId, userIds), eq(checkIns.type, type)));

  const dayKeysByUser = new Map<string, Set<string>>();
  for (const row of rows) {
    const dayKeys = dayKeysByUser.get(row.userId) ?? new Set<string>();
    dayKeys.add(userDayKey(timezoneByUserId.get(row.userId) ?? null, row.createdAt));
    dayKeysByUser.set(row.userId, dayKeys);
  }

  for (const userId of userIds) {
    streaks.set(
      userId,
      streakFromDayKeys(dayKeysByUser.get(userId) ?? new Set(), timezoneByUserId.get(userId) ?? null),
    );
  }
  return streaks;
}

// Like getStreaks, but a day only counts if that day's steps met the user's daily target —
// logging a check-in isn't enough on its own. dailyTargetsByUser must already have a default
// filled in per user; this function doesn't know about any fallback target. asOf bounds the rows
// to createdAt < asOf AND seeds the streak walk there (both are required together — otherwise a
// check-in logged just after asOf, on the same calendar day, would wrongly count toward a streak
// computed "as of" that day).
export async function getStepGoalStreaks(
  userIds: string[],
  dailyTargetsByUser: Map<string, number>,
  asOf: Date = new Date(),
  timezoneByUserId: Map<string, string>,
) {
  const streaks = new Map<string, number>();
  if (userIds.length === 0) return streaks;

  const rows = await db
    .select({ userId: checkIns.userId, createdAt: checkIns.createdAt, value: checkIns.value })
    .from(checkIns)
    .where(and(inArray(checkIns.userId, userIds), eq(checkIns.type, "steps"), lt(checkIns.createdAt, asOf)));

  const dayKeysByUser = new Map<string, Set<string>>();
  for (const row of rows) {
    const { count } = row.value as StepsCheckInValue;
    if (count < (dailyTargetsByUser.get(row.userId) ?? Infinity)) continue;
    const dayKeys = dayKeysByUser.get(row.userId) ?? new Set<string>();
    dayKeys.add(userDayKey(timezoneByUserId.get(row.userId) ?? null, row.createdAt));
    dayKeysByUser.set(row.userId, dayKeys);
  }

  for (const userId of userIds) {
    streaks.set(
      userId,
      streakFromDayKeys(dayKeysByUser.get(userId) ?? new Set(), timezoneByUserId.get(userId) ?? null, asOf),
    );
  }
  return streaks;
}
