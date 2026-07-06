import { JoinClanForm } from "@/features/clans";

export default async function JoinClanPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">Join a clan</h1>
      <JoinClanForm defaultInviteCode={code} />
    </div>
  );
}
