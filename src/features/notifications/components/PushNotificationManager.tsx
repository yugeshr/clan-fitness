"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendTestNotification } from "../actions";
import { markPrompted } from "../prompted";
import { usePushSubscription } from "../usePushSubscription";

export function PushNotificationManager({ className = "" }: { className?: string }) {
  const { support, subscription, pending, error, subscribe, unsubscribe } = usePushSubscription();
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testError, setTestError] = useState<string>();

  async function handleEnable() {
    await subscribe();
    markPrompted();
  }

  async function handleSendTest() {
    setTestState("sending");
    setTestError(undefined);
    const result = await sendTestNotification();
    if (result.error) {
      setTestError(result.error);
      setTestState("error");
      return;
    }
    setTestState("sent");
  }

  if (support === "checking" || support === "unsupported") return null;

  if (support === "ios-needs-install") {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <p className="text-sm text-foreground-secondary">
          To get notifications on iPhone or iPad, add Clan Fitness to your Home Screen first: tap the
          Share button, then &quot;Add to Home Screen&quot;. Open it from there to turn notifications on.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {subscription ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground-secondary">Notifications are on for this device.</p>
            <Button type="button" variant="secondary" onClick={unsubscribe} disabled={pending}>
              Turn off
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground-tertiary">
              {testState === "sent" ? "Sent — check your notifications." : "Not sure it's working?"}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSendTest}
              disabled={testState === "sending"}
            >
              {testState === "sending" ? "Sending…" : "Send test notification"}
            </Button>
          </div>
          {testError && <p className="text-sm text-danger">{testError}</p>}
        </>
      ) : (
        <Button type="button" onClick={handleEnable} disabled={pending}>
          Enable notifications
        </Button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
