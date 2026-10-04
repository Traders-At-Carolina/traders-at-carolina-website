import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RefreshButton } from "@/components/admin/analytics/RefreshButton";
import {
  ActivesTile,
  CardSkeleton,
  LiveTile,
  NotConnectedBanner,
  SummaryTiles,
  TileSkeleton,
  TopClicksCard,
  TopPagesCard,
  TopReferrersCard,
  TrendCard,
  UpdatedAt,
} from "@/components/admin/analytics/sections";
import { buttonClasses } from "@/components/admin/ui/Button";
import { cx } from "@/components/admin/ui/cx";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { RANGES, parseRange, posthogEnv, posthogProjectUrl, type Range } from "@/lib/analytics/query";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "Analytics" };

/** 7d / 30d / 90d as a segmented control of links (`?range=`), so a range is bookmarkable. */
function RangeLinks({ current }: { current: Range }) {
  return (
    <nav aria-label="Date range">
      <ul className="flex rounded-ui-md border border-ui-border bg-ui-surface p-0.5 shadow-ui-card">
        {RANGES.map((r) => (
          <li key={r}>
            <Link
              href={r === 7 ? "/admin/analytics" : `/admin/analytics?range=${r}`}
              aria-current={r === current ? "page" : undefined}
              className={cx(
                "flex h-7 items-center rounded-ui-sm px-2.5 text-ui-label font-medium tabular-nums transition-colors duration-150",
                r === current ? "bg-ui-accent-soft text-ui-accent" : "text-ui-text-2 hover:bg-ui-subtle hover:text-ui-text",
              )}
            >
              {r}d<span className="sr-only"> (last {r} days)</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Analytics (spec 06 §7.2, spec 11 phase E). Every section streams in its own Suspense boundary and reports its own
 * failure, so a slow or broken PostHog query never takes the page down.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePage();
  const range = parseRange((await searchParams).range);
  const connected = posthogEnv() !== null;
  const posthogUrl = posthogProjectUrl();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Anonymous visitor numbers for the public site, production traffic only."
        actions={
          <>
            <Suspense fallback={null}>
              <UpdatedAt range={range} />
            </Suspense>
            <RefreshButton />
            <RangeLinks current={range} />
            {posthogUrl ? (
              <a href={posthogUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                Open in PostHog
                <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </>
        }
      />

      {connected ? null : <NotConnectedBanner className="mb-6" />}

      <section aria-label="Key numbers" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Suspense fallback={<TileSkeleton />}>
          <LiveTile />
        </Suspense>
        <Suspense
          fallback={
            <>
              <TileSkeleton />
              <TileSkeleton />
              <TileSkeleton />
              <TileSkeleton />
            </>
          }
        >
          <SummaryTiles range={range} />
        </Suspense>
        <Suspense fallback={<TileSkeleton />}>
          <ActivesTile />
        </Suspense>
      </section>

      <div className="mb-6">
        <Suspense fallback={<CardSkeleton id="trend" title="Trend" chart />}>
          <TrendCard range={range} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<CardSkeleton id="top-pages" title="Top pages" />}>
          <TopPagesCard range={range} />
        </Suspense>
        <Suspense fallback={<CardSkeleton id="top-clicks" title="Top clicks" />}>
          <TopClicksCard range={range} />
        </Suspense>
        <Suspense fallback={<CardSkeleton id="top-referrers" title="Top referrers" />}>
          <TopReferrersCard range={range} />
        </Suspense>
      </div>
    </>
  );
}
