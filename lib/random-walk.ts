export type Point = [x: number, y: number];

export type WalkOptions = {
  seed: number;
  paths: number;
  steps: number;
  width: number;
  height: number;
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

/** Brownian paths from a shared origin, reflected to stay inside the box. */
export function generateWalkPoints({ seed, paths, steps, width, height }: WalkOptions): Point[][] {
  const rand = mulberry32(seed);
  const top = height * 0.06;
  const bottom = height * 0.94;
  const origin: Point = [0, round(height * 0.6)];
  const dx = width / steps;
  const sigma = height * 0.055;

  return Array.from({ length: paths }, () => {
    const points: Point[] = [origin];
    let y = origin[1];
    for (let i = 1; i <= steps; i++) {
      y += gaussian(rand) * sigma;
      if (y < top) y = top + (top - y);
      if (y > bottom) y = bottom - (y - bottom);
      y = Math.min(bottom, Math.max(top, y));
      points.push([round(i * dx), round(y)]);
    }
    return points;
  });
}

/** SVG path `d` strings for each walk. */
export function generateWalks(opts: WalkOptions): string[] {
  return generateWalkPoints(opts).map((points) =>
    points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" "),
  );
}
