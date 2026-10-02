import { describe, expect, it } from "vitest";
import { depthGeometry, generateDepth } from "@/lib/order-book";

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
