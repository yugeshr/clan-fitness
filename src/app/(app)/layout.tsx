import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { ClanSwitcher } from "@/components/shared/ClanSwitcher";
import { getUserClans } from "@/features/clans";
import { getUserGoals } from "@/features/goals";
import { AutoEnableNotifications } from "@/features/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const memberships = await getUserClans(userId);
  if (memberships.length === 0) redirect("/onboarding");

  const goals = await getUserGoals(userId);
  if (goals.length === 0) redirect("/onboarding/goals");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-3 sm:px-6">
        <Link
          href="/logs"
          className="shrink-0 font-sans text-lg font-bold tracking-tight text-foreground"
        >
          Clan <span className="text-accent">Fitness</span>
        </Link>
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <ClanSwitcher clans={memberships.map((m) => m.clan)} />
          <UserButton />
        </div>
      </header>
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</main>
      <BottomNav clanId={memberships[0]?.clan.id} />
      <AutoEnableNotifications />
    </div>
  );
}
