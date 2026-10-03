import { describe, expect, it } from "vitest";
import { seededBit } from "@/components/bits/bitCore";
import {
  ALPHA_404,
  EASE_MS,
  IDLE_PITCH,
  IDLE_YAW,
  MAX_PITCH,
  MAX_YAW,
  REST_POSE,
  bitState,
  buildShell,
  depthAlpha,
  easePose,
  extrusionLayers,
  figureLayout,
  idlePose,
  layerShade,
  letterBounds,
  projectShell,
  sortByDepth,
  targetPose,
} from "@/components/notfound/bit404Scene";

/** Builds a mask from rows of "#" (letter) and "." (empty). */
function mask(rows: string[]) {
  const cols = rows[0].length;
  const m = new Uint8Array(cols * rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => (m[y * cols + x] = ch === "#" ? 1 : 0)));
  return { mask: m, cols, rows: rows.length };
}

const deg = (d: number) => (d * Math.PI) / 180;

describe("figureLayout", () => {
  it("uses 9px cells from md up and 6px below, with a taller box on narrow screens", () => {
    expect(figureLayout(true)).toMatchObject({ cell: 9, aspect: 0.5 });
    expect(figureLayout(false)).toMatchObject({ cell: 6, aspect: 0.62 });
  });
});

describe("letterBounds", () => {
  it("finds the box around the letter cells", () => {
    const { mask: m, cols, rows } = mask(["....", ".##.", ".#..", "...."]);
    expect(letterBounds(m, cols, rows)).toEqual({ c0: 1, c1: 2, r0: 1, r1: 2 });
  });

  it("is null for an empty mask", () => {
    const { mask: m, cols, rows } = mask(["...", "..."]);
    expect(letterBounds(m, cols, rows)).toBeNull();
  });
});

describe("extrusionLayers", () => {
  it("is 0.3 of the letters' height in cells, at least 4", () => {
    expect(extrusionLayers(40)).toBe(12);
    expect(extrusionLayers(5)).toBe(4);
  });
});

describe("buildShell", () => {
  // A 3×3 solid square: 9 letter cells, 8 of them on the edge (all but the middle).
  const square = mask([".....", ".###.", ".###.", ".###.", "....."]);

  it("puts every letter cell on the front and back faces and only edge cells on the walls between", () => {
    const shell = buildShell(square.mask, square.cols, square.rows, 4);
    // 9 front + 9 back + 2 inner layers × 8 edge cells.
    expect(shell.count).toBe(9 + 9 + 2 * 8);
    const perLayer = [0, 1, 2, 3].map((l) => shell.layer.filter((v) => v === l).length);
    expect(perLayer).toEqual([9, 8, 8, 9]);
  });

  it("counts the inside of a hole as edge, so counters get walls too", () => {
    const ring = mask(["###", "#.#", "###"]);
    const shell = buildShell(ring.mask, ring.cols, ring.rows, 3);
    expect(shell.count).toBe(8 + 8 + 8);
  });

  it("centers the solid on its own middle, with the front face nearest the viewer", () => {
    const shell = buildShell(square.mask, square.cols, square.rows, 4);
    const mean = (a: Float32Array) => a.reduce((s, v) => s + v, 0) / shell.count;
    expect(mean(shell.x)).toBeCloseTo(0, 5);
    expect(mean(shell.y)).toBeCloseTo(0, 5);
    expect(shell.z[shell.layer.indexOf(0)]).toBeCloseTo(1.5, 5);
    expect(shell.z[shell.layer.indexOf(3)]).toBeCloseTo(-1.5, 5);
    expect(shell.width).toBe(3);
  });

  it("is empty for an empty mask", () => {
    const empty = mask(["...", "..."]);
    expect(buildShell(empty.mask, empty.cols, empty.rows, 4).count).toBe(0);
  });
});

