import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo, no benefit from next/image's raster pipeline */}
        <img src="/logo/clan-fitness-logo.svg" alt="Clan Fitness" className="h-9 w-auto" />
        <p className="text-sm text-foreground-secondary">
          Almost there — you&apos;ll pick or create your clan next.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
