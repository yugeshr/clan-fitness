"use client";

import { useEffect } from "react";

// `overflow: hidden` on body alone doesn't stop iOS Safari's touch-driven rubber-band scroll —
// it operates on the visual viewport independent of body's computed overflow. Pinning body in
// place with `position: fixed` (and restoring the scroll offset on unlock) is what actually holds
// the page still under a modal/lightbox/bottom-sheet on iOS.
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const scrollY = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
