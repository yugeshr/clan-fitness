import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Clan <span className="text-accent">Fitness</span>
        </h1>
        <p className="text-sm text-foreground-secondary">
          Almost there — you&apos;ll pick or create your clan next.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
