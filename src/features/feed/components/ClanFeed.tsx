import { auth } from "@clerk/nextjs/server";
import { getCommentsForCheckIns } from "@/features/comments";
import { FEED_PAGE_SIZE, getCheckInById, getClanFeed } from "@/features/check-ins";
import { getClanMembers } from "@/features/clans";
import { getReactionsForCheckIns } from "@/features/reactions";
import { FeedList } from "./FeedList";

export async function ClanFeed({ clanId, highlightCheckInId }: { clanId: string; highlightCheckInId?: string }) {
  const { userId } = await auth();

  // A notification can deep-link to a check-in older than what the default (latest) page would
  // include. Anchor the very first page just after it instead, so it's guaranteed to be present
  // without needing unbounded "load more" clicks — this does mean anything newer than the
  // highlighted check-in won't be shown in this view; the Feed tab always has the true latest.
  let rows;
  if (highlightCheckInId) {
    const target = await getCheckInById(highlightCheckInId);
    rows = target
      ? await getClanFeed(clanId, new Date(target.createdAt.getTime() + 1))
      : await getClanFeed(clanId);
  } else {
    rows = await getClanFeed(clanId);
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground-tertiary">No check-ins yet — be the first to log today.</p>
    );
  }

  const checkInIds = rows.map((row) => row.checkIn.id);
  const [reactions, comments, members] = await Promise.all([
    userId ? getReactionsForCheckIns(checkInIds, userId) : Promise.resolve({}),
    getCommentsForCheckIns(checkInIds),
    getClanMembers(clanId),
  ]);
  const clanMembers = members.map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl }));

  return (
    <FeedList
      clanId={clanId}
      currentUserId={userId}
      clanMembers={clanMembers}
      initialRows={rows}
      initialReactions={reactions}
      initialComments={comments}
      initialHasMore={rows.length === FEED_PAGE_SIZE}
      highlightCheckInId={highlightCheckInId}
    />
  );
}
