"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  /** HTML tags only (JSX.IntrinsicElements also holds three.js elements via @react-three/fiber). */
  as?: keyof HTMLElementTagNameMap;
  children: ReactNode;
  className?: string;
};

/**
 * Fades content up 8px the first time it enters the viewport (00 §9.2).
 * Hidden styles apply only under html.js without reduced motion, so content is never stuck hidden.
 */
export function Reveal({ as = "div", children, className = "" }: RevealProps) {
  // Typed as "div" for JSX: a union of every HTML tag is too complex for TS. Any tag renders the same.
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
