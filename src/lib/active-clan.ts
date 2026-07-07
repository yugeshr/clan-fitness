export type ClanOption = { id: string; name: string };

export const ACTIVE_CLAN_STORAGE_KEY = "active-clan-id";

/** Extracts the clan id segment from a pathname like "/clans/abc-123" or "/clans/abc-123/manage". */
export function parseClanIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/clans\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Resolves which clan the nav/switcher should treat as "current": the pathname (if it names a
 * real clan — this also correctly rejects sibling routes like /clans/new and /clans/join, which
 * would otherwise misparse as a clan id), else `storedClanId` (the last one the user actively
 * switched to), else just the first clan. Single-clan accounts need no special-casing: the last
 * tier always resolves.
 *
 * Deliberately pure — takes `storedClanId` as a parameter instead of reading localStorage itself,
 * so it produces identical output on the server and during client hydration (no `window` access
 * means no first-render mismatch). Callers read localStorage in a useEffect and pass the result
 * in, same pattern as BottomNav's existing `seenAt` state.
 */
export function resolveActiveClanId(
  pathname: string,
  clans: ClanOption[],
  storedClanId?: string | null,
): string | null {
  const fromPath = parseClanIdFromPathname(pathname);
  if (fromPath && clans.some((c) => c.id === fromPath)) return fromPath;
  if (storedClanId && clans.some((c) => c.id === storedClanId)) return storedClanId;
  return clans[0]?.id ?? null;
}
