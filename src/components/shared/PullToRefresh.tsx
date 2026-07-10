"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

/**
 * Touch-driven pull-to-refresh, since PWA installs don't get a consistent native gesture across
 * iOS/Android. Re-fetches the current route's server data via router.refresh() rather than a
 * full page reload, so scroll position and open client state elsewhere survive.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    if (pending) return;

    function handleTouchStart(event: TouchEvent) {
      if (window.scrollY > 0) return;
      // Don't hijack pulls that start inside an open BottomSheet (e.g. scrolling its own list).
      if (event.target instanceof Element && event.target.closest('[role="dialog"]')) return;
      startY.current = event.touches[0].clientY;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startY.current === null) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        startY.current = null;
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      event.preventDefault();
      const next = Math.min(delta * 0.5, MAX_PULL);
      distanceRef.current = next;
      setPullDistance(next);
    }

    function handleTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (distanceRef.current >= PULL_THRESHOLD) {
        startTransition(() => router.refresh());
      }
      distanceRef.current = 0;
      setPullDistance(0);
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pending, router]);

  const showIndicator = pullDistance > 0 || pending;

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pending ? PULL_THRESHOLD : pullDistance }}
      >
        {showIndicator && (
          <RefreshCw
            size={20}
            className={`text-foreground-tertiary ${pending ? "animate-spin" : ""}`}
            style={!pending ? { transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` } : undefined}
          />
        )}
      </div>
      {children}
    </>
  );
}
