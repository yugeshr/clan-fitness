"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export type PushSupport = "checking" | "supported" | "unsupported";

/** Shared client-side push subscription state, used by both the manual opt-in UI and the auto-prompt on app load. */
export function usePushSubscription() {
  const [support, setSupport] = useState<PushSupport>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    // Feature detection can only run client-side after mount; SSR must render the "checking" state first.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupport("unsupported");
      return;
    }
    setSupport("supported");
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => {});
  }, []);

  async function subscribe(): Promise<boolean> {
    setPending(true);
    setError(undefined);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const { error: actionError } = await subscribeToPush(
        sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } },
      );
      if (actionError) {
        await sub.unsubscribe();
        setError(actionError);
        return false;
      }
      setSubscription(sub);
      return true;
    } catch {
      setError("Couldn't enable notifications. Check your browser's notification permissions.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    if (!subscription) return;
    setPending(true);
    try {
      await unsubscribeFromPush(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
    } finally {
      setPending(false);
    }
  }

  return { support, subscription, pending, error, subscribe, unsubscribe };
}
