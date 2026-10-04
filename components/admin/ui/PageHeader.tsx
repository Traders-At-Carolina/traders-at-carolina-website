"use client";

import { ArrowUpRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { screenFor, sectionFor } from "@/lib/admin/nav";
import { buttonClasses } from "./Button";

/**
 * Eyebrow, title, description, actions and "View on site" (spec 11 §4, §5.5). The eyebrow names the section ("Admin" on
 * Overview); on a screen's sub-pages a breadcrumb leads back to the screen. Both come from the nav map; pass `siteHref`
 * for a more specific page, `false` to hide it, or `crumb` to name the item.
 */
export function PageHeader({ title, description, actions, crumb, siteHref }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; crumb?: string; siteHref?: string | false }) {
  const pathname = usePathname();
  const screen = screenFor(pathname);
  const section = sectionFor(pathname);
  const site = siteHref === false ? undefined : (siteHref ?? screen?.siteHref);
  const isOverview = screen?.href === "/admin";
  const onSubPage = screen && !isOverview && pathname !== screen.href;

  return (
    <header className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{isOverview ? "Admin" : section.label}</p>
        {onSubPage ? (
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex flex-wrap items-center gap-1 text-ui-label text-ui-text-3">
              <li>
                <Link href={screen.href} className="hover:text-ui-text">
                  {screen.label}
                </Link>
              </li>
              {crumb ? (
                <>
                  <li aria-hidden>
                    <ChevronRight className="size-3.5" />
                  </li>
                  <li aria-current="page" className="max-w-64 truncate">
                    {crumb}
                  </li>
                </>
              ) : null}
            </ol>
          </nav>
        ) : null}
        <h1 className="mt-2 text-ui-title text-ui-text">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-ui-base text-ui-text-2">{description}</p> : null}
      </div>
      {actions || site ? (
        <div className="flex flex-wrap items-center gap-2">
          {site ? (
            <a href={site} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              View on site
              <ArrowUpRight aria-hidden className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
