import { CircleCheck, Info, type LucideIcon, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./cx";

const BANNERS = {
  info: { icon: Info, frame: "border-ui-accent/25 bg-ui-accent-soft", iconClass: "text-ui-accent" },
  success: { icon: CircleCheck, frame: "border-ui-success/25 bg-ui-success-soft", iconClass: "text-ui-success" },
  warning: { icon: TriangleAlert, frame: "border-ui-warning/25 bg-ui-warning-soft", iconClass: "text-ui-warning" },
  danger: { icon: TriangleAlert, frame: "border-ui-danger/25 bg-ui-danger-soft", iconClass: "text-ui-danger" },
} as const;

/** An inline notice, such as spec 06 §6.0's "Hidden until…" hints. */
export function Banner({ tone = "info", title, action, className, children }: { tone?: keyof typeof BANNERS; title?: ReactNode; action?: ReactNode; className?: string; children?: ReactNode }) {
  const { icon: Icon, frame, iconClass } = BANNERS[tone];
  return (
    <div className={cx("flex items-start gap-3 rounded-ui-md border px-4 py-3", frame, className)}>
      <Icon aria-hidden className={cx("mt-0.5 size-4 shrink-0", iconClass)} />
      <div className="min-w-0 flex-1 text-ui-base text-ui-text">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 text-ui-text-2" : undefined}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** An icon, one sentence and a primary action, for empty lists. */
export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-ui-full bg-ui-subtle text-ui-text-3">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="mt-3 text-ui-base font-medium text-ui-text">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-ui-label text-ui-text-2">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** A grey placeholder block for loading.tsx files. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-ui-md bg-ui-subtle", className)} />;
}
