"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { markPrompted } from "../prompted";
import { usePushSubscription } from "../usePushSubscription";

export function PushNotificationManager({
  onSkip,
  onSubscribed,
  className = "",
}: {
  /** Renders a "Not now" link alongside the enable button, e.g. during onboarding. */
  onSkip?: () => void;
  onSubscribed?: () => void;
  className?: string;
}) {
  const { support, subscription, pending, error, subscribe, unsubscribe } = usePushSubscription();
  const unsupportedHandled = useRef(false);

  useEffect(() => {
    if (support !== "unsupported" || unsupportedHandled.current) return;
    unsupportedHandled.current = true;
    markPrompted();
    onSkip?.();
    // Runs once, the moment support resolves to "unsupported" — onSkip is intentionally excluded
    // from deps so a fresh function identity from the parent doesn't refire it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [support]);

  async function handleEnable() {
    const subscribed = await subscribe();
    markPrompted();
    if (subscribed) onSubscribed?.();
  }

  function handleSkip() {
    markPrompted();
    onSkip?.();
  }

  if (support !== "supported") return null;

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
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleEnable} disabled={pending}>
            Enable notifications
          </Button>
          {onSkip && (
            <button type="button" onClick={handleSkip} className="text-sm text-foreground-tertiary underline">
              Not now
            </button>
          )}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
