import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { AXIS_LABELS, CAMERA, SCENE, cameraDirection, fitDistance, kFromX, tFromZ, xFromMoneyness, zFromMaturity } from "@/components/home/volSurfaceScene";

const { halfX: X, halfZ: Z, height: H } = SCENE;
const points = [
  ...[-X, X].flatMap((x) => [0, H].flatMap((y) => [-Z, Z].map((z) => new THREE.Vector3(x, y, z)))),
  ...AXIS_LABELS.map(({ at }) => new THREE.Vector3(...at)),
];

/** Projects every fit point through a real three.js camera and returns the largest |NDC| coordinate. */
function maxNdc(aspect: number, azimuth: number, polar: number) {
  const distance = fitDistance(aspect, azimuth, polar);
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.1, 100);
  const target = new THREE.Vector3(...CAMERA.target);
  camera.position.copy(target).add(new THREE.Vector3(...cameraDirection(azimuth, polar)).multiplyScalar(distance));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return Math.max(...points.map((p) => p.clone().project(camera)).flatMap((v) => [Math.abs(v.x), Math.abs(v.y)]));
}

describe("fitDistance", () => {
  it("keeps the whole box and its axis titles inside the frame from any angle, including over and under", () => {
    for (const aspect of [0.9, 1.4, 1.8]) {
      for (let a = 0; a < 36; a++) {
        for (const polar of [CAMERA.minPolar, 0.6, CAMERA.polar, 1.8, 2.6, CAMERA.maxPolar]) {
          expect(maxNdc(aspect, (a / 36) * 2 * Math.PI, polar)).toBeLessThanOrEqual(0.97);
        }
      }
    }
  });

  it("frames as tightly as each view allows", () => {
    for (const azimuth of [0.3, 0.72, 1.15]) {
      expect(maxNdc(1.3, azimuth, CAMERA.polar)).toBeGreaterThan(0.9);
    }
  });

  it("pulls back for narrower canvases", () => {
    expect(fitDistance(0.9, CAMERA.azimuth, CAMERA.polar)).toBeGreaterThan(fitDistance(1.6, CAMERA.azimuth, CAMERA.polar));
  });
});

describe("axis ticks", () => {
  it("puts K/S 1.0 at the centre column, where the ATM line runs, and maturities along the right edge", () => {
    expect(xFromMoneyness(1)).toBeCloseTo(0);
    expect(zFromMaturity(2)).toBeCloseTo(-SCENE.halfZ);
    expect(zFromMaturity(0.1)).toBeCloseTo(SCENE.halfZ);
  });

  it("labels every tick and the three axes", () => {
    const texts = AXIS_LABELS.map((l) => l.text);
    expect(texts).toEqual(expect.arrayContaining(["1.0 ATM", "6M", "2Y", "20%", "60%", "Strike K/S", "Maturity", "Implied vol"]));
  });
});

describe("hover mapping", () => {
  it("inverts the axis mapping, so hovered points read back the same strike and maturity as the ticks", () => {
    for (const m of [0.8, 1, 1.25]) expect(Math.exp(kFromX(xFromMoneyness(m)))).toBeCloseTo(m, 6);
    for (const T of [0.5, 1, 1.5, 2]) expect(tFromZ(zFromMaturity(T))).toBeCloseTo(T, 6);
  });

  it("clamps points just outside the surface edge onto it", () => {
    expect(tFromZ(SCENE.halfZ + 0.2)).toBeCloseTo(0.1);
    expect(Math.exp(kFromX(-SCENE.halfX - 0.2))).toBeCloseTo(Math.exp(-0.5));
  });
});
