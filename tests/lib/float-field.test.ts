import { describe, expect, it } from "vitest";
import { FIELD, fieldHeight, release, seedLayout, settle, step, type Body } from "@/lib/float-field";

const R = FIELD.radius;
const body = (over: Partial<Body>): Body => ({ x: 500, y: 200, vx: 12, vy: 0, r: R, cruise: 12, ...over });
const speed = (b: Body) => Math.hypot(b.vx, b.vy);
const overlaps = (bodies: Body[]) =>
  bodies.flatMap((a, i) => bodies.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1e-6));

describe("fieldHeight", () => {
  it("returns the height at which the circles cover 30% of the field", () => {
    // 4 firms barely need any room; the CSS min-height (420px) wins.
    expect(fieldHeight(4, 1200)).toBe(143);
    // 20 firms need more than the base height.
    expect(fieldHeight(20, 1200)).toBe(715);
  });

  it("is 0 before the field has a width", () => {
    expect(fieldHeight(4, 0)).toBe(0);
  });
});

describe("seedLayout", () => {
  const size = { width: 1200, height: 420 };

  it("is deterministic for a seed and differs between seeds", () => {
    expect(seedLayout(4, size)).toEqual(seedLayout(4, size));
    expect(seedLayout(4, size, 1)).not.toEqual(seedLayout(4, size, 2));
  });

  it("keeps every firm inside the field, clear of the others", () => {
    const bodies = seedLayout(4, size);
    for (const b of bodies) {
      expect(b.x).toBeGreaterThanOrEqual(R);
      expect(b.x).toBeLessThanOrEqual(size.width - R);
      expect(b.y).toBeGreaterThanOrEqual(R);
      expect(b.y).toBeLessThanOrEqual(size.height - R);
    }
    expect(overlaps(bodies)).toEqual([]);
  });

  it("still fits 20 firms without overlaps once the field has grown", () => {
    expect(overlaps(seedLayout(20, { width: 1200, height: fieldHeight(20, 1200) }))).toEqual([]);
  });

  it("starts each firm at its own cruise speed between 10 and 18 px/s", () => {
    for (const b of seedLayout(8, size)) {
      expect(b.cruise).toBeGreaterThanOrEqual(FIELD.minCruise);
      expect(b.cruise).toBeLessThanOrEqual(FIELD.maxCruise);
      expect(speed(b)).toBeCloseTo(b.cruise, 9);
    }
  });
});

describe("step", () => {
  const size = { width: 1200, height: 420 };

  it("moves a firm along its velocity without touching the input", () => {
    const input = [body({})];
    const [next] = step(input, size, 0.5);
    expect(next.x).toBeCloseTo(506, 9);
    expect(input[0].x).toBe(500);
  });

  it("eases a flicked firm back to its cruise speed", () => {
    let bodies = [body({ x: 2500, y: 2500, vx: 1500, cruise: 12 })];
    for (let i = 0; i < 300; i++) bodies = step(bodies, { width: 5000, height: 5000 }, 1 / 60);
    expect(speed(bodies[0])).toBeGreaterThan(11.5);
    expect(speed(bodies[0])).toBeLessThan(12.5);
  });

  it("bounces off a wall", () => {
    const [next] = step([body({ x: 70, vx: -100, cruise: 100 })], size, 0.1);
    expect(next.x).toBe(R);
    expect(next.vx).toBeGreaterThan(0);
  });

  it("separates two firms that meet head on and sends them apart", () => {
    const [a, b] = step([body({ x: 500, vx: 12 }), body({ x: 620, vx: -12 })], size, 0.01);
    expect(b.x - a.x).toBeGreaterThanOrEqual(2 * R - 1e-9);
    expect(a.vx).toBeLessThan(0);
    expect(b.vx).toBeGreaterThan(0);
  });

  it("holds a pinned firm still and pushes the other one clear of it", () => {
    const [held, free] = step([body({ x: 500, vx: 0 }), body({ x: 560, vx: 0, cruise: 0 })], size, 0.01, new Set([0]));
    expect(held.x).toBe(500);
    expect(free.x).toBeCloseTo(500 + 2 * R, 9);
  });
});

describe("settle", () => {
  it("pushes overlaps apart without changing any velocity", () => {
    const bodies = [body({ x: 500 }), body({ x: 540, vx: -5 })];
    const settled = settle(bodies, { width: 1200, height: 420 });
    expect(overlaps(settled)).toEqual([]);
    expect(settled.map((b) => b.vx)).toEqual([12, -5]);
  });
});

describe("release", () => {
  it("hands over a flick, capped at 1500 px/s", () => {
    const flung = release(body({}), 3000, 0);
    expect(flung.vx).toBe(1500);
    expect(flung.vy).toBe(0);
  });

  it("keeps the old heading when let go without a real flick", () => {
    const b = body({ vx: 0, vy: 12 });
    expect(release(b, 2, 1)).toEqual(b);
  });
});
