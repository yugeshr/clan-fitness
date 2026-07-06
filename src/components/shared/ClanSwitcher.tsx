"use client";

import { useRouter } from "next/navigation";

type ClanOption = { id: string; name: string };

export function ClanSwitcher({ clans, activeClanId }: { clans: ClanOption[]; activeClanId?: string }) {
  const router = useRouter();

  if (clans.length === 0) return null;
  if (clans.length === 1)
    return (
      <span className="block max-w-[40vw] truncate text-sm font-semibold text-foreground sm:max-w-none">
        {clans[0].name}
      </span>
    );

  return (
    <select
      className="max-w-[40vw] rounded-lg border border-surface-border bg-surface px-2 py-1 text-base text-foreground sm:max-w-none sm:text-sm"
      defaultValue={activeClanId ?? clans[0].id}
      onChange={(event) => router.push(`/clans/${event.target.value}`)}
    >
      {clans.map((clan) => (
        <option key={clan.id} value={clan.id}>
          {clan.name}
        </option>
      ))}
    </select>
  );
}
