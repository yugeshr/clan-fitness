import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserClans } from "@/features/clans";
import { getUserGoals, GoalsForm } from "@/features/goals";

export default async function OnboardingGoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clans = await getUserClans(userId);
  if (clans.length === 0) redirect("/onboarding");

  const goals = await getUserGoals(userId);
  if (goals.length > 0) redirect("/logs");

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Set your goals</h1>
        <p className="text-foreground-secondary">
          Pick a weekly gym target and daily step goal. You can change these anytime from Profile.
        </p>
      </div>
      <GoalsForm redirectOnSuccessTo="/logs" />
    </main>
  );
}
