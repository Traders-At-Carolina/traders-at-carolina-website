import { useEffect, type RefObject } from "react";

/** How far pages without a hero scroll before the name is fully tucked. */
export const TUCK_FALLBACK_DISTANCE = 120;

/**
 * Scrubs `--logo-tuck` (0–1) on the header as the page scrolls, so the header's name slides in behind
 * the logo mark (00 §10). It finishes where the bar floats: when the float point
 * (`[data-nav-float-point]`) reaches the header. Written straight to the element's style, so scrolling
 * never re-renders React. Under reduced motion it stays unset and the name never moves.
 */
export function useLogoTuck(headerRef: RefObject<HTMLElement | null>, routeKey: string) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let distance = TUCK_FALLBACK_DISTANCE;
    const measure = () => {
      const point = document.querySelector<HTMLElement>("[data-nav-float-point]");
      if (!point) return;
      const pointTop = point.getBoundingClientRect().top + window.scrollY;
      distance = Math.max(1, pointTop - header.offsetHeight);
    };

    // Scroll events already arrive at most once per frame, so there's nothing to throttle.
    const update = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / distance));
      header.style.setProperty("--logo-tuck", progress.toFixed(3));
    };

    const onResize = () => {
      measure();
      update();
    };

    onResize();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      header.style.removeProperty("--logo-tuck");
    };
  }, [headerRef, routeKey]);
}
