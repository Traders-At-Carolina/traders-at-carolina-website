import { describe, expect, it } from "vitest";
import {
  MARKET_REGIMES,
  RANGES,
  describeSurface,
  easeInOut,
  impliedVol,
  lerpParams,
  surfaceGrid,
  type VolParams,
} from "@/lib/vol-surface";

const calm = MARKET_REGIMES[0].params;

describe("impliedVol", () => {
  it("returns the ATM vol at the money for a one-year maturity", () => {
    expect(impliedVol(0, 1, calm)).toBeCloseTo(calm.atmVol, 10);
  });

  it("follows the term slope at the money", () => {
    expect(impliedVol(0, 2, calm)).toBeCloseTo(calm.atmVol * (1 + calm.termSlope), 10);
  });

  it("tilts the smile toward low strikes when skew is negative, and the other way when positive", () => {
    const smirk = { ...calm, skew: -0.7 };
    expect(impliedVol(-0.3, 1, smirk)).toBeGreaterThan(impliedVol(0.3, 1, smirk));
    const call = { ...calm, skew: 0.3 };
    expect(impliedVol(0.3, 1, call)).toBeGreaterThan(impliedVol(-0.3, 1, call));
  });
});

describe("MARKET_REGIMES", () => {
  it("has distinct names and keeps every parameter in range", () => {
    expect(new Set(MARKET_REGIMES.map((r) => r.name)).size).toBe(MARKET_REGIMES.length);
    MARKET_REGIMES.forEach(({ params }) =>
      (Object.keys(RANGES) as (keyof VolParams)[]).forEach((key) => {
        expect(params[key]).toBeGreaterThanOrEqual(RANGES[key][0]);
        expect(params[key]).toBeLessThanOrEqual(RANGES[key][1]);
      }),
    );
  });

  it("gives a positive, finite surface for every regime and every blend between neighbours", () => {
    MARKET_REGIMES.forEach(({ params }, i) => {
      const next = MARKET_REGIMES[(i + 1) % MARKET_REGIMES.length].params;
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        surfaceGrid(lerpParams(params, next, t), 25, 17).values.forEach((v) => {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThan(0);
        });
      }
    });
  });
});

describe("surfaceGrid", () => {
  it("writes into a provided buffer without allocating", () => {
    const out = new Float32Array(25 * 17);
    expect(surfaceGrid(calm, 25, 17, out).values).toBe(out);
  });
});

describe("lerpParams and easeInOut", () => {
  it("blends from one regime to the next", () => {
    const [a, b] = MARKET_REGIMES.map((r) => r.params);
    expect(lerpParams(a, b, 0)).toEqual(a);
    expect(lerpParams(a, b, 1)).toEqual(b);
    expect(lerpParams(a, b, 0.5).atmVol).toBeCloseTo((a.atmVol + b.atmVol) / 2);
  });

  it("eases in and out monotonically from 0 to 1", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(1)).toBe(1);
    let prev = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      expect(easeInOut(t)).toBeGreaterThanOrEqual(prev);
      prev = easeInOut(t);
    }
  });
});

describe("describeSurface", () => {
  it("summarizes the regime in plain language", () => {
    expect(describeSurface(calm)).toBe("Implied volatility surface: ATM vol 16%, skew -0.55, upward-sloping term structure.");
  });
});
