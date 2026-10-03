"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mobile-only action bar (spec 05 §4.1). It appears once the page header has scrolled away and hides again when
 * the footer comes into view, so it never covers the footer's own links. Renders nothing until then.
 */
export function StickyApply({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [pastHeader, setPastHeader] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const header = new IntersectionObserver(([entry]) => setPastHeader(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    const footer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting));
    if (sentinel.current) header.observe(sentinel.current);
    const footerEl = document.querySelector("footer");
    if (footerEl) footer.observe(footerEl);
    return () => {
      header.disconnect();
      footer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Zero-height marker at the end of the page header. */}
      <div ref={sentinel} aria-hidden="true" />
      {pastHeader && !atFooter ? (
        <div
          data-sticky-apply
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-bone/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
