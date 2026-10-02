import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { AXIS_LABELS, CAMERA, SCENE, VIEWS, cameraDirection, fitDistance, viewForChange } from "@/components/home/volSurfaceScene";
import { MARKET_REGIMES } from "@/lib/vol-surface";

const { halfX: X, halfZ: Z, height: H } = SCENE;
const points = [
  ...[-X, X].flatMap((x) => [0, H].flatMap((y) => [-Z, Z].map((z) => new THREE.Vector3(x, y, z)))),
  ...AXIS_LABELS.map(({ at }) => new THREE.Vector3(...at)),
];

/** Projects every fit point through a real three.js camera and returns the largest |NDC| coordinate. */
function maxNdc(aspect: number, azimuth: number, polar: number) {
  const distance = fitDistance(aspect);
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.1, 100);
  const target = new THREE.Vector3(...CAMERA.target);
  camera.position.copy(target).add(new THREE.Vector3(...cameraDirection(azimuth, polar)).multiplyScalar(distance));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return Math.max(...points.map((p) => p.clone().project(camera)).flatMap((v) => [Math.abs(v.x), Math.abs(v.y)]));
}

describe("fitDistance", () => {
  it("keeps the whole box and its axis titles inside the frame from every reachable angle", () => {
    for (const aspect of [0.9, 1.4, 1.8]) {
      for (let a = 0; a <= 40; a++) {
        const azimuth = CAMERA.minAzimuth + ((CAMERA.maxAzimuth - CAMERA.minAzimuth) * a) / 40;
        for (const polar of [CAMERA.minPolar, (CAMERA.minPolar + CAMERA.polar) / 2, CAMERA.polar, CAMERA.maxPolar]) {
          expect(maxNdc(aspect, azimuth, polar)).toBeLessThanOrEqual(0.99);
        }
      }
    }
  });

  it("pulls back for narrower canvases", () => {
    expect(fitDistance(0.9)).toBeGreaterThan(fitDistance(1.6));
  });
});

describe("viewForChange", () => {
  const base = MARKET_REGIMES[0].params;

  it("faces the strike axis when the skew changes most", () => {
    expect(viewForChange(base, { ...base, skew: base.skew + 0.6 })).toBe(VIEWS.skew);
  });

  it("faces the maturity axis when the term structure changes most", () => {
    expect(viewForChange(base, { ...base, termSlope: base.termSlope - 0.5 })).toBe(VIEWS.term);
  });

  it("uses the three-quarter view when the overall level changes most", () => {
    expect(viewForChange(base, { ...base, atmVol: base.atmVol + 0.3 })).toBe(VIEWS.level);
  });

  it("keeps every planned view (plus its sway) inside the reachable front arc", () => {
    MARKET_REGIMES.forEach(({ params }, i) => {
      const view = viewForChange(params, MARKET_REGIMES[(i + 1) % MARKET_REGIMES.length].params);
      expect(view - 0.1).toBeGreaterThanOrEqual(CAMERA.minAzimuth);
      expect(view + 0.1).toBeLessThanOrEqual(CAMERA.maxAzimuth);
    });
  });
});
