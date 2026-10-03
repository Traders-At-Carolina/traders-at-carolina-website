/**
 * Pure logic for the Home hero's volatility surface drawn in 1s and 0s (spec 01 §3.1). Projects the surface onto a
 * grid of square cells, fills a cell-resolution depth buffer, draws the wire grid, the ATM line and the axes as
 * lines of cells, and decides what each cell shows. No DOM; unit-tested. BitSurface.tsx owns the canvas.
 */

import { clamp01, flickerBit, glitching, seededBit, type Glyph } from "@/lib/bit-field";
import {
  CAMERA,
  NK,
  NT,
  SCENE,
  TICKS,
  WIRE_STEP,
  toX,
  toY,
  toZ,
  viewBasis,
  xFromMoneyness,
  zFromMaturity,
  type Vec3,
} from "@/components/home/volSurfaceScene";

/** What a cell holds, in drawing priority: any line beats the fill, the wire grid beats the axes, the ATM line wins. */
export const KIND = { empty: 0, fill: 1, axis: 2, wire: 3, atm: 4 } as const;

/** Square cell size in CSS px: 9 from md up, 7 below, so each digit is big enough to read. */
export const cellSize = (wide: boolean) => (wide ? 9 : 7);

/** Pointer spotlight radius in CSS px (spec 01 §3.1): a pinpoint, about three bits across. */
export const SPOTLIGHT_RADIUS = 16;
export const TOUCH_SPOTLIGHT_RADIUS = 14;
/** Once formed, about GLITCH_SHARE% of the surface's bits glitch in any 110ms window: enough to feel alive, not noisy. */
const GLITCH_SHARE = 1.5;

/** Navy opacity of each kind of cell at rest. Fill runs from `fill[0]` to `fill[1]` with absolute implied vol. */
export const ALPHA = { scrambled: 0.28, fill: [0.3, 0.62], underside: 0.65, axis: 0.7, wire: 0.95, atm: 1 } as const;
/** Fill density follows absolute implied vol (not each surface's own range), so a sell-off reads denser than a calm market. */
const FILL_VOL = [0.12, 0.6] as const;
/** Tick marks stick out this far from their axis, in scene units. */
const TICK = 0.12;

const { halfX: X, halfZ: Z, height: H } = SCENE;
const [TX, TY, TZ] = CAMERA.target;
/** The at-the-money column (K/S = 1, log-moneyness 0): its line traces the ATM term structure. */
const ATM_COLUMN = (NK - 1) / 2;

/**
 * Small text labels beside the bit axes (spec 01 §3.1). `facing` is the outward direction of the label's axis: the
 * label shows while the camera is on that side and fades as the axis turns away, so far-side numbers never float
 * over the surface during the spin.
 */
export type AxisLabel = { text: string; at: Vec3; kind: "tick" | "title"; facing: Vec3 };

const FRONT: Vec3 = [0, 0, 1];
const RIGHT: Vec3 = [1, 0, 0];
const CORNER: Vec3 = [Math.SQRT1_2, 0, Math.SQRT1_2];
const maturityText = (T: number) => (T < 1 || !Number.isInteger(T) ? `${Math.round(T * 12)}M` : `${T}Y`);

export const AXIS_LABELS: AxisLabel[] = [
  ...TICKS.strike.map((m): AxisLabel => ({ text: m === 1 ? "1.0" : String(m), at: [xFromMoneyness(m), 0, Z + 0.3], kind: "tick", facing: FRONT })),
  ...TICKS.maturity.map((T): AxisLabel => ({ text: maturityText(T), at: [X + 0.32, 0, zFromMaturity(T)], kind: "tick", facing: RIGHT })),
  ...TICKS.vol.map((v): AxisLabel => ({ text: `${Math.round(v * 100)}%`, at: [X + 0.24, toY(v), Z + 0.24], kind: "tick", facing: CORNER })),
  { text: "Strike K/S", at: [xFromMoneyness(0.9), 0, Z + 0.62], kind: "title", facing: FRONT },
  { text: "Maturity", at: [X + 0.62, 0, zFromMaturity(1.25)], kind: "title", facing: RIGHT },
  { text: "Implied vol", at: [X, H + 0.22, Z], kind: "title", facing: CORNER },
];

/** A label's position in cell space: its projected anchor, held inside the grid so a label never leaves the figure. */
export function labelPosition(view: View, at: Vec3): [number, number] {
  const [c, r] = projectPoint(view, at);
  return [Math.min(view.cols - 1, Math.max(1, c)), Math.min(view.rows - 1, Math.max(1, r))];
}

