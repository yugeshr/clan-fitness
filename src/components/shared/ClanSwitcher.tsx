"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIVE_CLAN_STORAGE_KEY, resolveActiveClanId, type ClanOption } from "@/lib/active-clan";

const CREATE_SENTINEL = "__create__";
const JOIN_SENTINEL = "__join__";

export function ClanSwitcher({ clans }: { clans: ClanOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  // Starts null (matches server render) — only reads localStorage after mount, so the pathname
  // tier alone determines the value during SSR/hydration. See resolveActiveClanId's docs.
  const [storedClanId, setStoredClanId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoredClanId(localStorage.getItem(ACTIVE_CLAN_STORAGE_KEY));
  }, []);

  if (clans.length === 0) return null;

  const currentClanId = resolveActiveClanId(pathname, clans, storedClanId);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === CREATE_SENTINEL) router.push("/clans/new");
    else if (value === JOIN_SENTINEL) router.push("/clans/join");
    else router.push(`/clans/${value}`);
  }

  return (
    <select
      className="max-w-[40vw] rounded-lg border border-surface-border bg-surface px-2 py-1 text-base text-foreground sm:max-w-none sm:text-sm"
      value={currentClanId ?? clans[0].id}
      onChange={handleChange}
    >
      {clans.map((clan) => (
        <option key={clan.id} value={clan.id}>
          {clan.name}
        </option>
      ))}
      <option value={CREATE_SENTINEL}>+ Create a clan</option>
      <option value={JOIN_SENTINEL}>+ Join with invite code</option>
    </select>
  );
}
