import { auth } from "@clerk/nextjs/server";
import { Avatar } from "@/components/shared/Avatar";
import { getClanFeed } from "@/features/check-ins";
import type { FoodCheckInValue, GymCheckInValue, StepsCheckInValue } from "@/features/check-ins/types";
import { getReactionsForCheckIns, ReactionBar } from "@/features/reactions";

const TYPE_ICON: Record<string, string> = { gym: "💪", steps: "👟", food: "🥗" };

function describeCheckIn(type: string, value: unknown) {
  switch (type) {
    case "gym": {
      const { note } = value as GymCheckInValue;
      return note ? `Worked out — "${note}"` : "Worked out";
    }
    case "steps": {
      const { count } = value as StepsCheckInValue;
      return `Logged ${count.toLocaleString()} steps`;
    }
    case "food": {
      const { note } = value as FoodCheckInValue;
      return note ? `Logged a meal — "${note}"` : "Logged a meal";
    }
    default:
      return "Checked in";
  }
}

type FeedRow = Awaited<ReturnType<typeof getClanFeed>>[number];

function groupByUserAndDay(rows: FeedRow[]) {
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

export async function ClanFeed({ clanId }: { clanId: string }) {
  const { userId } = await auth();
  const rows = await getClanFeed(clanId);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground-tertiary">No check-ins yet — be the first to log today.</p>
    );
  }

  const groups = groupByUserAndDay(rows);
  const reactionSummaries = userId
    ? await getReactionsForCheckIns(
        rows.map((row) => row.checkIn.id),
        userId,
      )
    : new Map();

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group) => (
        <li
          key={`${group.user.id}:${group.day}`}
          className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface p-3"
        >
          <Avatar src={group.user.avatarUrl} name={group.user.name} />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{group.user.name}</span>
              <time className="text-xs text-foreground-muted" dateTime={group.latestAt.toISOString()}>
                {group.latestAt.toLocaleString()}
              </time>
            </div>
            {group.entries.map((checkIn) => (
              <p key={checkIn.id} className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                <span aria-hidden>{TYPE_ICON[checkIn.type] ?? "✅"}</span>
                {describeCheckIn(checkIn.type, checkIn.value)}
              </p>
            ))}
            <ReactionBar
              checkInId={group.entries[0].id}
              summary={reactionSummaries.get(group.entries[0].id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
