"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoalsForm } from "@/features/goals";
import { PushNotificationManager } from "@/features/notifications";

export function GoalsAndNotificationsFlow() {
  const [step, setStep] = useState<"goals" | "notifications">("goals");
  const router = useRouter();
  const continueToApp = () => router.push("/logs");

  if (step === "notifications") {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stay in the loop</h1>
          <p className="text-foreground-secondary">
            Get notified when your clan checks in or reacts to your logs.
          </p>
        </div>
        <PushNotificationManager onSkip={continueToApp} onSubscribed={continueToApp} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Set your goals</h1>
        <p className="text-foreground-secondary">
          Pick a weekly gym target and daily step goal. You can change these anytime from Profile.
        </p>
      </div>
      <GoalsForm onSuccess={() => setStep("notifications")} />
    </div>
  );
}
