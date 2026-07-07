import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import {
  getStepGoalStreaks,
  getUsersLoggedToday,
  getWeeklyCounts,
  getWeeklyStepsTotals,
} from "@/features/check-ins";
import {
  ClanLeaderboardSection,
  ClanMembersSection,
  ClanSettingsSheet,
  getClanById,
  getClanMembers,
} from "@/features/clans";
import { getGoalsForUsers } from "@/features/goals";

const DEFAULT_WEEKLY_GYM_TARGET = 4;
const DEFAULT_DAILY_STEPS_TARGET = 8000;
const STEP_WEIGHT = 0.5;
const STREAK_WEIGHT = 0.25;
const GYM_WEIGHT = 0.25;
const STREAK_CAP_DAYS = 7;

export default async function ManageClanPage({ params }: { params: Promise<{ clanId: string }> }) {
  const { clanId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // members already contains the current user's own row (with role), so a separate
  // getClanMembership call for the same table would be a redundant query.
  const [clan, members] = await Promise.all([getClanById(clanId), getClanMembers(clanId)]);
  const membership = members.find((m) => m.user.id === userId);
  if (!clan || !membership) notFound();

  const memberIds = members.map((m) => m.user.id);
  const [loggedToday, weeklyCounts, weeklyStepsTotals, gymGoals, stepsGoals] = await Promise.all([
    getUsersLoggedToday(memberIds),
    getWeeklyCounts(memberIds, "gym"),
    getWeeklyStepsTotals(memberIds),
    getGoalsForUsers(memberIds, "gym"),
    getGoalsForUsers(memberIds, "steps"),
  ]);
  const isAdmin = membership.role === "admin";

  // Gym turnout is low across most clans, so gym only gets a minority weight rather than being
  // dropped outright: % of weekly steps goal (50%), a streak of days the steps *goal* was
  // actually hit rather than just logged, capped at 7 days (25%), and % of weekly gym goal (25%).
  const dailyStepTargets = new Map(
    memberIds.map((id) => [id, stepsGoals.get(id) ?? DEFAULT_DAILY_STEPS_TARGET]),
  );
  const streaks = await getStepGoalStreaks(memberIds, dailyStepTargets);

  const leaderboard = members
    .map(({ user }) => {
      const weeklyCount = weeklyCounts.get(user.id) ?? 0;
      const weeklyTarget = gymGoals.get(user.id) ?? DEFAULT_WEEKLY_GYM_TARGET;
      const weeklySteps = weeklyStepsTotals.get(user.id) ?? 0;
      const weeklyStepsTarget = (stepsGoals.get(user.id) ?? DEFAULT_DAILY_STEPS_TARGET) * 7;
      const streak = streaks.get(user.id) ?? 0;

      const stepPct = Math.min(weeklySteps / weeklyStepsTarget, 1) * 100;
      const gymPct = Math.min(weeklyCount / weeklyTarget, 1) * 100;
      const streakPct = Math.min(streak / STREAK_CAP_DAYS, 1) * 100;
      const score = STEP_WEIGHT * stepPct + STREAK_WEIGHT * streakPct + GYM_WEIGHT * gymPct;

      return { user, weeklyCount, weeklyTarget, weeklySteps, weeklyStepsTarget, streak, stepPct, gymPct, score };
    })
    .sort((a, b) => b.score - a.score || b.streak - a.streak || a.user.name.localeCompare(b.user.name));

  const tabs: TabItem[] = [
    { id: "leaderboard", label: "Leaderboard", content: <ClanLeaderboardSection leaderboard={leaderboard} /> },
    {
      id: "members",
      label: "Members",
      content: (
        <ClanMembersSection clanId={clanId} members={members} isAdmin={isAdmin} loggedToday={loggedToday} />
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-foreground">{clan.name}</h1>
          <p className="text-sm text-foreground-tertiary">
            {members.length}/{clan.maxSize} members
          </p>
        </div>
        {isAdmin && (
          <div className="shrink-0">
            <ClanSettingsSheet clanId={clanId} clanName={clan.name} inviteCode={clan.inviteCode} />
          </div>
        )}
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
