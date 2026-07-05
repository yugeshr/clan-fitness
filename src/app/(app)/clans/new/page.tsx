import { CreateClanForm } from "@/features/clans";

export default function NewClanPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Create a clan</h1>
      <CreateClanForm />
    </div>
  );
}
