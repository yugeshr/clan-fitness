import type { FeedRow } from "@/features/check-ins";
import type { FoodCheckInValue, GymCheckInValue, StepsCheckInValue } from "@/features/check-ins/types";

export const TYPE_ICON: Record<string, string> = { gym: "💪", steps: "👟", food: "🥗" };

export function describeCheckIn(type: string, value: unknown) {
  switch (type) {
    case "gym": {
      const { note } = value as GymCheckInValue;
      return note ? `Worked out — "${note}"` : "Worked out";
    }
    case "steps": {
      const { count } = value as StepsCheckInValue;
      return `Logged ${count.toLocaleString("en-US")} steps`;
    }
    case "food": {
      // A photo can be logged without a nutrition status now — the photo itself always renders
      // inline in the feed card regardless (see FeedList.tsx), this is just the caption line above it.
      const { status, note } = value as FoodCheckInValue;
      if (!status) return note ? `Shared a photo — "${note}"` : "Shared a photo";
      return note ? `Logged a meal — "${note}"` : "Logged a meal";
    }
    default:
      return "Checked in";
  }
}

export function groupByUserAndDay(rows: FeedRow[]) {
  const groups = new Map<
    string,
    { user: FeedRow["user"]; day: string; latestAt: Date; entries: FeedRow["checkIn"][] }
  >();

  for (const { checkIn, user } of rows) {
    const day = checkIn.createdAt.toISOString().slice(0, 10);
    const key = `${user.id}:${day}`;
    const group = groups.get(key);
    if (group) {
      group.entries.push(checkIn);
      if (checkIn.createdAt > group.latestAt) group.latestAt = checkIn.createdAt;
    } else {
      groups.set(key, { user, day, latestAt: checkIn.createdAt, entries: [checkIn] });
    }
  }

  return [...groups.values()].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}

export type DayGroup = ReturnType<typeof groupByUserAndDay>[number];

export function groupByDay(groups: DayGroup[]) {
  const sections: { day: string; cards: DayGroup[] }[] = [];
  for (const group of groups) {
    const last = sections[sections.length - 1];
    if (last && last.day === group.day) {
      last.cards.push(group);
    } else {
      sections.push({ day: group.day, cards: [group] });
    }
  }
  return sections;
}

export function formatDayLabel(day: string) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
