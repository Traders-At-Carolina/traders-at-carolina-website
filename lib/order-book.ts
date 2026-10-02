import { mulberry32, type Point } from "@/lib/random-walk";

export type DepthOptions = {
  seed: number;
  /** Price levels per side. */
  levels: number;
  width: number;
  height: number;
  /** Gap between best bid and best ask as a fraction of `width` (default 0.06). */
  spreadRatio?: number;
};

/** Stepped cumulative-depth curves, each running from the spread out to its edge of the box. */
export type Depth = { bids: Point[]; asks: Point[] };

const round = (n: number) => Math.round(n * 10) / 10;

/** Spread edges, baseline and top margin shared by the curves and their fills. */
export function depthGeometry({ width, height, spreadRatio = 0.06 }: DepthOptions) {
  const gap = width * spreadRatio;
  return {
    bidEdge: round(width / 2 - gap / 2),
    askEdge: round(width / 2 + gap / 2),
    baseline: round(height * 0.96),
    top: round(height * 0.08),
  };
}

/** Resting size per level: thin near the mid, thicker further out, with the occasional large order. */
function levelSizes(rand: () => number, levels: number): number[] {
  return Array.from({ length: levels }, (_, i) => {
    const wall = rand() < 0.12 ? 2.4 : 1;
    return (1 + 0.18 * i) * (0.5 + rand()) * wall;
  });
}

const cumulative = (sizes: number[]) => sizes.reduce<number[]>((acc, s) => [...acc, (acc.at(-1) ?? 0) + s], []);

/**
 * A seeded order book drawn as a depth chart. Bids and asks use separate streams of the same seed,
 * so the book isn't a mirror image; both are scaled by the deeper side, which reaches the top margin.
 */
export function generateDepth(opts: DepthOptions): Depth {
  const { seed, levels, width } = opts;
  const { bidEdge, askEdge, baseline, top } = depthGeometry(opts);
  const bidDepth = cumulative(levelSizes(mulberry32(seed), levels));
  const askDepth = cumulative(levelSizes(mulberry32(seed ^ 0x9e3779b9), levels));
  const scale = (baseline - top) / Math.max(bidDepth.at(-1)!, askDepth.at(-1)!);

  // Riser to the level's cumulative depth, then a run across that level's price step.
  const side = (edge: number, outer: number, depth: number[]): Point[] => {
    const dx = (outer - edge) / levels;
    const points: Point[] = [[edge, baseline]];
    depth.forEach((d, i) => {
      const y = round(baseline - d * scale);
      points.push([round(edge + i * dx), y], [round(edge + (i + 1) * dx), y]);
    });
    return points;
  };

  return { bids: side(bidEdge, 0, bidDepth), asks: side(askEdge, width, askDepth) };
}
