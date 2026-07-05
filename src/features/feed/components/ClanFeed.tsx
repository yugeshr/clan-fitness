import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
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

type DayGroup = ReturnType<typeof groupByUserAndDay>[number];

function groupByDay(groups: DayGroup[]) {
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

function formatDayLabel(day: string) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric" });
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
  const sections = groupByDay(groups);
  const reactionSummaries = userId
    ? await getReactionsForCheckIns(
        rows.map((row) => row.checkIn.id),
        userId,
      )
    : new Map();

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.day} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
            {formatDayLabel(section.day)}
          </h3>
          <ul className="flex flex-col gap-3">
            {section.cards.map((group) => (
              <li
                key={group.user.id}
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface p-3"
              >
                <Avatar src={group.user.avatarUrl} name={group.user.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {group.user.name}
                    </span>
                    <time
                      className="shrink-0 text-xs text-foreground-muted"
                      dateTime={group.latestAt.toISOString()}
                    >
                      {group.latestAt.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {group.entries.map((checkIn) => {
                    const photoUrl =
                      checkIn.type === "food" ? (checkIn.value as FoodCheckInValue).photoUrl : undefined;
                    return (
                      <div key={checkIn.id} className="flex flex-col gap-2">
                        <p className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <span aria-hidden>{TYPE_ICON[checkIn.type] ?? "✅"}</span>
                          {describeCheckIn(checkIn.type, checkIn.value)}
                        </p>
                        {photoUrl && (
                          <Image
                            src={photoUrl}
                            alt=""
                            width={320}
                            height={240}
                            className="max-h-60 w-full max-w-xs rounded-lg border border-surface-border object-cover"
                          />
                        )}
                      </div>
                    );
                  })}
                  <ReactionBar
                    checkInId={group.entries[0].id}
                    summary={reactionSummaries.get(group.entries[0].id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
