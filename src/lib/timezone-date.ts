// Used both server-side (queries) and client-side (feed grouping — see feed/group.ts), so this
// module is intentionally not server-only, unlike most of src/lib.
//
// Matches this app's original (pre-multi-timezone) assumption and the `users.timezone` column's
// DB default — used as a fallback for a new user before their browser has ever reported a real
// zone, or for a malformed/unrecognized value.
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Standard trick: format `date` as wall-clock parts in `timeZone`, reconstruct that as if it were
// UTC, and diff against the real UTC instant — the difference is the zone's offset at that moment.
// Computed per-call (not cached) so it's correct across a DST transition, unlike a fixed constant.
function getUtcOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - date.getTime();
}

function safeOffsetMs(date: Date, timeZone: string | null | undefined): number {
  try {
    return getUtcOffsetMs(date, timeZone || DEFAULT_TIMEZONE);
  } catch {
    return getUtcOffsetMs(date, DEFAULT_TIMEZONE);
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    // Constructing it is the validity check — DateTimeFormat throws a RangeError for an
    // unrecognized IANA zone name.
    void new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Most recent instant that is local midnight in `timeZone`, at or before `now`. Accepted
// limitation: uses the offset in effect at `now`, so a day right on a DST transition could be off
// by up to an hour — self-corrects the next day, not worth a full tz-database dependency for.
export function startOfUserDay(timeZone: string | null | undefined, now = new Date()): Date {
  const offsetMs = safeOffsetMs(now, timeZone);
  const shifted = new Date(now.getTime() + offsetMs);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMs);
}

// Which local calendar day (in `timeZone`) an instant belongs to, as a sortable "YYYY-MM-DD" key.
export function userDayKey(timeZone: string | null | undefined, date: Date): string {
  const offsetMs = safeOffsetMs(date, timeZone);
  return new Date(date.getTime() + offsetMs).toISOString().slice(0, 10);
}

// First instant of the current local month in `timeZone`, at or before `now`.
export function startOfUserMonth(timeZone: string | null | undefined, now = new Date()): Date {
  const offsetMs = safeOffsetMs(now, timeZone);
  const shifted = new Date(now.getTime() + offsetMs);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1, 0, 0, 0, 0) - offsetMs);
}

// Number of calendar days in the current local month in `timeZone`.
export function daysInUserMonth(timeZone: string | null | undefined, now = new Date()): number {
  const offsetMs = safeOffsetMs(now, timeZone);
  const shifted = new Date(now.getTime() + offsetMs);
  return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0).getUTCDate();
}

// Most recent Sunday midnight (local) in `timeZone`, at or before `now`. Used as the "this week"
// leaderboard window start — the weekly-recap cron's own Sunday-8am-IST boundary is separate.
export function startOfUserWeek(timeZone: string | null | undefined, now = new Date()): Date {
  const offsetMs = safeOffsetMs(now, timeZone);
  const shifted = new Date(now.getTime() + offsetMs);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - shifted.getUTCDay()); // rewind to Sunday
  return new Date(shifted.getTime() - offsetMs);
}

export type UserMonthDay = { date: Date; dayKey: string; dayOfWeek: number };

// Every day (1st through the last) of the current local month — centralizes calendar-grid
// enumeration so a heatmap component doesn't need to reimplement it. `dayOfWeek` (0=Sun..6=Sat) is
// derived directly from the local calendar numbers, not from `date`'s UTC representation — those
// can disagree once a timezone offset is involved, since `date` is the real-world instant of local
// midnight shifted back into UTC, not a UTC calendar date itself.
export function getUserMonthDays(timeZone: string | null | undefined, now = new Date()): UserMonthDay[] {
  const offsetMs = safeOffsetMs(now, timeZone);
  const shiftedNow = new Date(now.getTime() + offsetMs);
  const year = shiftedNow.getUTCFullYear();
  const month = shiftedNow.getUTCMonth();
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const days: UserMonthDay[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMs);
    const dayOfWeek = new Date(Date.UTC(year, month, day)).getUTCDay();
    days.push({ date, dayKey, dayOfWeek });
  }
  return days;
}
