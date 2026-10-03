/**
 * Bit primitives shared by the footer's BitWordmark (spec 08) and the 404 page's Bit404 (spec 10): the grid, the
 * letter mask, seeded bits, the scramble flicker, the glitch and the load timing. Pure, no DOM. Every per-cell
 * function takes an optional `layer` for 3D figures; layer 0 gives exactly the 2D wordmark's values.
 */

/** Pure scramble before any bit locks in, then the stretch over which bits lock in at random moments. */
export const LOAD_HOLD_MS = 500;
export const LOAD_MS = 1600;
export const LOAD_TOTAL_MS = LOAD_HOLD_MS + LOAD_MS;
/** How long a bit takes to settle once its moment comes, as a fraction of the load. */
const LOAD_SOFTNESS = 0.12;
/** Once formed, about GLITCH_SHARE% of bits glitch in any GLITCH_TICK_MS window, a different set each window. */
export const GLITCH_TICK_MS = 110;
const GLITCH_SHARE = 4;

export type Glyph = "0" | "1";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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

/**
 * Letter mask from RGBA pixels of text drawn `scale`× larger than the grid: each cell averages the alpha of its
 * scale × scale block of pixels, then `buildLetterMask` decides.
 */
export function maskFromPixels(px: ArrayLike<number>, cols: number, rows: number, scale: number) {
  const w = cols * scale;
  const h = rows * scale;
  const coverage = new Float32Array(cols * rows);
  for (let y = 0; y < h; y++) {
    const rowBase = Math.floor(y / scale) * cols;
    for (let x = 0; x < w; x++) coverage[rowBase + Math.floor(x / scale)] += px[(y * w + x) * 4 + 3];
  }
  for (let i = 0; i < coverage.length; i++) coverage[i] /= scale * scale;
  return buildLetterMask(coverage);
}

/** Small integer hash: deterministic pseudo-randomness per (a, b, c), so the resolved field never changes. */
function hash3(a: number, b: number, c: number) {
  let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Folds a layer into the column so layer 0 hashes exactly as the 2D wordmark always has. */
const key = (col: number, layer: number) => col ^ Math.imul(layer, 0x5bd1e995);

/** The cell's resolved bit. */
export function seededBit(col: number, row: number, layer = 0): 0 | 1 {
  return ((hash3(key(col, layer), row, 1) >>> 8) & 1) as 0 | 1;
}

/** A scrambled cell re-rolls at its own 14–28 Hz. */
export function flickerBit(col: number, row: number, time: number, layer = 0): 0 | 1 {
  const k = key(col, layer);
  const rate = 14 + (hash3(k, row, 2) % 15);
  const phase = (hash3(k, row, 3) % 1000) / 1000;
  const tick = Math.floor((time / 1000) * rate + phase);
  return ((hash3(k, row, 100 + tick) >>> 8) & 1) as 0 | 1;
}

/** Whether the cell is glitching in the current window (a different ~4% each window). */
export function glitching(col: number, row: number, time: number, layer = 0) {
  return hash3(key(col, layer), row, 5000 + Math.floor(time / GLITCH_TICK_MS)) % 100 < GLITCH_SHARE;
}

/** 0 → 1 progress of the load `elapsed` ms after it starts: nothing during the hold, then a smooth ramp. */
export function loadProgress(elapsed: number) {
  const u = clamp01((elapsed - LOAD_HOLD_MS) / LOAD_MS);
  return u * u * (3 - 2 * u);
}

/** The point in the load, 0 ≤ t < 1, at which this cell locks in. Fixed per cell, spread evenly across the field. */
export function settleThreshold(col: number, row: number, layer = 0) {
  return (hash3(key(col, layer), row, 4) >>> 8) / 2 ** 24;
}

/** How settled a cell is (0 = still flickering, 1 = formed) at a load progress, given its threshold. */
export function cellSettle(threshold: number, progress: number) {
  return clamp01((progress * (1 + LOAD_SOFTNESS) - threshold) / LOAD_SOFTNESS);
}
