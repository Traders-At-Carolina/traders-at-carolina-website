import { describe, expect, it } from "vitest";
import {
  DEFAULT_DOMAIN,
  MAX_ANSWER,
  QUESTIONS,
  ROUNDS,
  axisDomain,
  axisPercent,
  axisTicks,
  formatAmount,
  formatAnswer,
  formatRatio,
  missFactor,
  parseAmount,
  pickRounds,
  scoreSpread,
  tickLabel,
} from "@/lib/games/fermi";

describe("Fermi bank", () => {
  it("is large, unique, and every answer is a big positive number with a reason", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.value).toBeGreaterThanOrEqual(100);
      // Quotable with k, m and b: nothing astronomical.
      expect(q.value).toBeLessThanOrEqual(MAX_ANSWER);
      expect(q.prompt).toMatch(/\?$/);
      expect(q.why.length).toBeGreaterThan(0);
    }
  });

  it("picks distinct rounds, the same ones for the same seed", () => {
    const rounds = pickRounds(9);
    expect(rounds).toHaveLength(ROUNDS);
    expect(new Set(rounds.map((q) => q.id)).size).toBe(ROUNDS);
    expect(pickRounds(9)).toEqual(rounds);
  });
});

describe("parseAmount", () => {
  it.each([
    ["250k", 250_000],
    ["3.5m", 3_500_000],
    ["3.5 M", 3_500_000],
    ["2e9", 2e9],
    ["1,200,000", 1_200_000],
    ["4 billion", 4e9],
    ["1.2bn", 1.2e9],
    ["$27t", 27e12],
    [".5k", 500],
    ["450", 450],
    ["2.5", 2.5],
    ["0.75", 0.75],
    ["2.", 2],
    ["2.5k", 2_500],
    ["1.5K", 1_500],
    ["3.25 M", 3_250_000],
    ["1.2B", 1.2e9],
    ["4t", 4e12],
    ["1,500.5", 1_500.5],
  ])("reads %s", (text, value) => {
    expect(parseAmount(text)).toBeCloseTo(value, 6);
  });

  it.each(["", "abc", "0", "-5", "5x", "1.2.3", "k", ".", "2.5q", "1..5"])("rejects %s", (text) => {
    expect(parseAmount(text)).toBeNull();
  });
});

describe("scoring", () => {
  it("pays 100 − 25 per order of magnitude of width for a hit, and 0 for a miss", () => {
    expect(scoreSpread(100, 100, 100)).toBe(100);
    expect(scoreSpread(100, 1_000, 500)).toBe(75);
    expect(scoreSpread(100, 10_000, 500)).toBe(50);
    expect(scoreSpread(1, 1e12, 500)).toBe(5);
    expect(scoreSpread(100, 1_000, 1_001)).toBe(0);
    expect(scoreSpread(100, 1_000, 99)).toBe(0);
  });

  it("measures a miss as how many times off the nearer edge was", () => {
    expect(missFactor(100, 1_000, 25)).toBe(4);
    expect(missFactor(100, 1_000, 5_000)).toBe(5);
    expect(missFactor(100, 1_000, 500)).toBe(1);
  });
});

describe("formatting", () => {
  it("compacts amounts to three significant figures", () => {
    expect(formatAmount(950)).toBe("950");
    expect(formatAmount(150.5)).toBe("150.5");
    expect(formatAmount(2.5)).toBe("2.5");
    expect(formatAmount(31_536_000)).toBe("31.5M");
    expect(formatAmount(999_999)).toBe("1M");
    expect(formatAmount(9.46e12)).toBe("9.46T");
    expect(formatAmount(4.3252e19)).toBe("4.3 × 10¹⁹");
  });

  it("shows exact answers in full and approximate ones compact with ≈", () => {
    expect(formatAnswer({ id: "a", prompt: "?", value: 31_536_000, why: "" })).toBe("31,536,000");
    expect(formatAnswer({ id: "b", prompt: "?", value: 384_400, unit: "km", why: "" })).toBe("384,400 km");
    expect(formatAnswer({ id: "c", prompt: "?", value: 2.9e9, approx: true, why: "" })).toBe("≈ 2.9B");
  });

  it("formats ratios", () => {
    expect(formatRatio(4.24)).toBe("4.2×");
    expect(formatRatio(37.4)).toBe("37×");
    expect(formatRatio(166_024)).toBe("166K×");
  });

  it("labels powers of ten", () => {
    expect([0, 1, 2, 3, 6, 8, 12, 14, 15, 19].map(tickLabel)).toEqual(["1", "10", "100", "1K", "1M", "100M", "1T", "100T", "10¹⁵", "10¹⁹"]);
  });
});

describe("axis", () => {
  it("defaults to 1 – 1T before any input", () => {
    expect(axisDomain([])).toEqual(DEFAULT_DOMAIN);
  });

  it("pads one order of magnitude each side and spans at least four", () => {
    expect(axisDomain([300_000, 2_000_000])).toEqual({ min: 4, max: 8 });
    expect(axisDomain([1e3, 1e9])).toEqual({ min: 2, max: 10 });
    expect(axisDomain([5, 50])).toEqual({ min: 0, max: 4 });
  });

  it("depends only on the points it's given, so the answer only moves it once revealed", () => {
    expect(axisDomain([1e4, 1e5])).not.toEqual(axisDomain([1e4, 1e5, 8e67]));
    expect(axisDomain([1e4, 1e5, 8e67]).max).toBe(69);
  });

  it("places values by order of magnitude and clamps to the line", () => {
    const d = { min: 0, max: 10 };
    expect(axisPercent(1e5, d)).toBe(50);
    expect(axisPercent(1e20, d)).toBe(100);
  });

  it("labels every power on short axes and steps by thousands on long ones", () => {
    expect(axisTicks({ min: 4, max: 8 })).toEqual([4, 5, 6, 7, 8]);
    expect(axisTicks({ min: 0, max: 12 })).toEqual([0, 3, 6, 9, 12]);
    expect(axisTicks({ min: 3, max: 69 }).length).toBeLessThanOrEqual(7);
  });
});
