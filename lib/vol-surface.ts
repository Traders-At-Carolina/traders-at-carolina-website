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

/** Sensible bounds for each parameter; every regime stays inside them. */
export const RANGES = {
  atmVol: [0.1, 0.6],
  skew: [-0.9, 0.3],
  termSlope: [-0.4, 0.4],
  curvature: [0.5, 1.6],
} as const satisfies Record<keyof VolParams, readonly [number, number]>;

/** Log-moneyness k = ln(K/S) and maturity T (years) covered by the surface. */
export const DOMAIN = { k: [-0.5, 0.5], T: [0.1, 2] } as const;

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

/** A named market the hero cycles through (spec 01 §3.1). */
export type MarketRegime = { name: string; note: string; params: VolParams };

export const MARKET_REGIMES: readonly MarketRegime[] = [
  { name: "Calm market", note: "low vol, gentle smirk, upward term structure", params: { atmVol: 0.16, skew: -0.55, termSlope: 0.2, curvature: 1 } },
  { name: "Sell-off", note: "vol spikes, steep downside skew, inverted term structure", params: { atmVol: 0.42, skew: -0.85, termSlope: -0.3, curvature: 1.4 } },
  { name: "Recovery", note: "vol settles, skew eases, curve normalises", params: { atmVol: 0.26, skew: -0.6, termSlope: 0.1, curvature: 1.2 } },
  { name: "Event risk", note: "short-dated vol bid ahead of earnings", params: { atmVol: 0.3, skew: -0.35, termSlope: -0.25, curvature: 1.5 } },
  { name: "Speculative rally", note: "call skew as upside demand builds", params: { atmVol: 0.38, skew: 0.15, termSlope: -0.1, curvature: 1.1 } },
  { name: "Quiet carry", note: "near-symmetric smile, steep term structure", params: { atmVol: 0.2, skew: -0.1, termSlope: 0.3, curvature: 0.8 } },
];

/** Linear blend of two parameter sets, t ∈ [0, 1]. */
export function lerpParams(a: VolParams, b: VolParams, t: number): VolParams {
  // a·(1 − t) + b·t lands exactly on each end, so the surface settles precisely on a regime.
  const mix = (x: number, y: number) => x * (1 - t) + y * t;
  return {
    atmVol: mix(a.atmVol, b.atmVol),
    skew: mix(a.skew, b.skew),
    termSlope: mix(a.termSlope, b.termSlope),
    curvature: mix(a.curvature, b.curvature),
  };
}

/** Cubic ease-in-out, so regime changes start and settle gently. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** Short plain-language summary, used as the figure's accessible name. */
export function describeSurface(p: VolParams): string {
  const term = p.termSlope > 0.05 ? "upward-sloping" : p.termSlope < -0.05 ? "inverted" : "flat";
  return `Implied volatility surface: ATM vol ${Math.round(p.atmVol * 100)}%, skew ${p.skew.toFixed(2)}, ${term} term structure.`;
}
