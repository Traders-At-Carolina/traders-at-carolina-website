/**
 * Pure logic for the 404 page's 3D bit figure (spec 10). Everything the canvas component needs to decide, with no
 * DOM: the extruded voxel shell, the projection and draw order, the pose that follows the pointer, the idle sway and
 * what each bit shows. Unit-tested. Bits, flicker, glitch and load timing come from the shared bitCore.
 *
 * Coordinates are in cells: x to the right, y down, z toward the viewer. A positive yaw turns the front face to the
 * right; a positive pitch tilts it down, so its top edge comes toward the viewer.
 */
import { clamp01, flickerBit, glitching, seededBit, type Glyph } from "@/components/bits/bitCore";

const rad = (deg: number) => (deg * Math.PI) / 180;

export type Pose = { yaw: number; pitch: number };

/** Maximum tilt toward the pointer. */
export const MAX_YAW = rad(35);
export const MAX_PITCH = rad(25);
/** Three-quarter view: turned a little left and seen from slightly above, so the figure reads as 3D at rest. */
export const REST_POSE: Pose = { yaw: rad(-12), pitch: rad(8) };
/** Idle sway around the rest pose, after IDLE_DELAY_MS without pointer movement. */
export const IDLE_DELAY_MS = 2500;
export const IDLE_YAW = rad(10);
export const IDLE_PITCH = rad(4);
const IDLE_YAW_HZ = 0.1;
const IDLE_PITCH_HZ = 0.07;
/** Easing time constants: snappy when following the pointer, slower when drifting back to rest or into the sway. */
export const EASE_MS = 140;
export const RETURN_EASE_MS = 600;
/** Camera distance from the figure's center, in figure widths. */
export const CAMERA_DISTANCE = 3.5;
/** Extrusion depth as a share of the letters' height. */
const DEPTH_RATIO = 0.3;
const MIN_LAYERS = 4;
/** Depth fade: opacity of the farthest bit; the nearest is fully opaque. Gentle, so the face reads evenly. */
const FAR_ALPHA = 0.65;
/** The walls and back face are shaded lighter than the front face, like the sides of extruded type. */
const WALL_SHADE = 0.6;

/** Navy opacity multipliers per bit state (spec 10 §7), applied on top of the depth opacity. */
export const ALPHA_404 = { scrambled: 0.4, glitch: 0.5 } as const;

/**
 * Grid cell size in px, the figure's box (height / width) and the share of the box's width the "404" fills. The box
 * leaves room around the glyphs so the figure stays inside it at full tilt.
 */
export function figureLayout(wide: boolean) {
  return wide ? { cell: 9, aspect: 0.5, fit: 0.7 } : { cell: 6, aspect: 0.62, fit: 0.7 };
}

/** The box around the letter cells, inclusive, or null if there are none. */
export function letterBounds(mask: ArrayLike<number>, cols: number, rows: number) {
  let c0 = cols;
  let c1 = -1;
  let r0 = rows;
  let r1 = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[r * cols + c]) continue;
      if (c < c0) c0 = c;
      if (c > c1) c1 = c;
      if (r < r0) r0 = r;
      if (r > r1) r1 = r;
    }
  }
  return c1 < 0 ? null : { c0, c1, r0, r1 };
}

/** Number of layers the letters are extruded through, from their height in cells. */
export function extrusionLayers(heightCells: number) {
  return Math.max(MIN_LAYERS, Math.round(heightCells * DEPTH_RATIO));
}

export type Shell = {
  count: number;
  /** Position of each bit, centered on the solid. */
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  /** Grid cell and layer of each bit (layer 0 is the front face), for its seeded bit and settle moment. */
  col: Uint16Array;
  row: Uint16Array;
  layer: Uint8Array;
  /** Width of the letters in cells. */
  width: number;
};

/**
 * The extruded letters as a hollow shell of bits: every letter cell on the front and back faces, and only edge cells
 * (a letter cell with an empty or out-of-grid neighbour above, below, left or right) on the layers between.
 */
export function buildShell(mask: ArrayLike<number>, cols: number, rows: number, layers: number): Shell {
  const bounds = letterBounds(mask, cols, rows);
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  const cs: number[] = [];
  const rs: number[] = [];
  const ls: number[] = [];
  if (!bounds) return toShell(xs, ys, zs, cs, rs, ls, 0);

  const cx = (bounds.c0 + bounds.c1 + 1) / 2;
  const cy = (bounds.r0 + bounds.r1 + 1) / 2;
  const mid = (layers - 1) / 2;
  const at = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows && mask[r * cols + c] === 1;

  for (let layer = 0; layer < layers; layer++) {
    const face = layer === 0 || layer === layers - 1;
    for (let r = bounds.r0; r <= bounds.r1; r++) {
      for (let c = bounds.c0; c <= bounds.c1; c++) {
        if (!at(c, r)) continue;
        if (!face && at(c - 1, r) && at(c + 1, r) && at(c, r - 1) && at(c, r + 1)) continue;
        xs.push(c + 0.5 - cx);
        ys.push(r + 0.5 - cy);
        zs.push(mid - layer);
        cs.push(c);
        rs.push(r);
        ls.push(layer);
      }
    }
  }
  return toShell(xs, ys, zs, cs, rs, ls, bounds.c1 - bounds.c0 + 1);
}

