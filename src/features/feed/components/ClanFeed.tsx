import { getClanFeed } from "@/features/check-ins";
import type { FoodCheckInValue, GymCheckInValue, StepsCheckInValue } from "@/features/check-ins/types";

const TYPE_ICON: Record<string, string> = { gym: "💪", steps: "👟", food: "🥗" };

function describeCheckIn(type: string, value: unknown) {
  switch (type) {
    case "gym": {
      const { note } = value as GymCheckInValue;
      return note ? `worked out — "${note}"` : "worked out";
    }
    case "steps": {
      const { count } = value as StepsCheckInValue;
      return `logged ${count.toLocaleString()} steps`;
    }
    case "food": {
      const { note } = value as FoodCheckInValue;
      return note ? `logged a meal — "${note}"` : "logged a meal";
    }
    default:
      return "checked in";
  }
}

export async function ClanFeed({ clanId }: { clanId: string }) {
  const items = await getClanFeed(clanId);

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No check-ins yet — be the first to log today.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ checkIn, user }) => (
        <li key={checkIn.id} className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
          <span className="text-xl" aria-hidden>
            {TYPE_ICON[checkIn.type] ?? "✅"}
          </span>
          <div className="flex flex-col">
            <p className="text-sm">
              <span className="font-medium">{user.name}</span>{" "}
              {describeCheckIn(checkIn.type, checkIn.value)}
            </p>
            <time className="text-xs text-neutral-500" dateTime={checkIn.createdAt.toISOString()}>
              {checkIn.createdAt.toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
