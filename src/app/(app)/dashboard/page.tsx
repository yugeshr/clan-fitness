import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DailyLogForm,
  getTodaysCheckIn,
  getUserStreak,
  getUserWeeklyCount,
} from "@/features/check-ins";
import type { FoodCheckInValue, StepsCheckInValue } from "@/features/check-ins/types";
import { getUserClans } from "@/features/clans";
import { getUserGoals } from "@/features/goals";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [gymCheckIn, stepsCheckIn, foodCheckIn, gymStreak, weeklyGymCount, clans, goals] =
    await Promise.all([
      getTodaysCheckIn(userId, "gym"),
      getTodaysCheckIn(userId, "steps"),
      getTodaysCheckIn(userId, "food"),
      getUserStreak(userId, "gym"),
      getUserWeeklyCount(userId, "gym"),
      getUserClans(userId),
      getUserGoals(userId),
    ]);

  const primaryClan = clans[0]?.clan;
  const stepsValue = stepsCheckIn?.value as StepsCheckInValue | undefined;
  const foodValue = foodCheckIn?.value as FoodCheckInValue | undefined;
  const gymGoal = goals.find((g) => g.type === "gym");
  const stepsGoal = goals.find((g) => g.type === "steps");
  const weeklyGymTarget = gymGoal?.targetValue ?? 4;
  const dailyStepsTarget = stepsGoal?.targetValue ?? 8000;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
      <section className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
            This week
          </p>
          <p className="text-3xl font-bold text-foreground">
            {weeklyGymCount}
            <span className="text-foreground-tertiary">/{weeklyGymTarget}</span>
          </p>
          <p className="text-xs text-foreground-secondary">gym days</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
            Streak
          </p>
          <p className="text-3xl font-bold text-ember">{gymStreak} 🔥</p>
        </div>
      </section>

      <DailyLogForm
        alreadyWorkedOut={!!gymCheckIn}
        todaysSteps={stepsValue?.count}
        dailyStepsTarget={dailyStepsTarget}
        currentFoodStatus={foodValue?.status}
      />

      {primaryClan && (
        <Link href={`/clans/${primaryClan.id}`} className="text-sm font-medium text-accent hover:underline">
          View {primaryClan.name}&apos;s feed →
        </Link>
      )}
    </div>
  );
}
