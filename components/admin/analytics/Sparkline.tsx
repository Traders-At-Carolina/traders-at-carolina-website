import { cx } from "@/components/admin/ui/cx";

/** Points for a polyline across a width × height box; a flat series sits on the baseline. */
export function linePoints(values: number[], width: number, height: number, max = Math.max(...values, 0)): string {
  if (values.length === 0) return "";
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = values.length > 1 ? i * step : width / 2;
      const y = max > 0 ? height - (v / max) * height : height;
      return `${+x.toFixed(2)},${+y.toFixed(2)}`;
    })
    .join(" ");
}

/** A tiny decorative trend line for a StatTile (spec 11 §4). The tile's value and label carry the meaning. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden className={cx("h-8 w-full overflow-visible", className)}>
      <polyline points={linePoints(values, 100, 22)} transform="translate(0 1)" fill="none" className="stroke-ui-accent" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
