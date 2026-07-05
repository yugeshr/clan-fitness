import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getClanByInviteCode, JoinClanForm } from "@/features/clans";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
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
