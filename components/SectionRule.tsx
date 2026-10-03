"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Grid } from "@/components/Container";

/**
 * Section header frame: a hairline that draws left to right and a "§ 01" eyebrow that wipes in behind it, the first
 * time the header enters the viewport (00 §9.2). Without JS or under reduced motion the rule and eyebrow are simply shown.
 */
export function SectionRule({ inverse, children }: { inverse: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-drawn");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.classList.add("is-drawn");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="section-marker relative">
      <span aria-hidden="true" className={`section-rule absolute inset-x-0 top-0 h-px ${inverse ? "bg-rule-inverse" : "bg-rule"}`} />
      <Grid className="pt-6 md:pt-8">{children}</Grid>
    </div>
  );
}
