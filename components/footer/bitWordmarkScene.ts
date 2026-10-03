/**
 * Pure logic for the footer bit wordmark (spec 08). Everything the canvas component needs to decide, with no DOM:
 * the grid, the letter mask, the scroll-in load, the hover falloff and what each cell shows. Unit-tested.
 */

/** Pure scramble before any bit locks in, then the stretch over which bits lock in at random moments. */
export const LOAD_HOLD_MS = 500;
export const LOAD_MS = 1600;
export const LOAD_TOTAL_MS = LOAD_HOLD_MS + LOAD_MS;
export const HOVER_RADIUS = 16;
export const TOUCH_HOVER_RADIUS = 14;
export const HEAT_RELEASE_MS = 600;
/** How long a bit takes to settle once its moment comes, as a fraction of the load. */
const LOAD_SOFTNESS = 0.12;
/** Once formed, about GLITCH_SHARE% of cells glitch in any GLITCH_TICK_MS window, a different set each window. */
export const GLITCH_TICK_MS = 110;
const GLITCH_SHARE = 4;

/** Opacity of the bone glyphs in each state (spec 08 §4). */
export const ALPHA = { scrambled: 0.4, field: 0.12, letter: 1, glitchLetter: 0.5 } as const;

export type Glyph = "0" | "1";

/**
 * Stacked lines keep the letters big: the name on one line would be only a fifth as tall as it is wide. Two lines
 * from md up, three below. The widest line is fitted to the band's width, and the block sits low so the last line
 * runs off the bottom edge: `cut` is the fraction of its cap height that is cropped, `gap` the baseline-to-baseline
 * pitch in cap heights. `aspect` is band height / width, chosen so the first line clears the top fade.
 */
export function wordmarkLayout(wide: boolean) {
  return wide
    ? { lines: ["Traders at", "Carolina"], aspect: 0.28, cell: 8, cut: 0.35, gap: 1.25 }
    : { lines: ["Traders", "at", "Carolina"], aspect: 0.57, cell: 5, cut: 0.35, gap: 1.25 };
}

/** Baseline of each line, top to bottom: the last sits `cut` of a cap height below the band's bottom edge. */
export function lineBaselines(count: number, height: number, capHeight: number, cut: number, gap: number) {
  const last = height + cut * capHeight;
  return Array.from({ length: count }, (_, i) => last - (count - 1 - i) * gap * capHeight);
}

/** Whole square cells covering the canvas; never empty. */
export function buildGrid(width: number, height: number, cell: number) {
  return { cols: Math.max(1, Math.round(width / cell)), rows: Math.max(1, Math.round(height / cell)) };
}

/** Per-cell letter mask from 0–255 coverage values: a cell belongs to a letter when at least half covered. */
export function buildLetterMask(coverage: ArrayLike<number>) {
  const mask = new Uint8Array(coverage.length);
  for (let i = 0; i < coverage.length; i++) mask[i] = coverage[i] >= 128 ? 1 : 0;
  return mask;
}

/** Small integer hash: deterministic pseudo-randomness per (a, b, c), so the resolved field never changes. */
function hash3(a: number, b: number, c: number) {
  let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** The cell's resolved bit. */
export function seededBit(col: number, row: number): 0 | 1 {
  return ((hash3(col, row, 1) >>> 8) & 1) as 0 | 1;
}

/** A scrambled cell re-rolls at its own 14–28 Hz. */
function flickerBit(col: number, row: number, time: number): 0 | 1 {
  const rate = 14 + (hash3(col, row, 2) % 15);
  const phase = (hash3(col, row, 3) % 1000) / 1000;
  const tick = Math.floor((time / 1000) * rate + phase);
  return ((hash3(col, row, 100 + tick) >>> 8) & 1) as 0 | 1;
}

/** Whether the cell is glitching in the current window (a different ~4% each window). */
function glitching(col: number, row: number, time: number) {
  return hash3(col, row, 5000 + Math.floor(time / GLITCH_TICK_MS)) % 100 < GLITCH_SHARE;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 → 1 progress of the scroll-in load `elapsed` ms after it starts: nothing during the hold, then a smooth ramp. */
export function loadProgress(elapsed: number) {
  const u = clamp01((elapsed - LOAD_HOLD_MS) / LOAD_MS);
  return u * u * (3 - 2 * u);
}

/** The point in the load, 0 ≤ t < 1, at which this cell locks in. Fixed per cell, spread evenly across the field. */
export function settleThreshold(col: number, row: number) {
  return (hash3(col, row, 4) >>> 8) / 2 ** 24;
}

/** How settled a cell is (0 = still flickering, 1 = formed) at a load progress, given its threshold. */
export function cellSettle(threshold: number, progress: number) {
  return clamp01((progress * (1 + LOAD_SOFTNESS) - threshold) / LOAD_SOFTNESS);
}

/** Pointer influence on a cell: fully on within 70% of the radius, then a linear fade to 0 at the radius. */
export function hoverStrength(distance: number, radius: number) {
  if (distance >= radius) return 0;
  const inner = radius * 0.7;
  if (distance <= inner) return 1;
  return (radius - distance) / (radius - inner);
}

/** A hovered cell's heat falls linearly to 0 over the release time. */
export function decayHeat(heat: number, dtMs: number) {
  return Math.max(0, heat - dtMs / HEAT_RELEASE_MS);
}

type CellInput = {
  col: number;
  row: number;
  isLetter: boolean;
  /** Absolute ms, drives flicker and glitching. */
  time: number;
  /** 0 = scrambled, 1 = formed (from `cellSettle`). */
  settle: number;
  /** 0–1 hover heat. Only letter cells respond, and only once they have settled. */
  heat: number;
  /** Constant glitching on a formed field. Off under reduced motion. */
  shimmer: boolean;
};

/**
 * What a cell shows: its glyph, the bone opacity to draw it at, and `lit` (0–1), how strongly the pointer is
 * lighting it, which the canvas draws as an extra bright white glow on top.
 */
export function cellState({ col, row, isLetter, time, settle, heat, shimmer }: CellInput): { glyph: Glyph; alpha: number; lit: number } {
  const resting = isLetter ? ALPHA.letter : ALPHA.field;
  let bit: 0 | 1;
  let glitch = false;
  if (settle > 0.5) {
    bit = seededBit(col, row);
    // Only the lettering glitches once formed: the background field holds still.
    if (shimmer && isLetter && settle >= 1 && glitching(col, row, time)) {
      glitch = true;
      bit = bit ? 0 : 1;
    }
  } else {
    bit = flickerBit(col, row, time);
  }
  let alpha = ALPHA.scrambled + (resting - ALPHA.scrambled) * settle;
  // A glitching letter bit dips off its resting brightness.
  if (glitch) alpha = Math.min(alpha, ALPHA.glitchLetter);
  const h = isLetter ? clamp01(heat) * settle : 0;
  return { glyph: h >= 0.5 ? "1" : bit ? "1" : "0", alpha: alpha * (1 - h) + h, lit: h };
}