/** Label opacity for a camera angle: fully shown while its axis faces the camera, gone once edge-on or behind. */
export function labelOpacity(azimuth: number, facing: Vec3) {
  return clamp01((Math.sin(azimuth) * facing[0] + Math.cos(azimuth) * facing[2] - 0.05) / 0.25);
}

/**
 * Everything that must stay in frame: the box corners, pushed out on the axis side to hold the tick marks. The text
 * labels sit in the margin around it (they are HTML, so they never clip at the canvas edge) rather than shrinking
 * the surface to fit them.
 */
const FIT_POINTS: Vec3[] = [-X, X + TICK].flatMap((x) => [0, H].flatMap((y) => [-Z, Z + TICK].map((z): Vec3 => [x, y, z])));

/** An orthographic view: screen axes, scale in cells per scene unit, and the grid it projects onto. */
export type View = ReturnType<typeof viewBasis> & { scale: number; cols: number; rows: number };

export function makeView(azimuth: number, polar: number, scale: number, cols: number, rows: number): View {
  return { ...viewBasis(azimuth, polar), scale, cols, rows };
}

/** Projects a scene point to cell space: [col, row] as floats (the box centre lands mid-grid) and depth (larger is farther). */
export function projectPoint(view: View, [x, y, z]: Vec3): Vec3 {
  const { right: r, up: u, forward: f, scale, cols, rows } = view;
  const dx = x - TX;
  const dy = y - TY;
  const dz = z - TZ;
  return [
    cols / 2 + (dx * r[0] + dy * r[1] + dz * r[2]) * scale,
    rows / 2 - (dx * u[0] + dy * u[1] + dz * u[2]) * scale,
    dx * f[0] + dy * f[1] + dz * f[2],
  ];
}

/**
 * Largest scale (cells per scene unit) at which the whole box and its tick marks stay inside the grid, with `margin`
 * as a fraction of the half-grid. Recomputed as the camera turns, so the surface fills the figure from every angle
 * without ever clipping.
 */
export function fitScale(cols: number, rows: number, azimuth: number, polar: number, margin = 0.92) {
  const { right, up } = viewBasis(azimuth, polar);
  let sx = 0;
  let sy = 0;
  for (const [x, y, z] of FIT_POINTS) {
    const d: Vec3 = [x - TX, y - TY, z - TZ];
    sx = Math.max(sx, Math.abs(d[0] * right[0] + d[1] * right[1] + d[2] * right[2]));
    sy = Math.max(sy, Math.abs(d[0] * up[0] + d[1] * up[1] + d[2] * up[2]));
  }
  return Math.min(((cols / 2) * margin) / sx, ((rows / 2) * margin) / sy);
}

/** Eases the drawn scale toward its fitted goal (≈ 0.25s time constant), so fit changes never look like a zoom jump. */
export function easeScale(current: number, goal: number, dtSeconds: number) {
  return current + (goal - current) * (1 - Math.exp(-Math.min(dtSeconds, 0.05) * 4));
}

/** Per-cell buffers for one frame, plus per-vertex scratch. Allocated once per grid size, rewritten every frame. */
export type Raster = {
  cols: number;
  rows: number;
  kind: Uint8Array;
  depth: Float32Array;
  vol: Float32Array;
  /** 1 where the cell shows the underside of the surface. */
  under: Uint8Array;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
};

export function createRaster(cols: number, rows: number): Raster {
  const cells = cols * rows;
  return {
    cols,
    rows,
    kind: new Uint8Array(cells),
    depth: new Float32Array(cells),
    vol: new Float32Array(cells),
    under: new Uint8Array(cells),
    vx: new Float32Array(NK * NT),
    vy: new Float32Array(NK * NT),
    vz: new Float32Array(NK * NT),
  };
}

/**
 * Draws one frame of the surface into `out`. `values` are implied vols on the NK × NT grid (`surfaceGrid`).
 * 1. Every vertex is projected to cell space.
 * 2. Each grid quad is filled as two triangles into the depth buffer: a cell belongs to the triangle that covers
 *    its centre, and the nearest triangle wins. Fill cells keep their interpolated vol and which side they show.
 * 3. The wire grid (every WIRE_STEP rows and columns, which includes the outline), the ATM column and the three axes
 *    with their tick marks are walked as lines of cells, depth-tested against the fill with a small bias, so the
 *    surface hides what is behind it but never its own lines.
 */
