import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUserClans } from "@/features/clans";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const clans = await getUserClans(userId);
    redirect(clans.length > 0 ? "/logs" : "/onboarding");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-bold text-foreground">
        Clan <span className="text-accent">Fitness</span>
      </h1>
      <p className="max-w-md text-foreground-secondary">
        Track gym days, steps, and food with a small group of people who&apos;ll actually notice if you
        skip.
      </p>
      <div className="flex gap-3">
        <Link href="/sign-up">
          <Button>Get started</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
