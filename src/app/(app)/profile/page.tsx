import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserGoals, GoalsForm } from "@/features/goals";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const goals = await getUserGoals(userId);
  const gymGoal = goals.find((g) => g.type === "gym");
  const stepsGoal = goals.find((g) => g.type === "steps");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">Your goals</h1>
      <GoalsForm gymTarget={gymGoal?.targetValue} stepsTarget={stepsGoal?.targetValue} />
    </div>
  );
}
