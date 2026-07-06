import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateClanForm, JoinClanForm, getUserClans } from "@/features/clans";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clans = await getUserClans(userId);
  if (clans.length > 0) redirect("/logs");

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Join or create a clan</h1>
        <p className="text-foreground-secondary">You need to be in a clan to start tracking.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Create a clan</h2>
          <CreateClanForm />
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Join with an invite code</h2>
          <JoinClanForm />
        </section>
      </div>
    </main>
  );
}
