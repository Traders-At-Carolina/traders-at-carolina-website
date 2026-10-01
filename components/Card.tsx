import type { ReactNode } from "react";

/** White surface with a hairline border; no radius, no shadow (00 §10). */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-rule bg-white p-6 md:p-8 ${className}`}>{children}</div>;
}