describe("projectShell", () => {
  const square = mask([".....", ".###.", ".###.", ".###.", "....."]);
  const shell = buildShell(square.mask, square.cols, square.rows, 4);
  const out = () => ({
    sx: new Float32Array(shell.count),
    sy: new Float32Array(shell.count),
    scale: new Float32Array(shell.count),
    depth: new Float32Array(shell.count),
  });
  const front = [...Array(shell.count).keys()].filter((i) => shell.layer[i] === 0);

  it("only applies perspective when the pose is zero", () => {
    const o = out();
    projectShell(shell, { yaw: 0, pitch: 0 }, 1000, o);
    for (const i of front) {
      // The front face sits slightly toward the viewer, so it is scaled up by D / (D - z).
      const s = 1000 / (1000 - shell.z[i]);
      expect(o.sx[i]).toBeCloseTo(shell.x[i] * s, 4);
      expect(o.sy[i]).toBeCloseTo(shell.y[i] * s, 4);
      expect(o.depth[i]).toBeCloseTo(shell.z[i], 5);
      expect(o.scale[i]).toBeCloseTo(s, 5);
    }
  });

  it("turns the face toward +x for a positive yaw: its left side comes nearer", () => {
    const o = out();
    projectShell(shell, { yaw: deg(30), pitch: 0 }, 50, o);
    const right = front.find((i) => shell.x[i] > 0 && shell.y[i] === 0)!;
    const left = front.find((i) => shell.x[i] < 0 && shell.y[i] === 0)!;
    expect(o.depth[left]).toBeGreaterThan(o.depth[right]);
    expect(o.scale[left]).toBeGreaterThan(o.scale[right]);
  });

  it("tilts the face down for a positive pitch: its top edge comes nearer", () => {
    const o = out();
    projectShell(shell, { yaw: 0, pitch: deg(20) }, 50, o);
    const top = front.find((i) => shell.y[i] < 0)!;
    const bottom = front.find((i) => shell.y[i] > 0)!;
    expect(o.depth[top]).toBeGreaterThan(o.depth[bottom]);
  });
});

describe("sortByDepth", () => {
  it("orders indices far to near and keeps doing so as depths change", () => {
    const depth = new Float32Array([3, -1, 2, 0]);
    const order = new Uint32Array([0, 1, 2, 3]);
    sortByDepth(order, depth);
    expect([...order]).toEqual([1, 3, 2, 0]);
    depth.set([-5, 4, 1, 0]);
    sortByDepth(order, depth);
    expect([...order]).toEqual([0, 3, 2, 1]);
  });
});

describe("depthAlpha", () => {
  it("fades gently from 65% at the farthest bit to 100% at the nearest", () => {
    expect(depthAlpha(-2, -2, 2)).toBeCloseTo(0.65, 5);
    expect(depthAlpha(2, -2, 2)).toBeCloseTo(1, 5);
    expect(depthAlpha(0, -2, 2)).toBeCloseTo(0.825, 5);
  });

  it("is fully opaque when every bit is at one depth", () => {
    expect(depthAlpha(1, 1, 1)).toBe(1);
  });
});

describe("layerShade", () => {
  it("keeps the front face at full strength and shades the walls and back lighter", () => {
    expect(layerShade(0)).toBe(1);
    expect(layerShade(1)).toBeLessThan(0.8);
    expect(layerShade(7)).toBe(layerShade(1));
  });
});

describe("targetPose", () => {
  it("turns toward the pointer, clamped to the maximum tilt", () => {
    expect(targetPose(0, 0, 1000, 800)).toEqual({ yaw: 0, pitch: 0 });
    // Halfway to the right edge, a quarter of the way down.
    const p = targetPose(250, 100, 1000, 800);
    expect(p.yaw).toBeCloseTo(MAX_YAW * 0.5, 5);
    expect(p.pitch).toBeCloseTo(MAX_PITCH * 0.25, 5);
    // Far off to the upper left: clamped.
    const far = targetPose(-5000, -5000, 1000, 800);
    expect(far.yaw).toBeCloseTo(-MAX_YAW, 5);
    expect(far.pitch).toBeCloseTo(-MAX_PITCH, 5);
  });

  it("limits the tilt to ±35° yaw and ±25° pitch", () => {
    expect(MAX_YAW).toBeCloseTo(deg(35), 5);
    expect(MAX_PITCH).toBeCloseTo(deg(25), 5);
  });
});

