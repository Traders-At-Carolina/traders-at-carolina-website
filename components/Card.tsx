import type { ReactNode } from "react";

/** White surface with a hairline border; no radius, no shadow (00 §10). */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`on-dark surface-graphite border border-rule p-6 md:p-8 ${className}`}>{children}</div>;
}
