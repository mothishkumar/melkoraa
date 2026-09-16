"use client";

import { useCallback, useEffect } from "react";

function lockDocumentScroll() {
  const html = document.documentElement;
  const body = document.body;
  const scrollY = window.scrollY;
  html.dataset.introLock = "1";
  html.style.overflow = "hidden";
  html.style.height = "100%";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.touchAction = "none";
  body.dataset.introScrollY = String(scrollY);
}

function unlockDocumentScroll() {
  const html = document.documentElement;
  const body = document.body;
  if (html.dataset.introLock !== "1") return;
  const scrollY = Number(body.dataset.introScrollY || "0");
  delete html.dataset.introLock;
  html.style.overflow = "";
  html.style.height = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.touchAction = "";
  delete body.dataset.introScrollY;
  window.scrollTo(0, scrollY);
}

export function useIntroScrollLock(active: boolean) {
  const preventTouch = useCallback((event: TouchEvent) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (!active) return;
    lockDocumentScroll();
    document.addEventListener("touchmove", preventTouch, { passive: false });
    return () => {
      document.removeEventListener("touchmove", preventTouch);
      unlockDocumentScroll();
    };
  }, [active, preventTouch]);

  return unlockDocumentScroll;
}
