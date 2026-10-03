import { describe, expect, it } from "vitest";
import {
  ALPHA,
  AXIS_LABELS,
  KIND,
  bitCell,
  cellLook,
  createRaster,
  fitScale,
  initialCamera,
  labelOpacity,
  labelPosition,
  makeView,
  projectPoint,
  rasterize,
  scrambleAlpha,
  stepCamera,
} from "@/components/home/bitSurfaceScene";
import { CAMERA, NK, NT, SCENE, type Vec3 } from "@/components/home/volSurfaceScene";
import { MARKET_REGIMES, surfaceGrid } from "@/lib/vol-surface";

const { halfX: X, halfZ: Z, height: H } = SCENE;
const corners: Vec3[] = [-X, X].flatMap((x) => [0, H].flatMap((y) => [-Z, Z].map((z): Vec3 => [x, y, z])));
const calm = surfaceGrid(MARKET_REGIMES[0].params, NK, NT).values;
const selloff = surfaceGrid(MARKET_REGIMES[1].params, NK, NT).values;

/** Rasterizes a surface at a fitted view and returns the raster. */
function draw(values: Float32Array, azimuth: number, polar: number, cols = 72, rows = 70) {
  const view = makeView(azimuth, polar, fitScale(cols, rows, azimuth, polar), cols, rows);
  return { raster: rasterize(values, view, createRaster(cols, rows)), view };
}

const count = (kinds: Uint8Array, k: number) => kinds.reduce((n, v) => n + (v === k ? 1 : 0), 0);

describe("fitScale", () => {
  it("keeps the whole box inside the grid from any angle, including over the top and underneath", () => {
    for (const [cols, rows] of [
      [72, 70],
      [90, 50],
      [56, 50],
    ]) {
      for (let a = 0; a < 36; a++) {
        for (const polar of [CAMERA.minPolar, 0.6, CAMERA.polar, 1.8, 2.6, CAMERA.maxPolar]) {
          const azimuth = (a / 36) * 2 * Math.PI;
          const view = makeView(azimuth, polar, fitScale(cols, rows, azimuth, polar), cols, rows);
          for (const p of corners) {
            const [c, r] = projectPoint(view, p);
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThanOrEqual(cols);
            expect(r).toBeGreaterThanOrEqual(0);
            expect(r).toBeLessThanOrEqual(rows);
          }
        }
      }
    }
  });

  it("frames as tightly as each view allows", () => {
    for (const azimuth of [0.3, CAMERA.azimuth, 1.15]) {
      const view = makeView(azimuth, CAMERA.polar, fitScale(72, 70, azimuth, CAMERA.polar), 72, 70);
      const reach = Math.max(...corners.map((p) => projectPoint(view, p)).flatMap(([c, r]) => [Math.abs(c - 36) / 36, Math.abs(r - 35) / 35]));
      expect(reach).toBeGreaterThan(0.8);
    }
  });

  it("shrinks the surface for a narrower figure", () => {
    expect(fitScale(50, 70, CAMERA.azimuth, CAMERA.polar)).toBeLessThan(fitScale(90, 70, CAMERA.azimuth, CAMERA.polar));
  });
});

