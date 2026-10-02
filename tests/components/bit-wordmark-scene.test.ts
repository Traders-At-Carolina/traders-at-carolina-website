import { describe, expect, it } from "vitest";
import {
  ALPHA,
  HEAT_RELEASE_MS,
  HOVER_RADIUS,
  WAVE_MS,
  buildGrid,
  buildLetterMask,
  cellState,
  columnSettle,
  decayHeat,
  hoverStrength,
  seededBit,
  waveFront,
  wordmarkLayout,
} from "@/components/footer/bitWordmarkScene";

describe("wordmarkLayout", () => {
  it("stacks the wordmark on two lines from md up and three below", () => {
    expect(wordmarkLayout(true).lines).toEqual(["Traders at", "Carolina"]);
    expect(wordmarkLayout(false).lines).toEqual(["Traders", "at", "Carolina"]);
  });

  it("uses a taller band on narrow screens, where more lines stack", () => {
    expect(wordmarkLayout(false).aspect).toBeGreaterThan(wordmarkLayout(true).aspect);
    expect(wordmarkLayout(true).cell).toBe(8);
    expect(wordmarkLayout(false).cell).toBe(5);
  });
});

describe("buildGrid", () => {
  it("covers the canvas with whole square cells", () => {
    expect(buildGrid(1200, 204, 8)).toEqual({ cols: 150, rows: 26 });
    expect(buildGrid(390, 180, 5)).toEqual({ cols: 78, rows: 36 });
  });

  it("never returns an empty grid", () => {
    expect(buildGrid(0, 0, 8)).toEqual({ cols: 1, rows: 1 });
  });
});

describe("buildLetterMask", () => {
  it("marks cells whose coverage is at least half", () => {
    const mask = buildLetterMask([0, 127, 128, 255]);
    expect(Array.from(mask)).toEqual([0, 0, 1, 1]);
  });
});

describe("seededBit", () => {
  it("is deterministic for a cell and varies across cells", () => {
    expect(seededBit(3, 4)).toBe(seededBit(3, 4));
    const bits = new Set<number>();
    for (let c = 0; c < 20; c++) bits.add(seededBit(c, 2));
    expect(bits).toEqual(new Set([0, 1]));
  });

  it("is roughly balanced between 0 and 1", () => {
    let ones = 0;
    for (let i = 0; i < 4000; i++) ones += seededBit(i % 80, Math.floor(i / 80));
    expect(ones / 4000).toBeGreaterThan(0.45);
    expect(ones / 4000).toBeLessThan(0.55);
  });
});

