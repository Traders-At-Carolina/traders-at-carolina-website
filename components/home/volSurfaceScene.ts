import { DOMAIN } from "@/lib/vol-surface";

/** Grid resolution of the hero's volatility surface (strike columns × maturity rows). */
export const NK = 61;
export const NT = 41;
/** Wire-grid spacing in grid steps: every 5th row and column is drawn as a line. */
export const WIRE_STEP = 5;

/** Scene box: strikes run along x, maturities along z (short dates in front), implied vol up y. */
export const SCENE = { halfX: 1.6, halfZ: 1.2, height: 1.3, volMin: 0.1, volMax: 0.8 } as const;
const { halfX: X, halfZ: Z, height: H } = SCENE;

type Vec3 = [number, number, number];

/** Scene height for an implied vol: the axis runs from 10% to 80%, so the surface sits on its axes. */
export function toY(vol: number) {
  return ((Math.min(Math.max(vol, SCENE.volMin), SCENE.volMax) - SCENE.volMin) / (SCENE.volMax - SCENE.volMin)) * SCENE.height;
}

/**
 * The axes meet at the front-right corner, the corner nearest the camera across the director's front views, so in
 * normal viewing the axes and their titles sit in front of the surface.
 */
export const AXIS_ORIGIN: Vec3 = [X, 0, Z];

/** Scene x for a strike given as K/S, and scene z for a maturity in years. */
export const xFromMoneyness = (m: number) => -X + ((Math.log(m) - DOMAIN.k[0]) / (DOMAIN.k[1] - DOMAIN.k[0])) * 2 * X;
export const zFromMaturity = (T: number) => Z - ((T - DOMAIN.T[0]) / (DOMAIN.T[1] - DOMAIN.T[0])) * 2 * Z;

const clampTo = ([lo, hi]: readonly [number, number], v: number) => Math.min(hi, Math.max(lo, v));
/** Inverse mappings, for hover: scene x → log-moneyness k, scene z → maturity T (clamped to the surface). */
export const kFromX = (x: number) => clampTo(DOMAIN.k, DOMAIN.k[0] + ((x + X) / (2 * X)) * (DOMAIN.k[1] - DOMAIN.k[0]));
export const tFromZ = (z: number) => clampTo(DOMAIN.T, DOMAIN.T[0] + ((Z - z) / (2 * Z)) * (DOMAIN.T[1] - DOMAIN.T[0]));

/** Tick values on each axis. K/S 1.0 is the at-the-money strike, where the bold ATM line runs. */
export const TICKS = {
  strike: [0.8, 1, 1.25],
  maturity: [
    { T: 0.5, text: "6M" },
    { T: 1, text: "1Y" },
    { T: 1.5, text: "18M" },
    { T: 2, text: "2Y" },
  ],
  vol: [0.2, 0.4, 0.6],
} as const;

/**
 * `facing` is the outward direction of the label's axis. Labels are currently shown from every angle, so it is unused
 * by the renderer.
 */
export type AxisLabel = { text: string; at: Vec3; kind: "tick" | "title"; facing: Vec3 };

const FRONT: Vec3 = [0, 0, 1];
const RIGHT: Vec3 = [1, 0, 0];
const CORNER: Vec3 = [Math.SQRT1_2, 0, Math.SQRT1_2];

/** Tick values and axis titles, anchored in scene space (the camera fit keeps them all in frame). */
export const AXIS_LABELS: AxisLabel[] = [
  ...TICKS.strike.map((m): AxisLabel => ({ text: m === 1 ? "1.0 ATM" : String(m), at: [xFromMoneyness(m), 0, Z + 0.2], kind: "tick", facing: FRONT })),
  ...TICKS.maturity.map(({ T, text }): AxisLabel => ({ text, at: [X + 0.22, 0, zFromMaturity(T)], kind: "tick", facing: RIGHT })),
  ...TICKS.vol.map((v): AxisLabel => ({ text: `${Math.round(v * 100)}%`, at: [X + 0.17, toY(v), Z + 0.17], kind: "tick", facing: CORNER })),
  { text: "Strike K/S", at: [-X + 0.25, 0, Z + 0.44], kind: "title", facing: FRONT },
  { text: "Maturity", at: [X + 0.28, 0, -Z - 0.3], kind: "title", facing: RIGHT },
  { text: "Implied vol", at: [X, H + 0.2, Z], kind: "title", facing: CORNER },
];

/**
 * Camera on a sphere around the box centre. Azimuth 0 looks straight down the maturity axis (strike runs across
 * the screen); π/2 looks along the strike axis (maturity runs across). Polar is measured from straight up.
 */
export const CAMERA = {
  target: [0, H / 2, 0] as Vec3,
  fov: 38,
  azimuth: 0.66,
  polar: 1.12,
  /** Idle spin: clockwise seen from above (camera azimuth increasing), one turn every 60 seconds. */
  spin: (2 * Math.PI) / 60,
  /** Dragging is free in every direction (all the way round, over the top and underneath). */
  minPolar: 0.02,
  maxPolar: Math.PI - 0.02,
};

export const toX = (ik: number) => -X + (2 * X * ik) / (NK - 1);
export const toZ = (iT: number) => Z - (2 * Z * iT) / (NT - 1);

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Unit vector from the target toward a camera at (azimuth, polar), matching OrbitControls' convention. */
export function cameraDirection(azimuth: number, polar: number): Vec3 {
  return [Math.sin(polar) * Math.sin(azimuth), Math.cos(polar), Math.sin(polar) * Math.cos(azimuth)];
}

function viewBasis(azimuth: number, polar: number) {
  const back = cameraDirection(azimuth, polar);
  const forward: Vec3 = [-back[0], -back[1], -back[2]];
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { forward, right, up };
}

/** Everything that must stay in frame: the eight box corners plus the axis titles. */
const FIT_POINTS: Vec3[] = [
  ...[-X, X].flatMap((x) => [0, H].flatMap((y) => [-Z, Z].map((z): Vec3 => [x, y, z]))),
  ...AXIS_LABELS.map((l) => l.at),
];

/**
 * Smallest camera distance at which every fit point (box corners and axis titles) stays inside the frame for this
 * view, with `margin` as a fraction of the half-frame. Recomputed as the camera moves, so the surface is framed as
 * tightly as each angle allows and never clips, however far it is dragged.
 */
export function fitDistance(aspect: number, azimuth: number, polar: number, fovDeg = CAMERA.fov, margin = 0.96): number {
  const tanV = Math.tan(((fovDeg / 2) * Math.PI) / 180) * margin;
  const tanH = tanV * aspect;
  const { forward, right, up } = viewBasis(azimuth, polar);
  const fits = (d: number) =>
    FIT_POINTS.every((p) => {
      const rel = sub(p, CAMERA.target);
      const depth = d + dot(rel, forward);
      return depth > 0.1 && Math.abs(dot(rel, right)) <= depth * tanH && Math.abs(dot(rel, up)) <= depth * tanV;
    });
  let lo = 1;
  let hi = 40;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

const poster = viewBasis(CAMERA.azimuth, CAMERA.polar);

/** Orthographic projection along the default camera direction, for the static SVG poster. */
export function project(p: Vec3): [number, number] {
  const d = sub(p, CAMERA.target);
  return [dot(d, poster.right), -dot(d, poster.up)];
}
