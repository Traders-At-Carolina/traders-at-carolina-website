import type { VolParams } from "@/lib/vol-surface";

/** Grid resolution of the hero's volatility surface (strike columns × maturity rows). */
export const NK = 61;
export const NT = 41;
/** Wire-grid spacing in grid steps: every 5th row and column is drawn as a line. */
export const WIRE_STEP = 5;

/** Scene box: strikes run along x, maturities along z (short dates in front), implied vol up y. */
export const SCENE = { halfX: 1.6, halfZ: 1.2, height: 1.3, volMin: 0.1, volMax: 0.8 } as const;
const { halfX: X, halfZ: Z, height: H } = SCENE;

type Vec3 = [number, number, number];

/**
 * The axes meet at the front-right corner, which is the corner nearest the camera across the whole reachable arc,
 * so the axes and their titles always sit in front of the surface.
 */
export const AXIS_ORIGIN: Vec3 = [X, 0, Z];

/** Axis titles, anchored in scene space (the camera fit keeps them in frame too). Height is implied vol, named in the caption. */
export const AXIS_LABELS: { text: string; at: Vec3 }[] = [
  { text: "Strike", at: [0, 0, Z + 0.24] },
  { text: "Maturity", at: [X + 0.34, 0, 0] },
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
  /** Reachable angles (director and drag alike): the front-right quadrant, where the surface reads well. */
  minAzimuth: 0.05,
  maxAzimuth: 1.5,
  minPolar: 1.0,
  maxPolar: 1.2,
};

/** Best viewing angle for each kind of market change (spec 01 §3.1). */
export const VIEWS = {
  /** Face the strike axis: the smile / skew reads as a curve across the screen. */
  skew: 0.3,
  /** Three-quarter view: overall level of the surface. */
  level: 0.72,
  /** Face the maturity axis: the term structure reads as a slope across the screen. */
  term: 1.15,
} as const;

/**
 * Picks the view that best shows the move from one regime to the next, by which normalized parameter changes
 * most: skew (smile shape), term slope (term structure) or ATM vol (overall level).
 */
export function viewForChange(from: VolParams, to: VolParams): number {
  const skew = Math.abs(to.skew - from.skew) / 1.2;
  const term = Math.abs(to.termSlope - from.termSlope) / 0.8;
  const level = Math.abs(to.atmVol - from.atmVol) / 0.5;
  if (skew >= term && skew >= level) return VIEWS.skew;
  if (term >= level) return VIEWS.term;
  return VIEWS.level;
}

export const toX = (ik: number) => -X + (2 * X * ik) / (NK - 1);
export const toZ = (iT: number) => Z - (2 * Z * iT) / (NT - 1);
/** Vol axis starts at 10% (no tick values are shown), so the surface sits on its axes rather than floating. */
export const toY = (vol: number) =>
  ((Math.min(Math.max(vol, SCENE.volMin), SCENE.volMax) - SCENE.volMin) / (SCENE.volMax - SCENE.volMin)) * H;

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
 * Smallest camera distance at which every fit point stays inside the frame (with `margin` as a fraction of the
 * half-frame) from every reachable azimuth and polar angle, for a perspective camera of the given vertical fov
 * and aspect. The surface therefore never clips, however it is rotated within the allowed arc.
 */
export function fitDistance(aspect: number, fovDeg = CAMERA.fov, margin = 0.98): number {
  const tanV = Math.tan(((fovDeg / 2) * Math.PI) / 180) * margin;
  const tanH = tanV * aspect;
  const views: { forward: Vec3; right: Vec3; up: Vec3 }[] = [];
  for (let a = 0; a <= 24; a++) {
    const azimuth = CAMERA.minAzimuth + ((CAMERA.maxAzimuth - CAMERA.minAzimuth) * a) / 24;
    for (const polar of [CAMERA.minPolar, CAMERA.polar, CAMERA.maxPolar]) views.push(viewBasis(azimuth, polar));
  }
  const fits = (d: number) =>
    views.every(({ forward, right, up }) =>
      FIT_POINTS.every((p) => {
        const rel = sub(p, CAMERA.target);
        const depth = d + dot(rel, forward);
        return depth > 0.1 && Math.abs(dot(rel, right)) <= depth * tanH && Math.abs(dot(rel, up)) <= depth * tanV;
      }),
    );
  let lo = 1;
  let hi = 40;
  for (let i = 0; i < 30; i++) {
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
