import type { ReactNode } from "react";

type EyebrowProps = {
  /** Section number; renders "§ 01 — LABEL". Omit for unnumbered labels. */
  index?: number;
  children: ReactNode;
  tone?: "default" | "inverse";
  className?: string;
};

/** Uppercase navy label above headings (00 §5.2, §7.1). */
export function Eyebrow({ index, children, tone = "default", className = "" }: EyebrowProps) {
  const label = index === undefined ? children : `§ ${String(index).padStart(2, "0")} — ${children}`;
  return <p className={`eyebrow ${tone === "inverse" ? "text-bone" : ""} ${className}`}>{label}</p>;
}