describe("rasterize", () => {
  it("draws the surface, its wire grid, the ATM line and the axes in the default view", () => {
    const { raster } = draw(calm, CAMERA.azimuth, CAMERA.polar);
    expect(count(raster.kind, KIND.fill)).toBeGreaterThan(500);
    expect(count(raster.kind, KIND.wire)).toBeGreaterThan(100);
    expect(count(raster.kind, KIND.atm)).toBeGreaterThan(10);
    expect(count(raster.kind, KIND.axis)).toBeGreaterThan(20);
  });

  it("only covers cells inside the projected surface and its axes", () => {
    const { raster, view } = draw(calm, CAMERA.azimuth, CAMERA.polar);
    const pts = corners.map((p) => projectPoint(view, p));
    const [c0, c1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
    const [r0, r1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
    for (let i = 0; i < raster.kind.length; i++) {
      if (raster.kind[i] === KIND.empty) continue;
      const col = i % raster.cols;
      const row = Math.floor(i / raster.cols);
      // Tick marks stick out a little past the box.
      expect(col).toBeGreaterThanOrEqual(Math.floor(c0) - 1);
      expect(col).toBeLessThanOrEqual(Math.ceil(c1) + 2);
      expect(row).toBeGreaterThanOrEqual(Math.floor(r0) - 1);
      expect(row).toBeLessThanOrEqual(Math.ceil(r1) + 2);
    }
  });

  it("runs the ATM line down the middle column when seen from straight above", () => {
    const { raster } = draw(calm, 0, CAMERA.minPolar);
    const atmCols = new Set<number>();
    raster.kind.forEach((k, i) => k === KIND.atm && atmCols.add(i % raster.cols));
    expect(atmCols.size).toBeGreaterThan(0);
    for (const col of atmCols) expect(Math.abs(col + 0.5 - raster.cols / 2)).toBeLessThanOrEqual(1.5);
  });

  it("shows the top from above and the underside from below", () => {
    const fills = (r: ReturnType<typeof draw>["raster"]) => Array.from(r.kind.keys()).filter((i) => r.kind[i] === KIND.fill);
    const above = draw(calm, CAMERA.azimuth, 0.4).raster;
    const below = draw(calm, CAMERA.azimuth, Math.PI - 0.4).raster;
    expect(fills(above).every((i) => above.under[i] === 0)).toBe(true);
    expect(fills(below).every((i) => below.under[i] === 1)).toBe(true);
  });

  it("hides the axes behind the surface when the view swings round to the back", () => {
    const front = count(draw(selloff, CAMERA.azimuth, 1.35).raster.kind, KIND.axis);
    const back = count(draw(selloff, CAMERA.azimuth + Math.PI, 1.35).raster.kind, KIND.axis);
    expect(back).toBeLessThan(front * 0.6);
  });

  it("is reusable: a second frame into the same buffers leaves nothing from the first", () => {
    const cols = 72;
    const rows = 70;
    const raster = createRaster(cols, rows);
    const view = (az: number) => makeView(az, CAMERA.polar, fitScale(cols, rows, az, CAMERA.polar), cols, rows);
    rasterize(selloff, view(0.3), raster);
    const fresh = rasterize(calm, view(2), createRaster(cols, rows));
    rasterize(calm, view(2), raster);
    expect(Array.from(raster.kind)).toEqual(Array.from(fresh.kind));
  });
});

describe("cellLook", () => {
  it("ranks the ATM line over the wire grid, the axes and the fill, and leaves empty cells blank", () => {
    const fillMax = cellLook(KIND.fill, 0.9, false);
    expect(cellLook(KIND.atm, 0.2, false)).toBeGreaterThan(cellLook(KIND.wire, 0.2, false));
    expect(cellLook(KIND.wire, 0.2, false)).toBeGreaterThan(cellLook(KIND.axis, 0.2, false));
    expect(cellLook(KIND.axis, 0.2, false)).toBeGreaterThan(fillMax);
    expect(cellLook(KIND.empty, 0.2, false)).toBe(0);
  });

  it("draws higher implied vol denser, and the underside dimmer", () => {
    expect(cellLook(KIND.fill, 0.45, false)).toBeGreaterThan(cellLook(KIND.fill, 0.15, false));
    expect(cellLook(KIND.fill, 0.3, true)).toBeLessThan(cellLook(KIND.fill, 0.3, false));
    expect(cellLook(KIND.wire, 0.3, true)).toBeLessThan(cellLook(KIND.wire, 0.3, false));
  });
});

describe("bitCell", () => {
  const base = { col: 30, row: 30, cols: 64, rows: 64, kind: KIND.fill, vol: 0.3, under: false, time: 0, settle: 1, heat: 0, shimmer: false };

  it("flickers every cell in the scramble cloud before it settles, fading toward the figure's edges", () => {
    const empty = { ...base, kind: KIND.empty, settle: 0 };
    expect(bitCell(empty).alpha).toBeCloseTo(ALPHA.scrambled, 1);
    expect(bitCell({ ...empty, col: 0, row: 0 }).alpha).toBe(0);
    expect(scrambleAlpha(0, 0, 64, 64)).toBe(0);
    const glyphs = new Set(Array.from({ length: 40 }, (_, i) => bitCell({ ...empty, time: i * 37 }).glyph));
    expect(glyphs.size).toBe(2);
  });

  it("resolves into the surface: empty cells fade out and surface cells take their resting look", () => {
    expect(bitCell({ ...base, kind: KIND.empty }).alpha).toBe(0);
    expect(bitCell(base).alpha).toBeCloseTo(cellLook(KIND.fill, 0.3, false));
    expect(bitCell({ ...base, kind: KIND.atm }).alpha).toBe(1);
  });

  it("holds formed bits still without shimmer, and glitches only surface bits with it", () => {
    const times = Array.from({ length: 300 }, (_, i) => i * 110);
    const still = new Set(times.map((time) => bitCell({ ...base, time }).glyph));
    expect(still.size).toBe(1);
    const glitchy = times.map((time) => bitCell({ ...base, time, shimmer: true }));
    expect(new Set(glitchy.map((c) => c.glyph)).size).toBe(2);
    expect(glitchy.some((c) => c.alpha < cellLook(KIND.fill, 0.3, false))).toBe(true);
    expect(times.every((time) => bitCell({ ...base, kind: KIND.empty, time, shimmer: true }).alpha === 0)).toBe(true);
  });

  it("lights surface bits under the pointer as full-strength 1s, and ignores empty cells", () => {
    expect(bitCell({ ...base, heat: 1 })).toEqual({ glyph: "1", alpha: 1, lit: 1 });
    expect(bitCell({ ...base, kind: KIND.empty, heat: 1 }).lit).toBe(0);
    expect(bitCell({ ...base, heat: 1, settle: 0 }).lit).toBe(0);
  });
});

describe("stepCamera", () => {
  it("eases up to the idle spin rate, turning clockwise seen from above", () => {
    const cam = initialCamera();
    for (let i = 0; i < 300; i++) stepCamera(cam, 1 / 60, true);
    expect(cam.va).toBeGreaterThan(CAMERA.spin * 0.95);
    expect(cam.azimuth).toBeGreaterThan(CAMERA.azimuth);
    expect(Math.abs(cam.polar - CAMERA.polar)).toBeLessThan(0.06);
  });

  it("stops dead when the spin is off", () => {
    const cam = initialCamera();
    for (let i = 0; i < 60; i++) stepCamera(cam, 1 / 60, true);
    const { azimuth } = cam;
    stepCamera(cam, 1 / 60, false);
    stepCamera(cam, 1 / 60, false);
    expect(cam.azimuth).toBe(azimuth);
    expect(cam.va).toBe(0);
  });
});

describe("axis labels", () => {
  it("labels every tick and the three axes", () => {
    expect(AXIS_LABELS.map((l) => l.text)).toEqual(
      expect.arrayContaining(["0.8", "1.0", "1.25", "6M", "1Y", "18M", "2Y", "20%", "40%", "60%", "Strike K/S", "Maturity", "Implied vol"]),
    );
  });

  it("keeps every visible label inside the figure from any angle", () => {
    for (let a = 0; a < 36; a++) {
      for (const polar of [CAMERA.minPolar, CAMERA.polar, 2.6]) {
        const azimuth = (a / 36) * 2 * Math.PI;
        const view = makeView(azimuth, polar, fitScale(72, 64, azimuth, polar), 72, 64);
        for (const { at, facing } of AXIS_LABELS) {
          if (labelOpacity(azimuth, facing) === 0) continue;
          const [c, r] = labelPosition(view, at);
          expect(c).toBeGreaterThanOrEqual(1);
          expect(c).toBeLessThanOrEqual(71);
          expect(r).toBeGreaterThanOrEqual(1);
          expect(r).toBeLessThanOrEqual(63);
        }
      }
    }
  });

  it("leaves labels in the default view within a cell of where they project, beside their axes", () => {
    const view = makeView(CAMERA.azimuth, CAMERA.polar, fitScale(72, 64, CAMERA.azimuth, CAMERA.polar), 72, 64);
    for (const { at } of AXIS_LABELS) {
      const [c, r] = labelPosition(view, at);
      const [pc, pr] = projectPoint(view, at);
      expect(Math.abs(c - pc)).toBeLessThanOrEqual(1);
      expect(Math.abs(r - pr)).toBeLessThanOrEqual(1);
    }
  });

  it("shows a label while its axis faces the viewer and hides it once the axis turns away", () => {
    const front: Vec3 = [0, 0, 1];
    expect(labelOpacity(0, front)).toBe(1);
    expect(labelOpacity(Math.PI / 2, front)).toBe(0);
    expect(labelOpacity(Math.PI, front)).toBe(0);
    expect(labelOpacity(CAMERA.azimuth, front)).toBe(1);
  });
});
