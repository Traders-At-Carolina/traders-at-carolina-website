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

/** Resting size at each price level, index 0 at the touch (best bid / best ask). */
export type Book = { bids: number[]; asks: number[] };
export type Side = keyof Book;
export const SIDES: readonly Side[] = ["bids", "asks"];

/** Stepped cumulative-depth curves, each running from the spread out to its edge of the box. */
export type Depth = { bids: Point[]; asks: Point[] };

/** One ladder bar: a level's own resting size, standing on the baseline in the middle of its price step. */
export type Bar = { side: Side; i: number; x: number; y: number; w: number; h: number };

const round = (n: number) => Math.round(n * 10) / 10;
const total = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0);

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

/** Where a side starts (its spread edge) and the signed width of one price step outward from there. */
export function sideSpan(side: Side, opts: DepthOptions) {
  const { bidEdge, askEdge } = depthGeometry(opts);
  return side === "bids"
    ? { edge: bidEdge, dx: -bidEdge / opts.levels }
    : { edge: askEdge, dx: (opts.width - askEdge) / opts.levels };
}

/** Resting size per level: thin near the mid, thicker further out, with the occasional large order. */
function levelSizes(rand: () => number, levels: number): number[] {
  return Array.from({ length: levels }, (_, i) => {
    const wall = rand() < 0.12 ? 2.4 : 1;
    return (1 + 0.18 * i) * (0.5 + rand()) * wall;
  });
}

/** A seeded book. Bids and asks use separate streams of the same seed, so it isn't a mirror image. */
export function generateBook({ seed, levels }: DepthOptions): Book {
  return { bids: levelSizes(mulberry32(seed), levels), asks: levelSizes(mulberry32(seed ^ 0x9e3779b9), levels) };
}

/** Pixels per unit of size. At `headroom` 1 the deeper side of `book` reaches the top margin; above 1 it leaves room to grow. */
export function bookScale(book: Book, opts: DepthOptions, headroom = 1) {
  const { baseline, top } = depthGeometry(opts);
  return (baseline - top) / (Math.max(total(book.bids), total(book.asks)) * headroom);
}

/** Cumulative depth per side: a riser to each level's running total, then a run across that level's price step. */
export function depthCurves(book: Book, opts: DepthOptions, scale: number): Depth {
  const { baseline } = depthGeometry(opts);
  const side = (key: Side): Point[] => {
    const { edge, dx } = sideSpan(key, opts);
    const points: Point[] = [[edge, baseline]];
    let depth = 0;
    book[key].forEach((size, i) => {
      depth += size;
      const y = round(baseline - depth * scale);
      points.push([round(edge + i * dx), y], [round(edge + (i + 1) * dx), y]);
    });
    return points;
  };
  return { bids: side("bids"), asks: side("asks") };
}

/**
 * Ladder bars, bids then asks: each level's own size at the curve's scale. A level's size is never more than the
 * running total above it, so the bars always sit under the curve.
 */
export function levelBars(book: Book, opts: DepthOptions, scale: number, widthRatio = 0.55): Bar[] {
  const { baseline } = depthGeometry(opts);
  return SIDES.flatMap((side) => {
    const { edge, dx } = sideSpan(side, opts);
    const w = Math.abs(dx) * widthRatio;
    return book[side].map((size, i) => {
      const h = round(size * scale);
      return { side, i, x: round(edge + (i + 0.5) * dx - w / 2), y: round(baseline - h), w: round(w), h };
    });
  });
}

/** A seeded order book drawn as a depth chart; the deeper side reaches the top margin. */
export function generateDepth(opts: DepthOptions): Depth {
  const book = generateBook(opts);
  return depthCurves(book, opts, bookScale(book, opts));
}

export type BookEvent = {
  book: Book;
  /** Levels whose size changed, for tweening. */
  changed: { side: Side; i: number }[];
  /** Set when the event was a trade at the touch on that side. */
  trade?: Side;
};

/** How far a level may drift from where it started, as multiples of its starting size. */
export const SIZE_BOUNDS = [0.3, 2.5] as const;

/**
 * One tick of a quiet market, pure and seeded through `rand`:
 * - most ticks resize one or two levels, favouring those near the touch and pulling them back toward where they began;
 * - some are a trade that takes 30–70% off one side's best level (later resizes refill it);
 * - a few put up, or pull, a large order deeper in the book.
 * Sizes stay within `SIZE_BOUNDS` of `initial`, and no side's total may pass `cap`, so a fixed scale never clips.
 */
export function nextEvent(book: Book, initial: Book, cap: number, rand: () => number): BookEvent {
  const next: Book = { bids: [...book.bids], asks: [...book.asks] };
  const changed: BookEvent["changed"] = [];
  const levels = book.bids.length;
  const pickSide = (): Side => (rand() < 0.5 ? "bids" : "asks");

  const set = (side: Side, i: number, size: number) => {
    const start = initial[side][i];
    const floor = start * SIZE_BOUNDS[0];
    const rest = total(next[side]) - next[side][i];
    const s = Math.min(start * SIZE_BOUNDS[1], cap - rest, Math.max(floor, size));
    if (s < floor || Math.abs(s - next[side][i]) < 1e-6) return;
    next[side][i] = s;
    changed.push({ side, i });
  };

  const roll = rand();
  if (roll < 0.3) {
    const side = pickSide();
    set(side, 0, next[side][0] * (0.3 + 0.4 * rand()));
    return { book: next, changed, trade: changed.length ? side : undefined };
  }

  if (roll < 0.4) {
    const side = pickSide();
    const i = Math.floor(levels / 2 + rand() * (levels / 2));
    const walled = next[side][i] > initial[side][i] * 1.8;
    set(side, i, walled ? initial[side][i] : next[side][i] * 2.2);
    return { book: next, changed };
  }

  // Resize: weight level i by 1/(i+1) so the touch moves most, and blend a quarter back toward the starting size.
  const weights = Array.from({ length: levels }, (_, i) => 1 / (i + 1));
  const sum = total(weights);
  const pickLevel = () => {
    let r = rand() * sum;
    for (let i = 0; i < levels; i++) if ((r -= weights[i]) <= 0) return i;
    return levels - 1;
  };
  const count = rand() < 0.5 ? 1 : 2;
  for (let n = 0; n < count; n++) {
    const side = pickSide();
    const i = pickLevel();
    set(side, i, next[side][i] * (0.75 + 0.55 * rand()) * 0.75 + initial[side][i] * 0.25);
  }
  return { book: next, changed };
}
