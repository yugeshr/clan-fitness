import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getClanById, getClanMemberCount, getClanMembership } from "@/features/clans";
import { ClanFeed } from "@/features/feed";

export default async function ClanPage({ params }: { params: Promise<{ clanId: string }> }) {
  const { clanId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [clan, membership] = await Promise.all([
    getClanById(clanId),
    getClanMembership(userId, clanId),
  ]);
  if (!clan || !membership) notFound();

  const memberCount = await getClanMemberCount(clanId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">{clan.name}</h1>
        {clan.description && <p className="text-neutral-600">{clan.description}</p>}
        <p className="text-sm text-neutral-500">
          {memberCount}/{clan.maxSize} members
        </p>
        {membership.role === "admin" && (
          <p className="text-sm text-neutral-500">
            Invite code: <span className="font-mono">{clan.inviteCode}</span>
          </p>
        )}
      </div>
      <ClanFeed clanId={clanId} />
    </div>
  );
}
