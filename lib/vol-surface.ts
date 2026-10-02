import { mulberry32 } from "@/lib/random-walk";

/** Parameters of the stylised implied-volatility surface on the Home hero (spec 01 §3.1). */
export type VolParams = {
  /** At-the-money implied vol at T = 1 year, e.g. 0.24 for 24%. */
  atmVol: number;
  /** Smile asymmetry ρ; negative tilts the left wing up (equity-style smirk). */
  skew: number;
  /** ATM vol change per year of maturity, relative to `atmVol` (negative = inverted term structure). */
  termSlope: number;
  /** Smile curvature η; higher means steeper wings. */
  curvature: number;
};

export const RANGES = {
  atmVol: [0.1, 0.6],
  skew: [-0.9, 0.3],
  termSlope: [-0.4, 0.4],
  curvature: [0.5, 1.6],
} as const satisfies Record<keyof VolParams, readonly [number, number]>;

/** Log-moneyness k = ln(K/S) and maturity T (years) covered by the surface. */
export const DOMAIN = { k: [-0.5, 0.5], T: [0.1, 2] } as const;

export const DEFAULT_PARAMS: VolParams = { atmVol: 0.24, skew: -0.6, termSlope: 0.15, curvature: 1.2 };

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/** Keeps every parameter inside its range, so the surface stays positive and well-behaved. */
export function clampParams(p: VolParams): VolParams {
  return {
    atmVol: clamp(p.atmVol, RANGES.atmVol),
    skew: clamp(p.skew, RANGES.skew),
    termSlope: clamp(p.termSlope, RANGES.termSlope),
    curvature: clamp(p.curvature, RANGES.curvature),
  };
}

/** ATM implied vol at maturity T, floored so the term structure never goes non-positive. */
function atmVolAt(T: number, p: VolParams): number {
  return Math.max(0.03, p.atmVol * (1 + p.termSlope * (T - 1)));
}

/**
 * SSVI-style implied vol: total variance
 *   w(k, T) = θ/2 · [1 + ρφk + √((φk + ρ)² + 1 − ρ²)],  θ = σ_atm(T)² · T,  φ = η / √θ,
 * and σ = √(w / T). At k = 0 this returns exactly σ_atm(T).
 */
export function impliedVol(k: number, T: number, p: VolParams): number {
  const atm = atmVolAt(T, p);
  const theta = atm * atm * T;
  const phi = p.curvature / Math.sqrt(theta);
  const rho = p.skew;
  const w = (theta / 2) * (1 + rho * phi * k + Math.sqrt((phi * k + rho) ** 2 + 1 - rho * rho));
  return Math.sqrt(w / T);
}

export type SurfaceGrid = {
  nk: number;
  nT: number;
  /** Row-major by maturity: `values[iT * nk + ik]`. */
  values: Float32Array;
  min: number;
  max: number;
};

/** Grid coordinates for column `ik` / row `iT`. */
export const kAt = (ik: number, nk: number) => DOMAIN.k[0] + ((DOMAIN.k[1] - DOMAIN.k[0]) * ik) / (nk - 1);
export const tAt = (iT: number, nT: number) => DOMAIN.T[0] + ((DOMAIN.T[1] - DOMAIN.T[0]) * iT) / (nT - 1);

/** Implied vols sampled on an nk × nT grid over DOMAIN. Writes into `out` when given (no allocation). */
export function surfaceGrid(p: VolParams, nk: number, nT: number, out?: Float32Array): SurfaceGrid {
  const values = out ?? new Float32Array(nk * nT);
  let min = Infinity;
  let max = -Infinity;
  for (let iT = 0; iT < nT; iT++) {
    const T = tAt(iT, nT);
    for (let ik = 0; ik < nk; ik++) {
      const v = impliedVol(kAt(ik, nk), T, p);
      values[iT * nk + ik] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { nk, nT, values, min, max };
}

const lerp = ([lo, hi]: readonly [number, number], t: number) => lo + (hi - lo) * t;

/** A deterministic "market regime" for a seed. */
export function randomParams(seed: number): VolParams {
  const rand = mulberry32(seed);
  return clampParams({
    atmVol: lerp([0.14, 0.45], rand()),
    skew: lerp([-0.85, 0.1], rand()),
    termSlope: lerp([-0.3, 0.3], rand()),
    curvature: lerp([0.7, 1.5], rand()),
  });
}

function gaussian(rand: () => number): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * One "market tick": ATM vol and skew follow Ornstein–Uhlenbeck processes that mean-revert to
 * `anchor` (the regime the user set), so the surface breathes without drifting away.
 */
export function stepParams(p: VolParams, anchor: VolParams, dt: number, rand: () => number): VolParams {
  const ou = (x: number, mu: number, kappa: number, sigma: number) =>
    x + kappa * (mu - x) * dt + sigma * Math.sqrt(dt) * gaussian(rand);
  return clampParams({
    atmVol: ou(p.atmVol, anchor.atmVol, 1.5, 0.12),
    skew: ou(p.skew, anchor.skew, 1.2, 0.35),
    termSlope: ou(p.termSlope, anchor.termSlope, 1, 0.15),
    curvature: p.curvature,
  });
}

/** Short plain-language summary, used as the figure's accessible name. */
export function describeSurface(p: VolParams): string {
  const term = p.termSlope > 0.05 ? "upward-sloping" : p.termSlope < -0.05 ? "inverted" : "flat";
  return `Implied volatility surface: ATM vol ${Math.round(p.atmVol * 100)}%, skew ${p.skew.toFixed(2)}, ${term} term structure.`;
}
