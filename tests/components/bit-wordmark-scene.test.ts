import { describe, expect, it } from "vitest";
import {
  ALPHA,
  GLITCH_TICK_MS,
  HEAT_RELEASE_MS,
  HOVER_RADIUS,
  LOAD_HOLD_MS,
  LOAD_MS,
  LOAD_TOTAL_MS,
  TOUCH_HOVER_RADIUS,
  buildGrid,
  buildLetterMask,
  cellSettle,
  cellState,
  decayHeat,
  hoverStrength,
  lineBaselines,
  loadProgress,
  seededBit,
  settleThreshold,
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

describe("lineBaselines", () => {
  it("runs the last line off the bottom edge by the cut fraction of a cap height", () => {
    const [first, last] = lineBaselines(2, 300, 150, 0.35, 1.25);
    expect(last).toBeCloseTo(300 + 0.35 * 150, 5);
    expect(last - first).toBeCloseTo(1.25 * 150, 5);
  });

  it("leaves the visible part of the last line at (1 − cut) of its height", () => {
    const cap = 150;
    const cut = 0.35;
    const baselines = lineBaselines(2, 300, cap, cut, 1.25);
    const visible = 300 - (baselines[1] - cap);
    expect(visible / cap).toBeCloseTo(1 - cut, 5);
  });

  it("spaces any number of lines evenly, top to bottom", () => {
    const b = lineBaselines(3, 200, 50, 0.3, 1.2);
    expect(b).toHaveLength(3);
    expect(b[1] - b[0]).toBeCloseTo(60, 5);
    expect(b[2] - b[1]).toBeCloseTo(60, 5);
  });
});

describe("wordmark layout crop", () => {
  it("crops the last line by roughly a third in both layouts, with the first line clear of the top fade", () => {
    for (const wide of [true, false]) {
      const { cut, gap, aspect, lines } = wordmarkLayout(wide);
      expect(cut).toBeGreaterThan(0.2);
      expect(cut).toBeLessThan(0.5);
      // Cap height as a share of the band width, from the fitted widest line (about 4.2em–5.2em, cap 0.69em).
      const widest = wide ? 5.163 : 4.225;
      const capShare = (0.69 * 0.94) / widest;
      const h = aspect;
      const first = lineBaselines(lines.length, h, capShare, cut, gap)[0] - capShare;
      expect(first).toBeGreaterThan(0.14 * h); // below the 14% top fade
      expect(first).toBeLessThan(0.3 * h); // and not wastefully low
    }
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

describe("loadProgress", () => {
  it("holds at 0 through the pure-scramble hold, then ramps to 1", () => {
    expect(loadProgress(0)).toBe(0);
    expect(loadProgress(LOAD_HOLD_MS)).toBe(0);
    expect(loadProgress(LOAD_HOLD_MS + LOAD_MS / 2)).toBeCloseTo(0.5, 5);
    expect(loadProgress(LOAD_TOTAL_MS)).toBe(1);
    expect(loadProgress(LOAD_TOTAL_MS * 5)).toBe(1);
  });

  it("never goes backwards", () => {
    let prev = 0;
    for (let t = 0; t <= LOAD_TOTAL_MS; t += 50) {
      const v = loadProgress(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("settleThreshold", () => {
  it("is deterministic and always inside [0, 1)", () => {
    expect(settleThreshold(7, 2)).toBe(settleThreshold(7, 2));
    for (let i = 0; i < 500; i++) {
      const t = settleThreshold(i % 40, Math.floor(i / 40));
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThan(1);
    }
  });

  it("is spread across the whole range, in no left-to-right order", () => {
    const first = Array.from({ length: 60 }, (_, c) => settleThreshold(c, 0));
    expect(Math.min(...first)).toBeLessThan(0.15);
    expect(Math.max(...first)).toBeGreaterThan(0.85);
    // neighbouring columns do not simply increase: that would be a sweep
    const rises = first.slice(1).filter((t, i) => t > first[i]).length;
    expect(rises).toBeGreaterThan(15);
    expect(rises).toBeLessThan(45);
  });
});

describe("cellSettle", () => {
  it("is unsettled at progress 0 and settled at progress 1, whatever the cell's threshold", () => {
    for (const t of [0, 0.25, 0.5, 0.999]) {
      expect(cellSettle(t, 0)).toBe(0);
      expect(cellSettle(t, 1)).toBe(1);
    }
  });

  it("settles low-threshold cells first, with a short soft transition", () => {
    expect(cellSettle(0.1, 0.5)).toBe(1);
    expect(cellSettle(0.9, 0.5)).toBe(0);
    const mid = cellSettle(0.5, 0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe("hover radius", () => {
  it("is a tight patch, smaller again on touch", () => {
    expect(HOVER_RADIUS).toBeLessThanOrEqual(18);
    expect(TOUCH_HOVER_RADIUS).toBeLessThan(HOVER_RADIUS);
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

  it("forces hovered letter cells to a full-brightness 1 and lights them for the white glow", () => {
    // A column where the resolved bit is 0, so the flip to 1 is observable.
    const col = Array.from({ length: 50 }, (_, c) => c).find((c) => seededBit(c, 3) === 0) ?? 0;
    const cold = cellState({ ...formed, col, isLetter: true, heat: 0 });
    expect(cold.glyph).toBe("0");
    expect(cold.lit).toBe(0);
    const hot = cellState({ ...formed, col, isLetter: true, heat: 1 });
    expect(hot.glyph).toBe("1");
    expect(hot.alpha).toBe(1);
    expect(hot.lit).toBeGreaterThan(cold.lit);
    expect(hot.lit).toBe(1);
  });

  it("reports a partial glow while the pointer's heat fades, and none on the background field", () => {
    expect(cellState({ ...formed, isLetter: true, heat: 0.4 }).lit).toBeCloseTo(0.4, 5);
    expect(cellState({ ...formed, isLetter: false, heat: 1 }).lit).toBe(0);
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

  it("glitches about 4% of a formed field in any window, and none when glitching is off", () => {
    let glitched = 0;
    const n = 6000;
    for (let i = 0; i < n; i++) {
      const base = { ...formed, col: i % 100, row: Math.floor(i / 100), isLetter: false };
      const off = cellState({ ...base, shimmer: false });
      const on = cellState({ ...base, shimmer: true });
      expect(off.alpha).toBeCloseTo(ALPHA.field, 5);
      if (on.glyph !== off.glyph) glitched++;
    }
    expect(glitched / n).toBeGreaterThan(0.025);
    expect(glitched / n).toBeLessThan(0.06);
  });

  it("changes which cells glitch from one window to the next", () => {
    const set = (time: number) =>
      new Set(
        Array.from({ length: 1500 }, (_, i) => i).filter((i) => {
          const base = { ...formed, col: i % 100, row: Math.floor(i / 100), isLetter: false, time };
          return cellState({ ...base, shimmer: true }).glyph !== cellState({ ...base, shimmer: false }).glyph;
        }),
      );
    const a = set(1000);
    const b = set(1000 + GLITCH_TICK_MS * 3);
    expect([...a].filter((i) => b.has(i)).length).toBeLessThan(a.size);
  });

  it("makes a glitching background cell flare up and a glitching letter cell dip", () => {
    const find = (isLetter: boolean) => {
      for (let i = 0; i < 4000; i++) {
        const base = { ...formed, col: i % 100, row: Math.floor(i / 100), isLetter };
        const on = cellState({ ...base, shimmer: true });
        if (on.glyph !== cellState({ ...base, shimmer: false }).glyph) return on;
      }
      throw new Error("no glitching cell found");
    };
    expect(find(false).alpha).toBeCloseTo(ALPHA.glitchField, 5);
    expect(find(true).alpha).toBeCloseTo(ALPHA.glitchLetter, 5);
  });

  it("flickers a scrambled cell faster than 14 Hz", () => {
    let changes = 0;
    let prev = cellState({ ...formed, settle: 0, isLetter: false, time: 0 }).glyph;
    for (let t = 5; t <= 1000; t += 5) {
      const g = cellState({ ...formed, settle: 0, isLetter: false, time: t }).glyph;
      if (g !== prev) changes++;
      prev = g;
    }
    // about half of the 14–28 re-rolls per second change the glyph
    expect(changes).toBeGreaterThan(4);
  });
});
