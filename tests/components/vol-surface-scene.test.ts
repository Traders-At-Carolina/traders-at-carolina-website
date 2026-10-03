import { describe, expect, it } from "vitest";
import { CAMERA, SCENE, TICKS, cameraDirection, toY, viewBasis, xFromMoneyness, zFromMaturity } from "@/components/home/volSurfaceScene";

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

describe("axis mapping", () => {
  it("puts K/S 1.0 at the centre column, where the ATM line runs, and short maturities at the front", () => {
    expect(xFromMoneyness(1)).toBeCloseTo(0);
    expect(zFromMaturity(2)).toBeCloseTo(-SCENE.halfZ);
    expect(zFromMaturity(0.1)).toBeCloseTo(SCENE.halfZ);
  });

  it("keeps every tick on its axis", () => {
    for (const m of TICKS.strike) expect(Math.abs(xFromMoneyness(m))).toBeLessThanOrEqual(SCENE.halfX);
    for (const T of TICKS.maturity) expect(Math.abs(zFromMaturity(T))).toBeLessThanOrEqual(SCENE.halfZ);
    for (const v of TICKS.vol) expect(toY(v)).toBeLessThanOrEqual(SCENE.height);
  });

  it("sits the surface on its floor and caps it at the top of the box", () => {
    expect(toY(0.05)).toBe(0);
    expect(toY(SCENE.volMax)).toBeCloseTo(SCENE.height);
    expect(toY(1.2)).toBeCloseTo(SCENE.height);
  });
});

describe("viewBasis", () => {
  it("is an orthonormal screen frame looking from the camera toward the target", () => {
    for (const [azimuth, polar] of [
      [CAMERA.azimuth, CAMERA.polar],
      [2.5, CAMERA.minPolar],
      [-1, CAMERA.maxPolar],
    ]) {
      const { right, up, forward } = viewBasis(azimuth, polar);
      for (const v of [right, up, forward]) expect(Math.hypot(...v)).toBeCloseTo(1);
      expect(dot(right, up)).toBeCloseTo(0);
      expect(dot(right, forward)).toBeCloseTo(0);
      expect(dot(up, forward)).toBeCloseTo(0);
      expect(dot(forward, cameraDirection(azimuth, polar))).toBeCloseTo(-1);
      // Screen "up" always leans toward world up (y) for a camera above the horizon.
      if (polar < Math.PI / 2) expect(up[1]).toBeGreaterThan(0);
    }
  });
});
