/**
 * DOM-free logic shared by the site's two fields of 0s and 1s: the footer wordmark (spec 08) and the Home hero's
 * volatility surface (spec 01 §3.1). Seeded bits, scramble flicker, glitching, the scroll-in load and the hover
 * falloff. Unit-tested through both scenes.
 */

/** Pure scramble before any bit locks in, then the stretch over which bits lock in at random moments. */
export const LOAD_HOLD_MS = 500;
export const LOAD_MS = 1600;
export const LOAD_TOTAL_MS = LOAD_HOLD_MS + LOAD_MS;
export const HEAT_RELEASE_MS = 600;
/** How long a bit takes to settle once its moment comes, as a fraction of the load. */
const LOAD_SOFTNESS = 0.12;
/** Glitching is decided per window of this length: a different set of cells each window. */
export const GLITCH_TICK_MS = 110;

export type Glyph = "0" | "1";

/** Whole square cells covering the canvas; never empty. */
export function buildGrid(width: number, height: number, cell: number) {
  return { cols: Math.max(1, Math.round(width / cell)), rows: Math.max(1, Math.round(height / cell)) };
}

/** Small integer hash: deterministic pseudo-randomness per (a, b, c), so a resolved field never changes. */
export function hash3(a: number, b: number, c: number) {
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
export function flickerBit(col: number, row: number, time: number): 0 | 1 {
  const rate = 14 + (hash3(col, row, 2) % 15);
  const phase = (hash3(col, row, 3) % 1000) / 1000;
  const tick = Math.floor((time / 1000) * rate + phase);
  return ((hash3(col, row, 100 + tick) >>> 8) & 1) as 0 | 1;
}

/** Whether the cell is glitching in the current window: about `sharePct`% of cells, a different set each window. */
export function glitching(col: number, row: number, time: number, sharePct: number) {
  return hash3(col, row, 5000 + Math.floor(time / GLITCH_TICK_MS)) % 100 < sharePct;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 → 1 progress of the load `elapsed` ms after it starts: nothing during the hold, then a smooth ramp. */
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
