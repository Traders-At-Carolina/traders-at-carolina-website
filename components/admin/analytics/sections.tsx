import type { ReactNode } from "react";
import { BarChart3, MousePointerClick, Globe } from "lucide-react";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardHeader, StatTile } from "@/components/admin/ui/Card";
import { Banner, EmptyState, Skeleton } from "@/components/admin/ui/Feedback";
import { TBody, TD, TH, THead, TR, Table } from "@/components/admin/ui/Table";
import {
  getActives,
  getApplyClicks,
  getLiveNow,
  getSummary,
  getTopClicks,
  getTopPages,
  getTopReferrers,
  getTrend,
  type QueryFailure,
  type Range,
} from "@/lib/analytics/query";
import { formatCount, formatDuration, formatPercent, formatUpdated } from "./format";
import { Sparkline } from "./Sparkline";
import { TrendChart } from "./TrendChart";

// Each export here is one independently streamed section (spec 06 §7.2 "Each section loads on its own").

/** The full "not connected" explanation, shown once at the top of the page. */
export function NotConnectedBanner({ className }: { className?: string }) {
  return (
    <Banner tone="info" title="Analytics isn't connected yet" className={className}>
      Add <code className="font-mono text-ui-label">POSTHOG_PERSONAL_API_KEY</code> (a PostHog personal API key with only the Query Read scope) and{" "}
      <code className="font-mono text-ui-label">POSTHOG_PROJECT_ID</code> to the Vercel environment variables, then redeploy. Visitor numbers appear here once they&apos;re set.
    </Banner>
  );
}

/** What a failed section says: calm when not configured, a danger notice when PostHog failed. */
export function SectionNotice({ failure, className }: { failure: QueryFailure; className?: string }) {
  return failure.reason === "not-configured" ? (
    <Banner tone="info" className={className}>
      Analytics isn&apos;t connected yet.
    </Banner>
  ) : (
    <Banner tone="danger" title="Couldn't load this from PostHog" className={className}>
      {failure.message ?? "Try again in a minute."}
    </Banner>
  );
}

const muted = (text: string) => <span className="text-ui-base font-normal text-ui-text-3">{text}</span>;
const failedValue = (failure: QueryFailure) => muted(failure.reason === "not-configured" ? "Not connected" : "Unavailable");

// ── KPI row ──

export function TileSkeleton() {
  return (
    <div className="rounded-ui-lg border border-ui-border bg-ui-surface p-5 shadow-ui-card">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}

export async function LiveTile({ href }: { href?: string }) {
  const live = await getLiveNow();
  return (
    <StatTile
      label="Live now"
      value={live.ok ? formatCount(live.data) : failedValue(live)}
      sub={live.ok ? "Visitors in the last 5 minutes" : undefined}
      href={href}
    />
  );
}

export async function SummaryTiles({ range }: { range: Range }) {
  const summary = await getSummary(range);
  const sub = `Last ${range} days`;
  if (!summary.ok) {
    const value = failedValue(summary);
    return (
      <>
        <StatTile label="Visitors" value={value} />
        <StatTile label="Pageviews" value={value} />
        <StatTile label="Avg session" value={value} />
        <StatTile label="Bounce rate" value={value} />
      </>
    );
  }
  const { visitors, pageviews, sessions, avgSessionSeconds, bounceRate } = summary.data;
  return (
    <>
      <StatTile label="Visitors" value={formatCount(visitors)} sub={sub} />
      <StatTile label="Pageviews" value={formatCount(pageviews)} sub={sub} />
      <StatTile label="Avg session" value={formatDuration(avgSessionSeconds)} sub={`${formatCount(sessions)} sessions`} />
      <StatTile label="Bounce rate" value={sessions > 0 ? formatPercent(bounceRate) : "—"} sub="Sessions with one page" />
    </>
  );
}

export async function ActivesTile() {
  const actives = await getActives();
  return (
    <StatTile
      label="DAU / WAU / MAU"
      value={actives.ok ? `${formatCount(actives.data.dau)} / ${formatCount(actives.data.wau)} / ${formatCount(actives.data.mau)}` : failedValue(actives)}
      sub={actives.ok ? "Active visitors: day, week, month" : undefined}
    />
  );
}

/** "Updated N min ago", from the summary query's cache time. */
export async function UpdatedAt({ range }: { range: Range }) {
  const summary = await getSummary(range);
  if (!summary.ok) return null;
  return (
    <time dateTime={new Date(summary.fetchedAt).toISOString()} className="text-ui-label text-ui-text-3 tabular-nums">
      {formatUpdated(summary.fetchedAt)}
    </time>
  );
}

// ── Cards ──

function SectionCard({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} className="self-start">
      <CardHeader id={id} title={title} description={description} />
      {children}
    </Card>
  );
}

