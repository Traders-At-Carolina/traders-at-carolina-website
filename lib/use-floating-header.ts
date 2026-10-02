import { useEffect, useState, type RefObject } from "react";

/** Scroll distance that floats the header on pages with no `[data-nav-hero]` element. */
const FALLBACK_OFFSET = 80;

/**
 * True once the page's hero (`[data-nav-hero]`) has scrolled up behind the header (00 §10).
 * Re-binds whenever `routeKey` changes, because each route renders its own hero.
 */
export function useFloatingHeader(headerRef: RefObject<HTMLElement | null>, routeKey: string): boolean {
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-nav-hero]");

    if (hero && typeof IntersectionObserver !== "undefined") {
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const observer = new IntersectionObserver(
        ([entry]) => setFloating(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        { rootMargin: `-${headerHeight}px 0px 0px 0px` },
      );
      observer.observe(hero);
      return () => observer.disconnect();
    }

    const onScroll = () => setFloating(window.scrollY > FALLBACK_OFFSET);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerRef, routeKey]);

  return floating;
}
