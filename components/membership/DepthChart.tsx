import { walkStroke } from "@/components/RandomWalk";
import { depthGeometry, generateDepth } from "@/lib/order-book";
import { toPathData, type Point } from "@/lib/random-walk";

type DepthChartProps = {
  seed: number;
  className?: string;
};

const box = { levels: 14, width: 400, height: 200 } as const;

/** Bids take the walk's lead stroke (solid navy); asks take its muted black (00 §7.2). */
const sides = [
  { key: "bids", stroke: walkStroke(0), fill: "fill-navy", fillOpacity: "0.06" },
  { key: "asks", stroke: walkStroke(2), fill: "fill-black", fillOpacity: "0.03" },
] as const;

/** Closes a depth curve down to the baseline so it can be filled. */
const toAreaData = (points: Point[], baseline: number) => `${toPathData([...points, [points.at(-1)![0], baseline]])} Z`;

/**
 * Membership header art (spec 03 §3.1): a seeded order book drawn as a depth chart, with bids and
 * asks stepping out from the spread. Strokes draw in from the mid; fills fade in. Decorative only.
 */
export function DepthChart({ seed, className = "" }: DepthChartProps) {
  const opts = { seed, ...box };
  const depth = generateDepth(opts);
  const { baseline } = depthGeometry(opts);

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`draw-in ${className}`}
    >
      <g className="draw-in-fill">
        {sides.map(({ key, fill, fillOpacity }) => (
          <path key={key} d={toAreaData(depth[key], baseline)} className={fill} fillOpacity={fillOpacity} />
        ))}
      </g>
      <line x1={0} x2={box.width} y1={baseline} y2={baseline} className="stroke-rule" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {sides.map(({ key, stroke }) => (
        <path
          key={key}
          d={toPathData(depth[key])}
          fill="none"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          {...stroke}
        />
      ))}
    </svg>
  );
}
