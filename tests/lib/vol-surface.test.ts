import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/random-walk";
import {
  DEFAULT_PARAMS,
  RANGES,
  describeSurface,
  impliedVol,
  randomParams,
  stepParams,
  surfaceGrid,
  type VolParams,
} from "@/lib/vol-surface";

const inRange = (p: VolParams) =>
  (Object.keys(RANGES) as (keyof VolParams)[]).forEach((key) => {
    expect(p[key]).toBeGreaterThanOrEqual(RANGES[key][0]);
    expect(p[key]).toBeLessThanOrEqual(RANGES[key][1]);
  });

describe("impliedVol", () => {
  it("returns the ATM vol at the money for a one-year maturity", () => {
    expect(impliedVol(0, 1, DEFAULT_PARAMS)).toBeCloseTo(DEFAULT_PARAMS.atmVol, 10);
  });

  it("follows the term slope at the money", () => {
    expect(impliedVol(0, 2, DEFAULT_PARAMS)).toBeCloseTo(DEFAULT_PARAMS.atmVol * (1 + DEFAULT_PARAMS.termSlope), 10);
  });

  it("tilts the smile toward low strikes when skew is negative, and the other way when positive", () => {
    const smirk = { ...DEFAULT_PARAMS, skew: -0.7 };
    expect(impliedVol(-0.3, 1, smirk)).toBeGreaterThan(impliedVol(0.3, 1, smirk));
    const call = { ...DEFAULT_PARAMS, skew: 0.3 };
    expect(impliedVol(0.3, 1, call)).toBeGreaterThan(impliedVol(-0.3, 1, call));
  });
});

describe("surfaceGrid", () => {
  it("is positive and finite everywhere, across random regimes", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { values, min, max } = surfaceGrid(randomParams(seed), 25, 17);
      values.forEach((v) => {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      });
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it("writes into a provided buffer without allocating", () => {
    const out = new Float32Array(25 * 17);
    expect(surfaceGrid(DEFAULT_PARAMS, 25, 17, out).values).toBe(out);
  });
});

describe("randomParams", () => {
  it("is deterministic per seed and stays in range", () => {
    expect(randomParams(42)).toEqual(randomParams(42));
    expect(randomParams(42)).not.toEqual(randomParams(43));
    inRange(randomParams(42));
  });
});

describe("stepParams", () => {
  it("stays within the ranges and mean-reverts toward the anchor", () => {
    const rand = mulberry32(7);
    const anchor = DEFAULT_PARAMS;
    let p: VolParams = { ...anchor, atmVol: 0.55 };
    for (let i = 0; i < 400; i++) {
      p = stepParams(p, anchor, 0.08, rand);
      inRange(p);
    }
    expect(Math.abs(p.atmVol - anchor.atmVol)).toBeLessThan(0.2);
    expect(p.curvature).toBe(anchor.curvature);
  });
});

describe("describeSurface", () => {
  it("summarizes the regime in plain language", () => {
    expect(describeSurface(DEFAULT_PARAMS)).toBe(
      "Implied volatility surface: ATM vol 24%, skew -0.60, upward-sloping term structure.",
    );
  });
});
