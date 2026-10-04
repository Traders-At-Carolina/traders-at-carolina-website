import type { TrendPoint } from "@/lib/analytics/query";
import { TBody, TD, TH, THead, TR, Table } from "@/components/admin/ui/Table";
import { formatCount, formatDay } from "./format";
import { linePoints } from "./Sparkline";

const W = 600;
const H = 180;

/** Rounds up to a tidy axis maximum: 7 → 10, 43 → 50, 180 → 200. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

/**
 * Daily visitors and pageviews as a hand-built SVG line (spec 06 §7.2): accent for visitors, text-3 for pageviews.
 * The SVG stretches to its box; labels are HTML so they never distort. The same numbers sit in a table below.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.visitors, p.pageviews)), 0));
  const first = points[0];
  const middle = points[Math.floor((points.length - 1) / 2)];
  const last = points[points.length - 1];
  const peak = Math.max(...points.map((p) => p.pageviews), 0);

  return (
    <div className="px-6 py-4">
      <ul className="mb-3 flex flex-wrap gap-4 text-ui-label text-ui-text-2">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 rounded-ui-full bg-ui-accent" />
          Visitors
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 rounded-ui-full bg-ui-text-3" />
          Pageviews
        </li>
      </ul>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div aria-hidden className="flex h-44 flex-col justify-between text-right text-ui-hint text-ui-text-3 tabular-nums">
          <span className="-translate-y-1/2">{formatCount(max)}</span>
          <span className="-translate-y-1/2">{formatCount(max / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <svg
          role="img"
          aria-label={`Line chart of daily visitors and pageviews, ${formatDay(first.day)} to ${formatDay(last.day)}. Peak day: ${formatCount(peak)} pageviews. The data table below lists each day.`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-44 w-full overflow-visible"
        >
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} className="stroke-ui-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <polyline points={linePoints(points.map((p) => p.pageviews), W, H, max)} fill="none" className="stroke-ui-text-3" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <polyline points={linePoints(points.map((p) => p.visitors), W, H, max)} fill="none" className="stroke-ui-accent" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div aria-hidden className="col-start-2 mt-2 flex justify-between text-ui-hint text-ui-text-3 tabular-nums">
          <span>{formatDay(first.day)}</span>
          {points.length > 2 ? <span>{formatDay(middle.day)}</span> : null}
          <span>{formatDay(last.day)}</span>
        </div>
      </div>
      <details className="group mt-4">
        <summary className="cursor-pointer text-ui-label font-medium text-ui-accent">Show the data</summary>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-ui-md border border-ui-border">
          <Table>
            <caption className="sr-only">Visitors and pageviews per day</caption>
            <THead>
              <TR>
                <TH>Day</TH>
                <TH className="text-right">Visitors</TH>
                <TH className="text-right">Pageviews</TH>
              </TR>
            </THead>
            <TBody>
              {points.map((p) => (
                <TR key={p.day}>
                  <TD className="text-ui-text-2 tabular-nums">
                    <time dateTime={p.day}>{formatDay(p.day)}</time>
                  </TD>
                  <TD className="text-right tabular-nums">{formatCount(p.visitors)}</TD>
                  <TD className="text-right tabular-nums">{formatCount(p.pageviews)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </details>
    </div>
  );
}
