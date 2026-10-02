/**
 * Pure logic for the footer bit wordmark (spec 06). Everything the canvas component needs to decide, with no DOM:
 * the grid, the letter mask, the scroll-in wave, the hover falloff and what each cell shows. Unit-tested.
 */

export const WAVE_MS = 1600;
export const HOVER_RADIUS = 55;
export const TOUCH_HOVER_RADIUS = 40;
export const HEAT_RELEASE_MS = 600;
/** Width of the wave's soft front, as a fraction of the band's width (about 6 columns on desktop). */
const WAVE_SOFTNESS = 0.06;

/** Opacity of the bone glyphs in each state (spec 06 §4). */
export const ALPHA = { scrambled: 0.4, field: 0.12, letter: 1 } as const;

export type Glyph = "0" | "1";

/**
 * Stacked lines keep the letters big: the name on one line would be only a fifth as tall as it is wide. Two lines
 * from md up, three below. `aspect` is band height / width.
 */
export function wordmarkLayout(wide: boolean) {
  return wide
    ? { lines: ["Traders at", "Carolina"], aspect: 0.36, cell: 8 }
    : { lines: ["Traders", "at", "Carolina"], aspect: 0.8, cell: 5 };
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

/** A scrambled cell re-rolls at its own 8–14 Hz. */
function flickerBit(col: number, row: number, time: number): 0 | 1 {
  const rate = 8 + (hash3(col, row, 2) % 7);
  const phase = (hash3(col, row, 3) % 1000) / 1000;
  const tick = Math.floor((time / 1000) * rate + phase);
  return ((hash3(col, row, 100 + tick) >>> 8) & 1) as 0 | 1;
}

/** About 1% of cells are flipped in any given second, a different 1% each second. */
function shimmerFlip(col: number, row: number, time: number) {
  return hash3(col, row, 5000 + Math.floor(time / 1000)) % 100 === 0;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Eased 0 → 1 position of the scroll-in wave `elapsed` ms after it starts (ease-out). */
export function waveFront(elapsed: number) {
  if (elapsed <= 0) return 0;
  if (elapsed >= WAVE_MS) return 1;
  return 1 - (1 - elapsed / WAVE_MS) ** 3;
}

/** How settled a column is (0 = still flickering, 1 = formed) for a wave front; `x` is the column's 0–1 position. */
export function columnSettle(x: number, front: number) {
  return clamp01((front * (1 + WAVE_SOFTNESS) - x) / WAVE_SOFTNESS);
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
  /** Absolute ms, drives flicker and shimmer. */
  time: number;
  /** 0 = scrambled, 1 = formed (from `columnSettle`). */
  settle: number;
  /** 0–1 hover heat. Only letter cells respond, and only once the wave has reached them. */
  heat: number;
  /** Idle shimmer on a formed field. Off under reduced motion. */
  shimmer: boolean;
};

/** What a cell shows: its glyph and the bone opacity to draw it at. */
export function cellState({ col, row, isLetter, time, settle, heat, shimmer }: CellInput): { glyph: Glyph; alpha: number } {
  const resting = isLetter ? ALPHA.letter : ALPHA.field;
  let bit: 0 | 1;
  if (settle > 0.5) {
    bit = seededBit(col, row);
    if (shimmer && settle >= 1 && shimmerFlip(col, row, time)) bit = bit ? 0 : 1;
  } else {
    bit = flickerBit(col, row, time);
  }
  const base = ALPHA.scrambled + (resting - ALPHA.scrambled) * settle;
  const h = isLetter ? clamp01(heat) * settle : 0;
  return { glyph: h >= 0.5 ? "1" : bit ? "1" : "0", alpha: base * (1 - h) + h };
}
