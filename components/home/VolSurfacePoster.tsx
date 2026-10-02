import { NK, NT, SCENE, WIRE_STEP, project, toX, toY, toZ } from "@/components/home/volSurfaceScene";
import { MARKET_REGIMES, surfaceGrid, type VolParams } from "@/lib/vol-surface";

type Pt = [number, number];

const corners: Pt[] = [
  [-SCENE.halfX, -SCENE.halfZ],
  [SCENE.halfX, -SCENE.halfZ],
  [SCENE.halfX, SCENE.halfZ],
  [-SCENE.halfX, SCENE.halfZ],
].map(([x, z]) => project([x, 0, z]));

// Fixed frame around the floor and the tallest possible surface, so the poster never reflows.
const frame = [...corners, ...corners.map(([sx, sy]) => [sx, sy - SCENE.height] as Pt)];
const pad = 0.15;
const minX = Math.min(...frame.map((p) => p[0])) - pad;
const minY = Math.min(...frame.map((p) => p[1])) - pad;
const width = Math.max(...frame.map((p) => p[0])) - minX + pad;
const height = Math.max(...frame.map((p) => p[1])) - minY + pad;

const toPath = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(3)} ${y.toFixed(3)}`).join(" ");

/**
 * Static wireframe of the volatility surface from the default camera. Shown before the WebGL
 * figure loads and as its fallback, so the hero never shifts and still makes sense without WebGL.
 */
export function VolSurfacePoster({ params = MARKET_REGIMES[0].params }: { params?: VolParams }) {
  const { values } = surfaceGrid(params, NK, NT);
  const point = (ik: number, iT: number) => project([toX(ik), toY(values[iT * NK + ik]), toZ(iT)]);

  const lines: string[] = [];
  for (let iT = 0; iT < NT; iT += WIRE_STEP) lines.push(toPath(Array.from({ length: NK }, (_, ik) => point(ik, iT))));
  for (let ik = 0; ik < NK; ik += WIRE_STEP) lines.push(toPath(Array.from({ length: NT }, (_, iT) => point(ik, iT))));

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full"
    >
      <path d={`${toPath(corners)} Z`} fill="none" className="stroke-rule-strong" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" className="stroke-navy" strokeOpacity="0.55" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
