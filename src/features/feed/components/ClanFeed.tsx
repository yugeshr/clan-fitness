import { auth } from "@clerk/nextjs/server";
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

  const reactions = userId
    ? await getReactionsForCheckIns(
        rows.map((row) => row.checkIn.id),
        userId,
      )
    : {};

  return (
    <FeedList
      clanId={clanId}
      initialRows={rows}
      initialReactions={reactions}
      initialHasMore={rows.length === FEED_PAGE_SIZE}
    />
  );
}
