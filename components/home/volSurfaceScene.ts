import { DOMAIN } from "@/lib/vol-surface";

/** Grid resolution of the hero's volatility surface (strike columns × maturity rows). */
export const NK = 61;
export const NT = 41;
/** Wire-grid spacing in grid steps: every 4th column and row is drawn as a line. */
export const WIRE_STEP = 4;

/** Scene box: strikes run along x, maturities along z (short dates in front), implied vol up y. */
export const SCENE = { halfX: 1.6, halfZ: 1.2, height: 1.6, volMax: 0.8 } as const;

export const CAMERA = { position: [2.9, 2.2, 3.7] as [number, number, number], target: [0, 0.45, 0] as [number, number, number], fov: 38 };

export const toX = (ik: number) => -SCENE.halfX + (2 * SCENE.halfX * ik) / (NK - 1);
export const toZ = (iT: number) => SCENE.halfZ - (2 * SCENE.halfZ * iT) / (NT - 1);
export const toY = (vol: number) => (Math.min(vol, SCENE.volMax) / SCENE.volMax) * SCENE.height;

/** Inverse of toX / toZ in model units: log-moneyness k and maturity T. */
export const kFromX = (x: number) => DOMAIN.k[0] + ((x + SCENE.halfX) / (2 * SCENE.halfX)) * (DOMAIN.k[1] - DOMAIN.k[0]);
export const tFromZ = (z: number) => DOMAIN.T[0] + ((SCENE.halfZ - z) / (2 * SCENE.halfZ)) * (DOMAIN.T[1] - DOMAIN.T[0]);

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const forward = norm(sub(CAMERA.target, CAMERA.position));
const right = norm(cross(forward, [0, 1, 0]));
const up = cross(right, forward);

/** Orthographic projection along the default camera direction, for the static SVG poster. */
export function project(p: Vec3): [number, number] {
  const d = sub(p, CAMERA.target);
  return [dot(d, right), -dot(d, up)];
}
