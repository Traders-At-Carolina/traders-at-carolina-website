import { describe, expect, it } from "vitest";
import { SIDES, SIZE_BOUNDS, bookScale, depthCurves, depthGeometry, generateBook, generateDepth, levelBars, nextEvent, sideSpan } from "@/lib/order-book";
import { mulberry32 } from "@/lib/random-walk";

const opts = { seed: 303, levels: 14, width: 400, height: 200 };
const { bidEdge, askEdge, baseline, top } = depthGeometry(opts);

const ys = (points: [number, number][]) => points.map(([, y]) => y);

describe("generateDepth", () => {
  it("is deterministic for a seed", () => {
    expect(generateDepth(opts)).toEqual(generateDepth(opts));
    expect(generateDepth({ ...opts, seed: 304 })).not.toEqual(generateDepth(opts));
  });

  it("gives each side a riser and a run per level, plus the start point", () => {
    const { bids, asks } = generateDepth(opts);
    expect(bids).toHaveLength(1 + 2 * 14);
    expect(asks).toHaveLength(1 + 2 * 14);
  });

  it("starts both sides at the spread edge on the baseline and runs out to the box edges", () => {
    const { bids, asks } = generateDepth(opts);
    expect(bids[0]).toEqual([bidEdge, baseline]);
    expect(asks[0]).toEqual([askEdge, baseline]);
    expect(bids.at(-1)![0]).toBe(0);
    expect(asks.at(-1)![0]).toBe(400);
  });

  it("keeps bids left of the spread and asks right of it, with a centred gap", () => {
    const { bids, asks } = generateDepth(opts);
    bids.forEach(([x]) => expect(x).toBeLessThanOrEqual(bidEdge));
    asks.forEach(([x]) => expect(x).toBeGreaterThanOrEqual(askEdge));
    expect(askEdge - bidEdge).toBeGreaterThan(0);
    expect(bidEdge + askEdge).toBeCloseTo(400);
  });

  it("never lets cumulative depth shrink moving away from the mid", () => {
    const { bids, asks } = generateDepth(opts);
    for (const side of [bids, asks]) {
      ys(side).forEach((y, i, all) => {
        if (i > 0) expect(y).toBeLessThanOrEqual(all[i - 1]);
      });
    }
  });

  it("keeps every point inside the box and lets the deeper side reach the top margin", () => {
    const { bids, asks } = generateDepth(opts);
    [...bids, ...asks].forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      expect(y).toBeGreaterThanOrEqual(top);
      expect(y).toBeLessThanOrEqual(baseline);
    });
    expect(Math.min(...ys(bids), ...ys(asks))).toBeCloseTo(top, 0);
  });

  it("draws the two sides from different streams, so the book is not a mirror image", () => {
    const { bids, asks } = generateDepth(opts);
    expect(ys(bids)).not.toEqual(ys(asks));
  });
});

describe("live book", () => {
  const book = generateBook(opts);
  const scale = bookScale(book, opts, 1.2);
  const cap = (baseline - top) / scale;
  const sum = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0);

  const run = (ticks: number, seed = 7) => {
    const rand = mulberry32(seed);
    const events = [];
    let current = book;
    for (let n = 0; n < ticks; n++) {
      const event = nextEvent(current, book, cap, rand);
      events.push(event);
      current = event.book;
    }
    return events;
  };

  it("splits generateDepth into a book drawn at its own scale", () => {
    expect(depthCurves(book, opts, bookScale(book, opts))).toEqual(generateDepth(opts));
  });

  it("is deterministic for a stream", () => {
    expect(run(50)).toEqual(run(50));
    expect(run(50, 8)).not.toEqual(run(50));
  });

  it("keeps every level within its bounds and every side under the cap, so the curve never clips", () => {
    for (const { book: b } of run(500)) {
      for (const side of SIDES) {
        b[side].forEach((size, i) => {
          expect(size).toBeGreaterThanOrEqual(book[side][i] * SIZE_BOUNDS[0] - 1e-9);
          expect(size).toBeLessThanOrEqual(book[side][i] * SIZE_BOUNDS[1] + 1e-9);
        });
        expect(sum(b[side])).toBeLessThanOrEqual(cap + 1e-9);
      }
      const { bids, asks } = depthCurves(b, opts, scale);
      [...bids, ...asks].forEach(([, y]) => expect(y).toBeGreaterThanOrEqual(top - 0.1));
    }
  });

  it("mixes trades at the touch with resizes, and reports exactly the levels it changed", () => {
    const events = run(300);
    const trades = events.filter((e) => e.trade);
    expect(trades.length).toBeGreaterThan(40);
    expect(trades.length).toBeLessThan(150);
    trades.forEach((e) => expect(e.changed).toEqual([{ side: e.trade, i: 0 }]));
    let prev = book;
    for (const e of events) {
      for (const side of SIDES) {
        e.book[side].forEach((size, i) => {
          if (size !== prev[side][i]) expect(e.changed).toContainEqual({ side, i });
        });
      }
      prev = e.book;
    }
  });

  it("stands each ladder bar on the baseline inside its own price step, under the curve", () => {
    const bars = levelBars(book, opts, scale);
    expect(bars).toHaveLength(28);
    const { bids, asks } = depthCurves(book, opts, scale);
    for (const bar of bars) {
      const { edge, dx } = sideSpan(bar.side, opts);
      const [lo, hi] = [edge + bar.i * dx, edge + (bar.i + 1) * dx].sort((a, b) => a - b);
      expect(bar.x).toBeGreaterThanOrEqual(lo - 0.1);
      expect(bar.x + bar.w).toBeLessThanOrEqual(hi + 0.1);
      expect(bar.y + bar.h).toBeCloseTo(baseline, 0);
      const curveY = (bar.side === "bids" ? bids : asks)[1 + 2 * bar.i][1];
      expect(bar.y).toBeGreaterThanOrEqual(curveY - 0.1);
    }
  });
});
