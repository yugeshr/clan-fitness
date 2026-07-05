import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { ClanSettingsSheet, getClanById, getClanMembers, getClanMembership, removeMember } from "@/features/clans";

export default async function ManageClanPage({ params }: { params: Promise<{ clanId: string }> }) {
  const { clanId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [clan, membership] = await Promise.all([
    getClanById(clanId),
    getClanMembership(userId, clanId),
  ]);
  if (!clan || !membership) notFound();

  const members = await getClanMembers(clanId);
  const isAdmin = membership.role === "admin";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{clan.name}</h1>
          <p className="text-sm text-foreground-tertiary">
            {members.length}/{clan.maxSize} members
          </p>
        </div>
        {isAdmin && (
          <ClanSettingsSheet clanId={clanId} clanName={clan.name} inviteCode={clan.inviteCode} />
        )}
      </div>

      <section className="flex flex-col gap-1 rounded-xl border border-surface-border bg-surface p-5">
        <h2 className="mb-2 font-semibold text-foreground">Members</h2>
        <ul className="flex flex-col divide-y divide-surface-border">
          {members.map(({ user, role }) => (
            <li key={user.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.name} />
                <span className="text-sm text-foreground">
                  {user.name}
                  {role === "admin" && (
                    <span className="ml-2 rounded bg-background px-1.5 py-0.5 text-xs text-foreground-tertiary">
                      Admin
                    </span>
                  )}
                </span>
              </div>
              {isAdmin && user.id !== userId && (
                <form action={removeMember.bind(null, clanId, user.id)}>
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Remove
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
