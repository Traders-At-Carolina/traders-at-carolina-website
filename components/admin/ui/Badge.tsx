import type { ReactNode } from "react";
import { cx } from "./cx";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-ui-subtle text-ui-text-2", dot: "bg-ui-text-3" },
  accent: { pill: "bg-ui-accent-soft text-ui-accent", dot: "bg-ui-accent" },
  success: { pill: "bg-ui-success-soft text-ui-success", dot: "bg-ui-success" },
  warning: { pill: "bg-ui-warning-soft text-ui-warning", dot: "bg-ui-warning" },
  danger: { pill: "bg-ui-danger-soft text-ui-danger", dot: "bg-ui-danger" },
};

/** A small pill. With `dot`, a status dot leads the label; the label always carries the meaning (spec 11 §2.1). */
export function Badge({ tone = "neutral", dot = false, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-ui-full px-2 py-0.5 text-ui-hint font-medium whitespace-nowrap", TONES[tone].pill, className)}>
      {dot ? <span aria-hidden className={cx("size-1.5 rounded-ui-full", TONES[tone].dot)} /> : null}
      {children}
    </span>
  );
}

/** One map of status words to tones, so every screen colours them the same way. */
export const STATUS_TONES = {
  open: "success",
  live: "success",
  active: "success",
  approved: "success",
  closed: "neutral",
  hidden: "neutral",
  inactive: "neutral",
  expired: "neutral",
  declined: "neutral",
  scheduled: "warning",
  pending: "warning",
  alumni: "accent",
  pinned: "accent",
  featured: "accent",
} as const satisfies Record<string, Tone>;

export type Status = keyof typeof STATUS_TONES;

export function StatusPill({ status, children }: { status: Status; children?: ReactNode }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      {children ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
