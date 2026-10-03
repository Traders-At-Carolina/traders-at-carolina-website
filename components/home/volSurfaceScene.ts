import { DOMAIN } from "@/lib/vol-surface";

/** Scene geometry and camera for the hero's volatility surface (spec 01 §3.1). No DOM; drawn by bitSurfaceScene.ts. */

/** Grid resolution of the hero's volatility surface (strike columns × maturity rows). */
export const NK = 61;
export const NT = 41;
/** Wire-grid spacing in grid steps: every 10th row and column is drawn as a line of bits (7 strikes × 5 maturities). */
export const WIRE_STEP = 10;

/** Scene box: strikes run along x, maturities along z (short dates in front), implied vol up y. */
export const SCENE = { halfX: 1.6, halfZ: 1.2, height: 1.3, volMin: 0.1, volMax: 0.8 } as const;
const { halfX: X, halfZ: Z, height: H } = SCENE;

export type Vec3 = [number, number, number];

/** Scene height for an implied vol: the axis runs from 10% to 80%, so the surface sits on its axes. */
export function toY(vol: number) {
  return ((Math.min(Math.max(vol, SCENE.volMin), SCENE.volMax) - SCENE.volMin) / (SCENE.volMax - SCENE.volMin)) * SCENE.height;
}

/** Scene x for a strike given as K/S, and scene z for a maturity in years. */
export const xFromMoneyness = (m: number) => -X + ((Math.log(m) - DOMAIN.k[0]) / (DOMAIN.k[1] - DOMAIN.k[0])) * 2 * X;
export const zFromMaturity = (T: number) => Z - ((T - DOMAIN.T[0]) / (DOMAIN.T[1] - DOMAIN.T[0])) * 2 * Z;

/**
 * Tick positions on each axis, drawn as single-bit marks (no text). The axes meet at the front-right corner, the
 * corner nearest the camera in the default view. K/S 1.0 is the at-the-money strike, where the bold ATM line runs.
 */
export const TICKS = {
  strike: [0.8, 1, 1.25],
  maturity: [0.5, 1, 1.5, 2],
  vol: [0.2, 0.4, 0.6],
} as const;

/**
 * Camera on a sphere around the box centre. Azimuth 0 looks straight down the maturity axis (strike runs across
 * the screen); π/2 looks along the strike axis (maturity runs across). Polar is measured from straight up.
 */
export const CAMERA = {
  target: [0, H / 2, 0] as Vec3,
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

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Unit vector from the target toward a camera at (azimuth, polar), matching OrbitControls' convention. */
export function cameraDirection(azimuth: number, polar: number): Vec3 {
  return [Math.sin(polar) * Math.sin(azimuth), Math.cos(polar), Math.sin(polar) * Math.cos(azimuth)];
}

/** Screen axes for a camera at (azimuth, polar): `right` and `up` span the screen, `forward` points into it. */
export function viewBasis(azimuth: number, polar: number) {
  const back = cameraDirection(azimuth, polar);
  const forward: Vec3 = [-back[0], -back[1], -back[2]];
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { forward, right, up };
}
