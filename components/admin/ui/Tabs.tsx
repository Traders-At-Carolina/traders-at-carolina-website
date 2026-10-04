import Link from "next/link";
import { cx } from "./cx";

export type TabItem = { href: string; label: string; count?: number; current: boolean };

/** Link tabs driven by `?tab=` (spec 11 §4): bookmarkable, no client state. The caller marks the current one. */
export function Tabs({ tabs, label, className }: { tabs: TabItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cx("mb-6 border-b border-ui-border", className)}>
      <ul className="-mb-px flex gap-5 overflow-x-auto">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cx(
                "flex h-10 items-center gap-2 border-b-2 text-ui-base font-medium whitespace-nowrap transition-colors duration-150",
                tab.current ? "border-ui-accent text-ui-text" : "border-transparent text-ui-text-2 hover:border-ui-border-strong hover:text-ui-text",
              )}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span className={cx("rounded-ui-full px-1.5 text-ui-hint tabular-nums", tab.current ? "bg-ui-accent-soft text-ui-accent" : "bg-ui-subtle text-ui-text-2")}>{tab.count}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
