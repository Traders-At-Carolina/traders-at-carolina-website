import { describe, expect, it } from "vitest";
import { generateWalkPoints, generateWalks, mulberry32 } from "@/lib/random-walk";

const opts = { seed: 7, paths: 4, steps: 40, width: 600, height: 300 };

describe("mulberry32", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe("generateWalkPoints", () => {
  it("returns the requested number of paths, each with steps + 1 points", () => {
    const walks = generateWalkPoints(opts);
    expect(walks).toHaveLength(4);
    walks.forEach((w) => expect(w).toHaveLength(41));
  });

  it("starts every path at the same origin", () => {
    const [first, ...rest] = generateWalkPoints(opts);
    rest.forEach((w) => expect(w[0]).toEqual(first[0]));
  });

  it("keeps every point inside the box", () => {
    generateWalkPoints({ ...opts, steps: 400 }).flat().forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(300);
    });
  });
});

describe("generateWalks", () => {
  it("is identical for the same seed and different for another seed", () => {
    expect(generateWalks(opts)).toEqual(generateWalks(opts));
    expect(generateWalks(opts)).not.toEqual(generateWalks({ ...opts, seed: 8 }));
  });

  it("returns SVG path data starting with a move command", () => {
    generateWalks(opts).forEach((d) => expect(d).toMatch(/^M[\d.]+ [\d.]+( L[\d.]+ [\d.]+)+$/));
  });
});