export function CardSkeleton({ id, title, rows = 5, chart = false }: { id: string; title: string; rows?: number; chart?: boolean }) {
  return (
    <SectionCard id={id} title={title}>
      <div className="space-y-3 px-5 py-4" aria-busy>
        {chart ? <Skeleton className="h-44 w-full" /> : Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        <span className="sr-only">Loading…</span>
      </div>
    </SectionCard>
  );
}

export async function TrendCard({ range }: { range: Range }) {
  const trend = await getTrend(range);
  return (
    <SectionCard id="trend" title="Trend" description={`Visitors and pageviews per day, last ${range} days.`}>
      {trend.ok ? <TrendChart points={trend.data} /> : <SectionNotice failure={trend} className="m-5" />}
    </SectionCard>
  );
}

const rank = "w-10 text-ui-text-3 tabular-nums";

export async function TopPagesCard({ range }: { range: Range }) {
  const pages = await getTopPages(range);
  const showTime = pages.ok && pages.data.some((p) => p.medianSeconds !== null);
  return (
    <SectionCard id="top-pages" title="Top pages" description="By pageviews.">
      {!pages.ok ? (
        <SectionNotice failure={pages} className="m-5" />
      ) : pages.data.length === 0 ? (
        <EmptyState icon={BarChart3} title="No pageviews yet" description="Pages show up here once visitors arrive." />
      ) : (
        <Table>
          <caption className="sr-only">Top pages by pageviews</caption>
          <THead>
            <TR>
              <TH className={rank}>#</TH>
              <TH>Page</TH>
              <TH className="text-right">Views</TH>
              <TH className="text-right">Visitors</TH>
              {showTime ? <TH className="text-right">Median time</TH> : null}
            </TR>
          </THead>
          <TBody>
            {pages.data.map((p, i) => (
              <TR key={p.path}>
                <TD className={rank}>{i + 1}</TD>
                <TD className="max-w-56 truncate font-mono text-ui-label" title={p.path}>
                  {p.path}
                </TD>
                <TD className="text-right tabular-nums">{formatCount(p.views)}</TD>
                <TD className="text-right tabular-nums">{formatCount(p.visitors)}</TD>
                {showTime ? <TD className="text-right text-ui-text-2 tabular-nums">{p.medianSeconds === null ? "—" : formatDuration(p.medianSeconds)}</TD> : null}
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </SectionCard>
  );
}

export async function TopClicksCard({ range }: { range: Range }) {
  const clicks = await getTopClicks(range);
  return (
    <SectionCard id="top-clicks" title="Top clicks" description="Named links and buttons, by CTA and target.">
      {!clicks.ok ? (
        <SectionNotice failure={clicks} className="m-5" />
      ) : clicks.data.length === 0 ? (
        <EmptyState icon={MousePointerClick} title="No clicks yet" description="Apply buttons, nav, sponsor and LinkedIn links show up here." />
      ) : (
        <Table>
          <caption className="sr-only">Top clicks by CTA and target</caption>
          <THead>
            <TR>
              <TH className={rank}>#</TH>
              <TH>CTA · target</TH>
              <TH className="text-right">Clicks</TH>
            </TR>
          </THead>
          <TBody>
            {clicks.data.map((c, i) => (
              <TR key={`${c.cta}\u0000${c.target}`}>
                <TD className={rank}>{i + 1}</TD>
                <TD>
                  <span className="font-medium">{c.cta}</span>
                  {c.target ? <span className="text-ui-text-2"> · {c.target}</span> : null}
                </TD>
                <TD className="text-right tabular-nums">{formatCount(c.clicks)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </SectionCard>
  );
}

export async function TopReferrersCard({ range }: { range: Range }) {
  const referrers = await getTopReferrers(range);
  return (
    <SectionCard id="top-referrers" title="Top referrers" description="Where visitors came from.">
      {!referrers.ok ? (
        <SectionNotice failure={referrers} className="m-5" />
      ) : referrers.data.length === 0 ? (
        <EmptyState icon={Globe} title="No visitors yet" description="Referring sites show up here." />
      ) : (
        <Table>
          <caption className="sr-only">Top referrers by visitors</caption>
          <THead>
            <TR>
              <TH className={rank}>#</TH>
              <TH>Source</TH>
              <TH>Channel</TH>
              <TH className="text-right">Visitors</TH>
            </TR>
          </THead>
          <TBody>
            {referrers.data.map((r, i) => (
              <TR key={r.domain}>
                <TD className={rank}>{i + 1}</TD>
                <TD className="max-w-48 truncate" title={r.domain}>
                  {r.domain}
                </TD>
                <TD>
                  <Badge tone={r.channel === "Search" || r.channel === "Social" ? "accent" : "neutral"}>{r.channel}</Badge>
                </TD>
                <TD className="text-right tabular-nums">{formatCount(r.visitors)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </SectionCard>
  );
}

// ── Overview visitors row (spec 06 §6.1, spec 11 §5.2 item 3) ──

export async function OverviewVisitorTiles() {
  const [summary, trend, apply] = await Promise.all([getSummary(7), getTrend(7), getApplyClicks(7)]);
  return (
    <>
      <StatTile
        label="Visitors · 7 days"
        value={summary.ok ? formatCount(summary.data.visitors) : failedValue(summary)}
        extra={trend.ok ? <Sparkline values={trend.data.map((p) => p.visitors)} /> : undefined}
        href="/admin/analytics"
      />
      <StatTile
        label="Apply clicks · 7 days"
        value={apply.ok ? formatCount(apply.data) : failedValue(apply)}
        sub={apply.ok ? "Every Apply button on the site" : undefined}
        href="/admin/analytics"
      />
    </>
  );
}
