import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserClans } from "@/features/clans";
import { getUserGoals } from "@/features/goals";
import { GoalsAndNotificationsFlow } from "./GoalsAndNotificationsFlow";

export default async function OnboardingGoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clans = await getUserClans(userId);
  if (clans.length === 0) redirect("/onboarding");

  const goals = await getUserGoals(userId);
  if (goals.length > 0) redirect("/logs");

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-8 px-6 py-12">
      <GoalsAndNotificationsFlow />
    </main>
  );
}
