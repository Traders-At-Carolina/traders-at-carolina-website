/**
 * Pure logic for the footer bit wordmark (spec 08). Everything the canvas component needs to decide, with no DOM:
 * the grid, the letter mask, the scroll-in load, the hover falloff and what each cell shows. Unit-tested. The bit
 * primitives it shares with the 404 page live in components/bits/bitCore.ts and are re-exported here.
 */
import { clamp01, flickerBit, glitching, seededBit, type Glyph } from "@/components/bits/bitCore";

export {
  GLITCH_TICK_MS,
  LOAD_HOLD_MS,
  LOAD_MS,
  LOAD_TOTAL_MS,
  buildGrid,
  buildLetterMask,
  cellSettle,
  loadProgress,
  seededBit,
  settleThreshold,
  type Glyph,
} from "@/components/bits/bitCore";

export const HOVER_RADIUS = 16;
export const TOUCH_HOVER_RADIUS = 14;
export const HEAT_RELEASE_MS = 600;

/** Opacity of the bone glyphs in each state (spec 08 §4). */
export const ALPHA = { scrambled: 0.4, field: 0.12, letter: 1, glitchLetter: 0.5 } as const;

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
