import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FoodCheckInForm,
  GymCheckInForm,
  StepsCheckInForm,
  getTodaysCheckIn,
  getUserStreak,
  getUserWeeklyCount,
} from "@/features/check-ins";
import type { FoodCheckInValue, StepsCheckInValue } from "@/features/check-ins/types";
import { getUserClans } from "@/features/clans";

// Fixed until goal-setting (build order step 6) ships; Goal table already supports per-user targets.
const WEEKLY_GYM_TARGET = 4;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [gymCheckIn, stepsCheckIn, foodCheckIn, gymStreak, weeklyGymCount, clans] = await Promise.all([
    getTodaysCheckIn(userId, "gym"),
    getTodaysCheckIn(userId, "steps"),
    getTodaysCheckIn(userId, "food"),
    getUserStreak(userId, "gym"),
    getUserWeeklyCount(userId, "gym"),
    getUserClans(userId),
  ]);

  const primaryClan = clans[0]?.clan;
  const stepsValue = stepsCheckIn?.value as StepsCheckInValue | undefined;
  const foodValue = foodCheckIn?.value as FoodCheckInValue | undefined;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
      <section className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
        <div>
          <p className="text-sm text-neutral-600">This week</p>
          <p className="text-2xl font-bold">
            {weeklyGymCount}/{WEEKLY_GYM_TARGET} gym days
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-600">Streak</p>
          <p className="text-2xl font-bold">{gymStreak} 🔥</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Gym</h2>
        <GymCheckInForm alreadyLoggedToday={!!gymCheckIn} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Steps</h2>
        <StepsCheckInForm todaysCount={stepsValue?.count} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Nutrition</h2>
        <FoodCheckInForm currentStatus={foodValue?.status} />
      </section>

      {primaryClan && (
        <Link
          href={`/clans/${primaryClan.id}`}
          className="text-sm font-medium text-orange-600 hover:underline"
        >
          View {primaryClan.name}&apos;s feed →
        </Link>
      )}
    </div>
  );
}