function toShell(x: number[], y: number[], z: number[], col: number[], row: number[], layer: number[], width: number): Shell {
  return {
    count: x.length,
    x: Float32Array.from(x),
    y: Float32Array.from(y),
    z: Float32Array.from(z),
    col: Uint16Array.from(col),
    row: Uint16Array.from(row),
    layer: Uint8Array.from(layer),
    width,
  };
}

export type Projection = { sx: Float32Array; sy: Float32Array; scale: Float32Array; depth: Float32Array };

/**
 * Rotates every bit by the pose (yaw about the vertical axis, then pitch about the horizontal one) and projects it
 * with the camera `distance` cells in front of the center. Writes screen offsets from the center (cells), the
 * perspective scale and the depth (larger is nearer) into `out`, reusing its buffers.
 */
export function projectShell(shell: Shell, pose: Pose, distance: number, out: Projection) {
  const cy = Math.cos(pose.yaw);
  const sy = Math.sin(pose.yaw);
  const cp = Math.cos(pose.pitch);
  const sp = Math.sin(pose.pitch);
  for (let i = 0; i < shell.count; i++) {
    const x = shell.x[i];
    const y = shell.y[i];
    const z = shell.z[i];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp + z1 * sp;
    const z2 = -y * sp + z1 * cp;
    const s = distance / (distance - z2);
    out.sx[i] = x1 * s;
    out.sy[i] = y2 * s;
    out.scale[i] = s;
    out.depth[i] = z2;
  }
}

/**
 * Sorts `order` far to near (ascending depth) in place. Insertion sort: the pose changes a little per frame, so the
 * previous frame's order is nearly sorted and this runs in close to linear time.
 */
export function sortByDepth(order: Uint32Array, depth: ArrayLike<number>) {
  for (let i = 1; i < order.length; i++) {
    const idx = order[i];
    const d = depth[idx];
    let j = i - 1;
    while (j >= 0 && depth[order[j]] > d) {
      order[j + 1] = order[j];
      j--;
    }
    order[j + 1] = idx;
  }
}

/** Depth cue: FAR_ALPHA at the farthest bit (`min`) up to 1 at the nearest (`max`), linear between. */
export function depthAlpha(depth: number, min: number, max: number) {
  if (max <= min) return 1;
  return FAR_ALPHA + (1 - FAR_ALPHA) * clamp01((depth - min) / (max - min));
}

/** Opacity multiplier for a bit's layer: the front face (layer 0) at full strength, everything behind it shaded. */
export function layerShade(layer: number) {
  return layer === 0 ? 1 : WALL_SHADE;
}

/**
 * The pose that turns the front face toward a pointer (dx, dy) px from the figure's center, in a viewport vw × vh:
 * full tilt when the pointer is half a viewport away.
 */
export function targetPose(dx: number, dy: number, vw: number, vh: number): Pose {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  return { yaw: clamp(dx / (vw / 2)) * MAX_YAW, pitch: clamp(dy / (vh / 2)) * MAX_PITCH };
}

/** Exponential smoothing toward the target, independent of frame rate. */
export function easePose(current: Pose, target: Pose, dtMs: number, tauMs = EASE_MS): Pose {
  const k = 1 - Math.exp(-dtMs / tauMs);
  return { yaw: current.yaw + (target.yaw - current.yaw) * k, pitch: current.pitch + (target.pitch - current.pitch) * k };
}

/** The idle sway `elapsed` ms after it begins: starts exactly at the rest pose and drifts around it. */
export function idlePose(elapsed: number): Pose {
  const t = elapsed / 1000;
  return {
    yaw: REST_POSE.yaw + IDLE_YAW * Math.sin(2 * Math.PI * IDLE_YAW_HZ * t),
    pitch: REST_POSE.pitch + IDLE_PITCH * Math.sin(2 * Math.PI * IDLE_PITCH_HZ * t),
  };
}

type BitInput = {
  col: number;
  row: number;
  layer: number;
  /** Absolute ms, drives flicker and glitching. */
  time: number;
  /** 0 = scrambled, 1 = formed (from `cellSettle`). */
  settle: number;
  /** Constant glitching on a formed figure. Off under reduced motion. */
  shimmer: boolean;
};

/** What a bit shows: its glyph and an opacity multiplier (the depth opacity is applied on top). */
export function bitState({ col, row, layer, time, settle, shimmer }: BitInput): { glyph: Glyph; alpha: number } {
  let bit: 0 | 1;
  let glitch = false;
  if (settle > 0.5) {
    bit = seededBit(col, row, layer);
    if (shimmer && settle >= 1 && glitching(col, row, time, layer)) {
      glitch = true;
      bit = bit ? 0 : 1;
    }
  } else {
    bit = flickerBit(col, row, time, layer);
  }
  let alpha = ALPHA_404.scrambled + (1 - ALPHA_404.scrambled) * settle;
  if (glitch) alpha = Math.min(alpha, ALPHA_404.glitch);
  return { glyph: bit ? "1" : "0", alpha };
}