describe("waveFront", () => {
  it("runs 0 → 1 over the wave duration, easing out", () => {
    expect(waveFront(0)).toBe(0);
    expect(waveFront(WAVE_MS)).toBe(1);
    expect(waveFront(WAVE_MS * 5)).toBe(1);
    // ease-out: more than half done at the halfway point
    expect(waveFront(WAVE_MS / 2)).toBeGreaterThan(0.5);
  });

  it("is monotonic", () => {
    let prev = 0;
    for (let t = 0; t <= WAVE_MS; t += 50) {
      const v = waveFront(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("columnSettle", () => {
  it("is unsettled everywhere at front 0 and settled everywhere at front 1", () => {
    for (const x of [0, 0.25, 0.5, 0.99]) {
      expect(columnSettle(x, 0)).toBe(0);
      expect(columnSettle(x, 1)).toBe(1);
    }
  });

  it("settles left columns before right columns, with a soft front", () => {
    const left = columnSettle(0.1, 0.5);
    const right = columnSettle(0.9, 0.5);
    expect(left).toBe(1);
    expect(right).toBe(0);
    const mid = columnSettle(0.5, 0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe("hoverStrength", () => {
  it("is fully on in the inner 70% of the radius, fading to 0 at the edge", () => {
    expect(hoverStrength(0, HOVER_RADIUS)).toBe(1);
    expect(hoverStrength(HOVER_RADIUS * 0.7, HOVER_RADIUS)).toBe(1);
    expect(hoverStrength(HOVER_RADIUS * 0.85, HOVER_RADIUS)).toBeCloseTo(0.5, 5);
    expect(hoverStrength(HOVER_RADIUS, HOVER_RADIUS)).toBe(0);
    expect(hoverStrength(HOVER_RADIUS * 2, HOVER_RADIUS)).toBe(0);
  });
});

describe("decayHeat", () => {
  it("falls from 1 to 0 over the release time and never goes negative", () => {
    expect(decayHeat(1, HEAT_RELEASE_MS / 2)).toBeCloseTo(0.5, 5);
    expect(decayHeat(1, HEAT_RELEASE_MS)).toBe(0);
    expect(decayHeat(0.1, HEAT_RELEASE_MS)).toBe(0);
  });
});

describe("cellState", () => {
  const formed = { col: 5, row: 3, time: 1000, settle: 1, heat: 0, shimmer: false } as const;

  it("shows letter cells bright and the background dim once formed", () => {
    expect(cellState({ ...formed, isLetter: true }).alpha).toBeCloseTo(ALPHA.letter, 5);
    expect(cellState({ ...formed, isLetter: false }).alpha).toBeCloseTo(ALPHA.field, 5);
  });

  it("keeps the resolved bit for a formed cell", () => {
    expect(cellState({ ...formed, isLetter: true }).glyph).toBe(seededBit(5, 3) ? "1" : "0");
  });

  it("looks the same for letter and field cells while fully scrambled", () => {
    const a = cellState({ ...formed, settle: 0, isLetter: true });
    const b = cellState({ ...formed, settle: 0, isLetter: false });
    expect(a.alpha).toBeCloseTo(ALPHA.scrambled, 5);
    expect(b.alpha).toBeCloseTo(ALPHA.scrambled, 5);
  });

  it("re-rolls a scrambled cell's glyph over time", () => {
    const glyphs = new Set<string>();
    for (let t = 0; t < 2000; t += 40) glyphs.add(cellState({ ...formed, settle: 0, isLetter: false, time: t }).glyph);
    expect(glyphs).toEqual(new Set(["0", "1"]));
  });

  it("forces hovered letter cells to a full-brightness 1", () => {
    // A column where the resolved bit is 0, so the flip to 1 is observable.
    const col = Array.from({ length: 50 }, (_, c) => c).find((c) => seededBit(c, 3) === 0) ?? 0;
    const cold = cellState({ ...formed, col, isLetter: true, heat: 0 });
    expect(cold.glyph).toBe("0");
    const hot = cellState({ ...formed, col, isLetter: true, heat: 1 });
    expect(hot.glyph).toBe("1");
    expect(hot.alpha).toBe(1);
  });

  it("leaves the background field alone however hot the pointer makes it", () => {
    const col = Array.from({ length: 50 }, (_, c) => c).find((c) => seededBit(c, 3) === 0) ?? 0;
    const cold = cellState({ ...formed, col, isLetter: false, heat: 0 });
    const hot = cellState({ ...formed, col, isLetter: false, heat: 1 });
    expect(hot).toEqual(cold);
    expect(hot.alpha).toBeCloseTo(ALPHA.field, 5);
  });

  it("ignores heat on letter cells the wave hasn't reached", () => {
    const ahead = cellState({ ...formed, settle: 0, isLetter: true, heat: 1 });
    expect(ahead.alpha).toBeCloseTo(ALPHA.scrambled, 5);
  });

  it("flips about 1% of cells per second when shimmer is on, and none when it is off", () => {
    let flips = 0;
    const n = 6000;
    for (let i = 0; i < n; i++) {
      const base = { ...formed, col: i % 100, row: Math.floor(i / 100), isLetter: false };
      const off = cellState({ ...base, shimmer: false }).glyph;
      const on = cellState({ ...base, shimmer: true }).glyph;
      if (on !== off) flips++;
    }
    expect(flips / n).toBeGreaterThan(0.002);
    expect(flips / n).toBeLessThan(0.03);
  });
});