export function rasterize(values: ArrayLike<number>, view: View, out: Raster) {
  const { cols, rows, kind, depth, vol, under, vx, vy, vz } = out;
  const { right: r, up: u, forward: f, scale } = view;
  kind.fill(KIND.empty);
  depth.fill(Infinity);
  under.fill(0);

  const ox = cols / 2;
  const oy = rows / 2;
  for (let iT = 0; iT < NT; iT++) {
    const dz = toZ(iT) - TZ;
    for (let ik = 0; ik < NK; ik++) {
      const i = iT * NK + ik;
      const dx = toX(ik) - TX;
      const dy = toY(values[i]) - TY;
      vx[i] = ox + (dx * r[0] + dy * r[1] + dz * r[2]) * scale;
      vy[i] = oy - (dx * u[0] + dy * u[1] + dz * u[2]) * scale;
      vz[i] = dx * f[0] + dy * f[1] + dz * f[2];
    }
  }

  // Both triangles below wind so that the world normal points up (+y). Projected, an up-facing triangle has
  // negative signed area, so a positive area means the camera is looking at the underside.
  const triangle = (a: number, b: number, c: number) => {
    const ax = vx[a];
    const ay = vy[a];
    const bx = vx[b];
    const by = vy[b];
    const cx = vx[c];
    const cy = vy[c];
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) return;
    const side = area > 0 ? 1 : 0;
    const c0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 0.5));
    const c1 = Math.min(cols - 1, Math.floor(Math.max(ax, bx, cx) - 0.5));
    const r0 = Math.max(0, Math.ceil(Math.min(ay, by, cy) - 0.5));
    const r1 = Math.min(rows - 1, Math.floor(Math.max(ay, by, cy) - 0.5));
    for (let row = r0; row <= r1; row++) {
      const py = row + 0.5;
      for (let col = c0; col <= c1; col++) {
        const px = col + 0.5;
        const wa = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
        const wb = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
        const wc = 1 - wa - wb;
        if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) continue;
        const i = row * cols + col;
        const z = wa * vz[a] + wb * vz[b] + wc * vz[c];
        if (z < depth[i]) {
          depth[i] = z;
          kind[i] = KIND.fill;
          vol[i] = wa * values[a] + wb * values[b] + wc * values[c];
          under[i] = side;
        }
      }
    }
  };
  for (let iT = 0; iT < NT - 1; iT++) {
    for (let ik = 0; ik < NK - 1; ik++) {
      const a = iT * NK + ik;
      triangle(a, a + 1, a + NK);
      triangle(a + 1, a + NK + 1, a + NK);
    }
  }

  // About two cells of depth slack: enough that a line on the surface is never hidden by the surface itself.
  // A line clearly in front of what a cell holds takes it over (and becomes its depth); a line at the same depth
  // (on the surface) only takes it if it outranks it; a line behind is hidden.
  const bias = 2 / scale;
  const line = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, k: number) => {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const col = Math.floor(x0 + (x1 - x0) * t);
      const row = Math.floor(y0 + (y1 - y0) * t);
      if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
      const i = row * cols + col;
      const z = z0 + (z1 - z0) * t;
      if (z < depth[i] - bias) {
        kind[i] = k;
        depth[i] = z;
        under[i] = 0;
      } else if (z <= depth[i] + bias && kind[i] < k) {
        kind[i] = k;
      }
    }
  };
  const edge = (a: number, b: number, k: number) => line(vx[a], vy[a], vz[a], vx[b], vy[b], vz[b], k);
  for (let iT = 0; iT < NT; iT += WIRE_STEP) for (let ik = 0; ik < NK - 1; ik++) edge(iT * NK + ik, iT * NK + ik + 1, KIND.wire);
  for (let ik = 0; ik < NK; ik += WIRE_STEP) {
    const k = ik === ATM_COLUMN ? KIND.atm : KIND.wire;
    for (let iT = 0; iT < NT - 1; iT++) edge(iT * NK + ik, (iT + 1) * NK + ik, k);
  }

  const segment = (p: Vec3, q: Vec3) => {
    const [x0, y0, z0] = projectPoint(view, p);
    const [x1, y1, z1] = projectPoint(view, q);
    line(x0, y0, z0, x1, y1, z1, KIND.axis);
  };
  segment([-X, 0, Z], [X, 0, Z]);
  segment([X, 0, Z], [X, 0, -Z]);
  segment([X, 0, Z], [X, H, Z]);
  for (const m of TICKS.strike) segment([xFromMoneyness(m), 0, Z], [xFromMoneyness(m), 0, Z + TICK]);
  for (const T of TICKS.maturity) segment([X, 0, zFromMaturity(T)], [X + TICK, 0, zFromMaturity(T)]);
  for (const v of TICKS.vol) segment([X, toY(v), Z], [X + TICK * 0.7, toY(v), Z + TICK * 0.7]);
  return out;
}

