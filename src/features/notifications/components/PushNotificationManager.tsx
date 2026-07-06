"use client";

import { Button } from "@/components/ui/button";
import { markPrompted } from "../prompted";
import { usePushSubscription } from "../usePushSubscription";

export function PushNotificationManager({ className = "" }: { className?: string }) {
  const { support, subscription, pending, error, subscribe, unsubscribe } = usePushSubscription();

  async function handleEnable() {
    await subscribe();
    markPrompted();
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-secondary">Notifications are on for this device.</p>
          <Button type="button" variant="secondary" onClick={unsubscribe} disabled={pending}>
            Turn off
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={handleEnable} disabled={pending}>
          Enable notifications
        </Button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
