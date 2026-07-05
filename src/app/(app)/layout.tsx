import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClanSwitcher } from "@/components/shared/ClanSwitcher";
import { getUserClans } from "@/features/clans";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const memberships = await getUserClans(userId);
  if (memberships.length === 0) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
        <Link href="/dashboard" className="font-bold">
          Clan Fitness
        </Link>
        <div className="flex items-center gap-4">
          <ClanSwitcher clans={memberships.map((m) => m.clan)} />
          <UserButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
