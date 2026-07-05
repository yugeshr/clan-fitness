import { JoinClanForm } from "@/features/clans";

export default function JoinClanPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Join a clan</h1>
      <JoinClanForm />
    </div>
  );
}