/** Resting navy opacity for a cell: ATM > wire > axis > fill, fill denser with higher vol, the underside dimmer. */
export function cellLook(kind: number, vol: number, under: boolean) {
  const side = under ? ALPHA.underside : 1;
  switch (kind) {
    case KIND.atm:
      return ALPHA.atm;
    case KIND.wire:
      return ALPHA.wire * side;
    case KIND.axis:
      return ALPHA.axis;
    case KIND.fill: {
      const t = clamp01((vol - FILL_VOL[0]) / (FILL_VOL[1] - FILL_VOL[0]));
      return (ALPHA.fill[0] + (ALPHA.fill[1] - ALPHA.fill[0]) * t) * side;
    }
    default:
      return 0;
  }
}

/** Scramble opacity before a cell settles: a soft oval cloud filling the figure, fading out before its edges. */
export function scrambleAlpha(col: number, row: number, cols: number, rows: number) {
  const dx = ((col + 0.5) / cols) * 2 - 1;
  const dy = ((row + 0.5) / rows) * 2 - 1;
  return ALPHA.scrambled * clamp01((1.05 - Math.hypot(dx, dy)) / 0.45);
}

type BitCellInput = {
  col: number;
  row: number;
  cols: number;
  rows: number;
  kind: number;
  vol: number;
  under: boolean;
  /** Absolute ms, drives flicker and glitching. */
  time: number;
  /** 0 = scrambled, 1 = formed (from `cellSettle`). */
  settle: number;
  /** 0–1 pointer heat. Only surface cells respond, and only once they have settled. */
  heat: number;
  /** Constant glitching on the formed surface. Off under reduced motion. */
  shimmer: boolean;
};

/**
 * What a cell shows: its glyph, the navy opacity to draw it at, and `lit` (0–1), how strongly the pointer is
 * lighting it, which the canvas draws as an extra glow on top. Unsettled cells flicker in the scramble cloud;
 * settled ones take their resting look, so empty cells fade out and the surface resolves out of the noise.
 */
export function bitCell({ col, row, cols, rows, kind, vol, under, time, settle, heat, shimmer }: BitCellInput): {
  glyph: Glyph;
  alpha: number;
  lit: number;
} {
  const surface = kind !== KIND.empty;
  const resting = cellLook(kind, vol, under);
  let bit: 0 | 1;
  let glitch = false;
  if (settle > 0.5) {
    bit = seededBit(col, row);
    if (shimmer && surface && settle >= 1 && glitching(col, row, time, GLITCH_SHARE)) {
      glitch = true;
      bit = bit ? 0 : 1;
    }
  } else {
    bit = flickerBit(col, row, time);
  }
  const scrambled = scrambleAlpha(col, row, cols, rows);
  let alpha = scrambled + (resting - scrambled) * settle;
  // A glitching bit dips to half its resting strength.
  if (glitch) alpha *= 0.5;
  const h = surface ? clamp01(heat) * settle : 0;
  return { glyph: h >= 0.5 ? "1" : bit ? "1" : "0", alpha: alpha * (1 - h) + h, lit: h };
}

/** The camera: angles plus the idle spin's velocities and clock. */
export type CameraState = { azimuth: number; polar: number; t: number; va: number; vp: number };

export const initialCamera = (): CameraState => ({ azimuth: CAMERA.azimuth, polar: CAMERA.polar, t: 0, va: 0, vp: 0 });

export const clampPolar = (polar: number) => Math.min(CAMERA.maxPolar, Math.max(CAMERA.minPolar, polar));

/**
 * Idle spin: turns the camera at a constant, slow rate (azimuth increasing, so the surface turns clockwise seen
 * from above), easing up to speed after a drag, while gently settling the tilt back to the default view.
 * Mutates and returns `s`.
 */
export function stepCamera(s: CameraState, dtSeconds: number, animate: boolean) {
  if (!animate) {
    s.va = 0;
    s.vp = 0;
    return s;
  }
  const dt = Math.min(dtSeconds, 0.05);
  s.t += dt;
  s.va += (CAMERA.spin - s.va) * (1 - Math.exp(-dt * 1.6));
  const goalPolar = CAMERA.polar + 0.04 * Math.sin((s.t / 31) * 2 * Math.PI);
  const k = 0.9;
  s.vp = Math.max(-0.2, Math.min(0.2, s.vp + (k * k * (goalPolar - s.polar) - 2 * k * s.vp) * dt));
  s.azimuth += s.va * dt;
  s.polar = clampPolar(s.polar + s.vp * dt);
  return s;
}
