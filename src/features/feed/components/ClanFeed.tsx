import { auth } from "@clerk/nextjs/server";
import { getCommentsForCheckIns } from "@/features/comments";
import { FEED_PAGE_SIZE, getClanFeed } from "@/features/check-ins";
import { getReactionsForCheckIns } from "@/features/reactions";
import { FeedList } from "./FeedList";

export async function ClanFeed({ clanId }: { clanId: string }) {
  const { userId } = await auth();
  const rows = await getClanFeed(clanId);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground-tertiary">No check-ins yet — be the first to log today.</p>
    );
  }

  const checkInIds = rows.map((row) => row.checkIn.id);
  const [reactions, comments] = await Promise.all([
    userId ? getReactionsForCheckIns(checkInIds, userId) : Promise.resolve({}),
    getCommentsForCheckIns(checkInIds),
  ]);

  return (
    <FeedList
      clanId={clanId}
      currentUserId={userId}
      initialRows={rows}
      initialReactions={reactions}
      initialComments={comments}
      initialHasMore={rows.length === FEED_PAGE_SIZE}
    />
  );
}
