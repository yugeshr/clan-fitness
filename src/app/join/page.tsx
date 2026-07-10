import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getClanByInviteCode, JoinClanForm } from "@/features/clans";

type JoinPageProps = { searchParams: Promise<{ code?: string }> };

// Runs alongside (not instead of) the page below — Next calls both for the same request, so an
// invite link's crawler preview shows the clan being invited to instead of the app's generic title.
export async function generateMetadata({ searchParams }: JoinPageProps): Promise<Metadata> {
  const { code } = await searchParams;
  const clan = code ? await getClanByInviteCode(code) : null;

  const title = clan ? `Join ${clan.name} on Clan Fitness` : "Join a clan on Clan Fitness";
  const description = clan
    ? `You've been invited to join ${clan.name} — track gym, steps, and food together.`
    : "Track gym, steps, and food with your accountability group.";

  return { title, description, openGraph: { title, description } };
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { code } = await searchParams;
  const { userId } = await auth();

  if (!userId) {
    const target = code ? `/join?code=${code}` : "/join";
    redirect(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }

  const clan = code ? await getClanByInviteCode(code) : null;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {clan ? `Join ${clan.name}` : "Join a clan"}
        </h1>
        {clan?.description && <p className="text-foreground-secondary">{clan.description}</p>}
        {code && !clan && (
          <p className="text-sm text-danger">
            That invite code doesn&apos;t match a clan — check it and try again.
          </p>
        )}
      </div>
      <JoinClanForm defaultInviteCode={code} />
    </main>
  );
}
