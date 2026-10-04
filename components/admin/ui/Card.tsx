import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

/** White surface with a hairline border and soft lift (spec 11 §4). */
export function Card({ as: Tag = "section", className, children, ...props }: { as?: "section" | "div" | "article" | "li"; className?: string; children: ReactNode; "aria-label"?: string; "aria-labelledby"?: string }) {
  return (
    <Tag className={cx("rounded-ui-lg border border-ui-border bg-ui-surface shadow-ui-card", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions, id, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-ui-border px-6 py-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-ui-section text-ui-text">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-ui-label text-ui-text-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardSection({ title, description, className, children }: { title?: ReactNode; description?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cx("px-6 py-4 [&+&]:border-t [&+&]:border-ui-border", className)}>
      {title ? <h3 className="text-ui-base text-ui-text">{title}</h3> : null}
      {description ? <p className="mt-0.5 text-ui-hint text-ui-text-3">{description}</p> : null}
      <div className={title || description ? "mt-3" : undefined}>{children}</div>
    </div>
  );
}

/** One KPI: label, big tabular value, and an optional sub-line, pill, sparkline or link (spec 11 §5.2). */
export function StatTile({ label, value, sub, extra, href }: { label: string; value: ReactNode; sub?: ReactNode; extra?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-ui-label font-medium text-ui-text-2">{label}</p>
        {href ? <ArrowUpRight aria-hidden className="size-4 text-ui-text-3 transition-colors group-hover:text-ui-accent" /> : null}
      </div>
      <div className="mt-2 text-ui-stat font-semibold text-ui-text tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-ui-label text-ui-text-3">{sub}</div> : null}
      {extra ? <div className="mt-3">{extra}</div> : null}
    </>
  );
  const frame = "block rounded-ui-lg border border-ui-border bg-ui-surface p-6 shadow-ui-card";
  return href ? (
    <Link href={href} className={cx(frame, "group transition-colors duration-150 hover:border-ui-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
