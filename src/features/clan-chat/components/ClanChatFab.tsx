"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";
import { useActiveClanId, type ClanOption } from "@/lib/active-clan";

export type ClanChatEntry = { clanId: string; latestMessageAt: Date | null };

function chatSeenKey(clanId: string) {
  return `clan-chat-seen:${clanId}`;
}

// Mounted globally (see (app)/layout.tsx) so chat is reachable from every page, not just the clan
// feed — same reasoning the old FeedbackFab had, just resolving *which* clan via useActiveClanId
// (the same resolver BottomNav/ClanSwitcher already use) since most pages this renders on aren't
// clan-scoped by URL.
export function ClanChatFab({
  clans,
  latestClanMessageAtByClan,
}: {
  clans: ClanOption[];
  latestClanMessageAtByClan: Promise<ClanChatEntry[]>;
}) {
  const pathname = usePathname();
  const clanId = useActiveClanId(pathname, clans);
  const [seenAt, setSeenAt] = useState<Date | null>(null);

  // Reads localStorage, which only exists in the browser — inherently can't be derived during render.
  useEffect(() => {
    if (!clanId) return;
    const stored = localStorage.getItem(chatSeenKey(clanId));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeenAt(stored ? new Date(stored) : null);
  }, [clanId]);

  if (!clanId || pathname === `/clans/${clanId}/chat`) return null;

  return (
    <Link
      href={`/clans/${clanId}/chat`}
      aria-label="Open clan chat"
      className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform active:scale-95 sm:bottom-6"
    >
      <MessageSquare size={22} />
      <Suspense fallback={null}>
        <ChatUnreadDot promise={latestClanMessageAtByClan} clanId={clanId} seenAt={seenAt} />
      </Suspense>
    </Link>
  );
}

/** Isolated so only this leaf ever suspends — the FAB itself renders immediately regardless. */
function ChatUnreadDot({
  promise,
  clanId,
  seenAt,
}: {
  promise: Promise<ClanChatEntry[]>;
  clanId: string;
  seenAt: Date | null;
}) {
  const entries = use(promise);
  const latestMessageAt = entries.find((e) => e.clanId === clanId)?.latestMessageAt ?? null;
  const hasUnread = !!latestMessageAt && (!seenAt || seenAt < latestMessageAt);
  if (!hasUnread) return null;
  return <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger" />;
}
