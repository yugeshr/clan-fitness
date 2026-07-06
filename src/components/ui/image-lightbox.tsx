"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ImageLightbox({
  src,
  alt = "",
  onClose,
}: {
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  const open = src !== null;
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Cache the last non-null src so the exit transition still has an image to fade out, since
  // `src` itself goes back to null before the unmount timeout below fires — same justified
  // exception as the mount/visible machinery below: this mirrors an external prop transition
  // over time, not a plain derivation available during a single render.
  useEffect(() => {
    if (src) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplaySrc(src);
    }
  }, [src]);

  // Mount/unmount is staggered around the CSS transition (enter: mount then animate next frame;
  // exit: animate then unmount after the transition duration) — inherently timing-driven, not derivable during render.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted || !displaySrc) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/90 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        className={`relative mx-auto mt-[10vh] h-[80vh] w-[92vw] max-w-3xl transition-[opacity,transform] duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <Image src={displaySrc} alt={alt} fill sizes="92vw" className="object-contain" />
      </div>
      <button
        type="button"
        ref={closeRef}
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 -m-2.5 rounded-full bg-surface p-2.5 text-foreground shadow-[4px_4px_0_0_var(--edge)] hover:text-accent"
      >
        <X size={22} />
      </button>
    </div>,
    document.body,
  );
}
