import { auth } from "@clerk/nextjs/server";
import { getCommentsForCheckIns } from "@/features/comments";
import { FEED_PAGE_SIZE, getClanFeed } from "@/features/check-ins";
import { getClanMembers } from "@/features/clans";
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
    />
  );
}
