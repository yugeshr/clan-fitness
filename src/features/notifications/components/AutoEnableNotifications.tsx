"use client";

import { useEffect, useRef } from "react";
import { hasBeenPrompted, markPrompted } from "../prompted";
import { usePushSubscription } from "../usePushSubscription";

/**
 * Silently subscribes existing users to push the first time they load the app after this
 * feature shipped, instead of waiting for a manual opt-in. Only fires once per browser
 * (tracked in localStorage) and is a no-op for anyone who already went through the
 * onboarding prompt, already has a subscription, or already denied notifications.
 */
export function AutoEnableNotifications() {
  const { support, subscription, subscribe } = usePushSubscription();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || support !== "supported" || subscription) return;
    if (hasBeenPrompted()) return;
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      markPrompted();
      return;
    }
    attempted.current = true;
    subscribe().finally(markPrompted);
    // subscribe is intentionally excluded: it's a fresh function on every render and this
    // effect must only ever run the single time `support`/`subscription` settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [support, subscription]);

  return null;
}
