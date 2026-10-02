import { useEffect, useState, type RefObject } from "react";

/**
 * True once the page's float point (`[data-nav-float-point]`, on the hero's first line of text)
 * has scrolled up behind the header; pages without one float as soon as they scroll (00 §10).
 * Re-binds whenever `routeKey` changes, because each route renders its own hero.
 */
export function useFloatingHeader(headerRef: RefObject<HTMLElement | null>, routeKey: string): boolean {
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const point = document.querySelector<HTMLElement>("[data-nav-float-point]");

    if (point && typeof IntersectionObserver !== "undefined") {
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const observer = new IntersectionObserver(
        // Out of view *above* the header line (not below the fold) means we've scrolled past it.
        ([entry]) => setFloating(!entry.isIntersecting && entry.boundingClientRect.top < headerHeight),
        { rootMargin: `-${headerHeight}px 0px 0px 0px` },
      );
      observer.observe(point);
      return () => observer.disconnect();
    }

    const onScroll = () => setFloating(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerRef, routeKey]);

  return floating;
}