describe("easePose", () => {
  it("moves part of the way per frame and converges, independent of frame rate", () => {
    const target = { yaw: 1, pitch: -1 };
    const one = easePose({ yaw: 0, pitch: 0 }, target, EASE_MS);
    expect(one.yaw).toBeCloseTo(1 - Math.exp(-1), 5);
    let a = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 10; i++) a = easePose(a, target, EASE_MS / 10);
    expect(a.yaw).toBeCloseTo(one.yaw, 5);
    let b = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 200; i++) b = easePose(b, target, 16);
    expect(b.yaw).toBeCloseTo(1, 4);
    expect(b.pitch).toBeCloseTo(-1, 4);
  });

  it("honors a slower time constant", () => {
    const fast = easePose({ yaw: 0, pitch: 0 }, { yaw: 1, pitch: 0 }, 100);
    const slow = easePose({ yaw: 0, pitch: 0 }, { yaw: 1, pitch: 0 }, 100, EASE_MS * 4);
    expect(slow.yaw).toBeLessThan(fast.yaw);
  });
});

describe("idlePose", () => {
  it("starts at the rest pose and sways within its bounds", () => {
    expect(idlePose(0)).toEqual(REST_POSE);
    for (let t = 0; t < 60_000; t += 250) {
      const p = idlePose(t);
      expect(Math.abs(p.yaw - REST_POSE.yaw)).toBeLessThanOrEqual(IDLE_YAW + 1e-9);
      expect(Math.abs(p.pitch - REST_POSE.pitch)).toBeLessThanOrEqual(IDLE_PITCH + 1e-9);
    }
  });

  it("rests in a three-quarter view: turned left and seen from slightly above", () => {
    expect(REST_POSE.yaw).toBeCloseTo(deg(-12), 5);
    expect(REST_POSE.pitch).toBeCloseTo(deg(8), 5);
  });
});

describe("bitState", () => {
  it("flickers at the scrambled opacity before it settles", () => {
    const s = bitState({ col: 3, row: 4, layer: 1, time: 0, settle: 0, shimmer: false });
    expect(s.alpha).toBeCloseTo(ALPHA_404.scrambled, 5);
  });

  it("shows its seeded bit at full opacity once settled", () => {
    const s = bitState({ col: 3, row: 4, layer: 1, time: 0, settle: 1, shimmer: false });
    expect(s.alpha).toBe(1);
    expect(s.glyph).toBe(seededBit(3, 4, 1) ? "1" : "0");
  });

  it("glitches a few percent of formed bits per window, flipping them and dimming to half", () => {
    let glitched = 0;
    let total = 0;
    for (let c = 0; c < 60; c++) {
      for (let l = 0; l < 4; l++) {
        const s = bitState({ col: c, row: 7, layer: l, time: 1234, settle: 1, shimmer: true });
        total++;
        if (s.alpha < 1) {
          glitched++;
          expect(s.alpha).toBe(ALPHA_404.glitch);
          expect(s.glyph).toBe(seededBit(c, 7, l) ? "0" : "1");
        }
      }
    }
    expect(glitched / total).toBeGreaterThan(0.005);
    expect(glitched / total).toBeLessThan(0.1);
  });

  it("gives the layers of one cell their own bits", () => {
    const bits = new Set<number>();
    for (let l = 0; l < 16; l++) bits.add(seededBit(5, 5, l));
    expect(bits.size).toBe(2);
  });
});
