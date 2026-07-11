"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
// Direct path, not the feature barrel (@/features/goals): that barrel also re-exports
// queries.ts's server-only functions (they import the Drizzle db client directly, no "use
// server"), and this component is a client-boundary root — importing through the barrel pulled
// the database driver into the browser bundle, crashing on navigation to this page.
import { GoalsForm } from "@/features/goals/components/GoalsForm";

export function ClanWelcomeActions({
  clanId,
  mode,
}: {
  clanId: string;
  mode: "goals" | "continue";
}) {
  const router = useRouter();

  if (mode === "continue") {
    return (
      <Link href={`/clans/${clanId}`} className="font-semibold text-accent">
        Continue to the feed →
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <GoalsForm onSuccess={() => router.push(`/clans/${clanId}`)} />
      <Link
        href={`/clans/${clanId}`}
        className="text-center text-sm text-foreground-tertiary hover:text-foreground"
      >
        Skip for now
      </Link>
    </div>
  );
}
