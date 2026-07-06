import { Avatar } from "@/components/shared/Avatar";
import type { getClanMembers } from "../queries";

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

type Member = Awaited<ReturnType<typeof getClanMembers>>[number];

export type LeaderboardEntry = {
  user: Member["user"];
  weeklyCount: number;
  weeklyTarget: number;
  weeklySteps: number;
  weeklyStepsTarget: number;
  streak: number;
};

export function ClanLeaderboardSection({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
    <section className="flex flex-col gap-1 rounded-xl border border-surface-border bg-surface p-5">
      <h2 className="mb-2 font-semibold text-foreground">This week</h2>
      <ul className="flex flex-col divide-y divide-surface-border">
        {leaderboard.map(({ user, weeklyCount, weeklyTarget, weeklySteps, weeklyStepsTarget, streak }) => (
          <li key={user.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar src={user.avatarUrl} name={user.name} />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{user.name}</span>
            <span className="flex shrink-0 flex-col items-end text-sm text-foreground-secondary">
              <span>
                <span className="font-bold text-accent">{compactNumber.format(weeklySteps)}</span>/
                {compactNumber.format(weeklyStepsTarget)} <span className="text-foreground-tertiary">steps</span>
              </span>
              <span>
                <span className="font-bold text-accent">{weeklyCount}</span>/{weeklyTarget}{" "}
                <span className="text-foreground-tertiary">gym</span>
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ember">{streak}🔥</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
