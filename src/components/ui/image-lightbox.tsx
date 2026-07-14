"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const open = images.length > 0;
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [displayImages, setDisplayImages] = useState(images);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Cache the last non-empty images so the exit transition still has something to fade out, since
  // `images` itself goes back to [] before the unmount timeout below fires — same justified
  // exception as the mount/visible machinery below: this mirrors an external prop transition
  // over time, not a plain derivation available during a single render.
  useEffect(() => {
    if (images.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayImages(images);
    }
  }, [images]);

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

  useScrollLock(mounted);

  useEffect(() => {
    if (!mounted) return;
    closeRef.current?.focus();
  }, [mounted]);

  // Positions the track at the tapped photo the instant the lightbox opens — no scroll animation,
  // since a slide-in-from-0 would look like a glitch rather than an intentional entrance.
  useEffect(() => {
    if (!mounted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(initialIndex);
    const el = trackRef.current;
    if (el) el.scrollLeft = initialIndex * el.clientWidth;
  }, [mounted, initialIndex]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, displayImages.length - 1));
    setActiveIndex(clamped);
    trackRef.current?.scrollTo({ left: clamped * (trackRef.current?.clientWidth ?? 0), behavior: "smooth" });
  }

  useEffect(() => {
    if (!mounted) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      else if (event.key === "ArrowRight") goTo(activeIndex + 1);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, onClose, activeIndex, displayImages.length]);

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  if (!mounted || displayImages.length === 0) return null;

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
        <div
          ref={trackRef}
          onScroll={displayImages.length > 1 ? handleScroll : undefined}
          className={`flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth ${
            displayImages.length > 1 ? "" : "overflow-x-hidden"
          }`}
        >
          {displayImages.map((src) => (
            <div key={src} className="relative h-full w-full shrink-0 snap-center">
              <Image src={src} alt="" fill sizes="92vw" className="object-contain" />
            </div>
          ))}
        </div>
      </div>

      {displayImages.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous photo"
              className="fixed left-4 top-1/2 z-20 -translate-y-1/2 -m-2.5 rounded-full bg-surface p-2.5 text-foreground shadow-[4px_4px_0_0_var(--edge)] hover:text-accent"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {activeIndex < displayImages.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next photo"
              className="fixed right-4 top-1/2 z-20 -translate-y-1/2 -m-2.5 rounded-full bg-surface p-2.5 text-foreground shadow-[4px_4px_0_0_var(--edge)] hover:text-accent"
            >
              <ChevronRight size={22} />
            </button>
          )}
          <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex justify-center gap-1.5">
            {displayImages.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === activeIndex ? "w-5 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

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
