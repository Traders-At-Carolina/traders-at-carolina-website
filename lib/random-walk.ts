export type Point = [x: number, y: number];

/** Box, origin and step size shared by the walks and their overlays. */
export type WalkGeometry = {
  steps: number;
  width: number;
  height: number;
  /** Origin height as a fraction of `height` (default 0.6). */
  originRatio?: number;
  /** Per-step standard deviation as a fraction of `height` (default 0.055). */
  sigmaRatio?: number;
};

export type WalkOptions = WalkGeometry & {
  seed: number;
  paths: number;
};

/** Small, fast seeded PRNG. Same seed → same sequence, so the art is stable across builds. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box–Muller. */
function gaussian(rand: () => number): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const round = (n: number) => Math.round(n * 10) / 10;

function geometry({ height, originRatio = 0.6, sigmaRatio = 0.055 }: WalkGeometry) {
  return {
    top: height * 0.06,
    bottom: height * 0.94,
    originY: round(height * originRatio),
    sigma: height * sigmaRatio,
  };
}

/** Brownian paths from a shared origin, reflected to stay inside the box. */
export function generateWalkPoints({ seed, paths, ...box }: WalkOptions): Point[][] {
  const rand = mulberry32(seed);
  const { top, bottom, originY, sigma } = geometry(box);
  const origin: Point = [0, originY];
  const dx = box.width / box.steps;

  return Array.from({ length: paths }, () => {
    const points: Point[] = [origin];
    let y = origin[1];
    for (let i = 1; i <= box.steps; i++) {
      y += gaussian(rand) * sigma;
      if (y < top) y = top + (top - y);
      if (y > bottom) y = bottom - (y - bottom);
      y = Math.min(bottom, Math.max(top, y));
      points.push([round(i * dx), round(y)]);
    }
    return points;
  });
}

/** SVG path `d` string for one walk. */
export function toPathData(points: Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

/** SVG path `d` strings for each walk. */
export function generateWalks(opts: WalkOptions): string[] {
  return generateWalkPoints(opts).map(toPathData);
}

/** Closed SVG path for the band origin ± k·σ·√t, clamped to the box. */
export function envelopePath({ k = 1, ...box }: WalkGeometry & { k?: number }): string {
  const { originY, sigma } = geometry(box);
  const dx = box.width / box.steps;
  const upper: Point[] = [];
  const lower: Point[] = [];
  for (let i = 0; i <= box.steps; i++) {
    const spread = k * sigma * Math.sqrt(i);
    upper.push([round(i * dx), round(Math.max(0, originY - spread))]);
    lower.push([round(i * dx), round(Math.min(box.height, originY + spread))]);
  }
  return `${toPathData([...upper, ...lower.reverse()])} Z`;
}

/** A walk's height in units of the per-step σ, positive above the origin. */
export function standardizedValue(y: number, box: WalkGeometry): number {
  const { originY, sigma } = geometry(box);
  return (originY - y) / sigma;
}
