"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Mount/unmount is staggered around the CSS transition (enter: mount then animate next frame;
  // exit: animate then unmount after the transition duration) — inherently timing-driven, not derivable during render.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      // Nested rAF, not a single one: a single rAF can still land in the same paint as the mount
      // (React may batch the "closed" and "open" states together), so the browser sometimes skips
      // straight to the end state instead of animating. The second rAF guarantees the closed state
      // (translate-y-full) has actually been painted at least once before switching to open.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(timeout);
  }, [open]);

  useScrollLock(mounted);

  useEffect(() => {
    if (!mounted) return;
    headingRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className={`relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border-t border-surface-border bg-surface p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-transform duration-200 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 id="bottom-sheet-title" ref={headingRef} tabIndex={-1} className="font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2.5 p-2.5 text-foreground-tertiary hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
