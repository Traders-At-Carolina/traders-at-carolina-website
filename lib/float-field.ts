import { mulberry32 } from "@/lib/random-walk";

/** One firm in the /team firm field: centre and velocity (px, px/s), collision radius, and the speed it settles back to. */
export type Body = { x: number; y: number; vx: number; vy: number; r: number; cruise: number };

export type Size = { width: number; height: number };

/** Tuning for the firm field (docs/specs/04-team.md §4.6). */
export const FIELD = {
  /** Collision radius: half the 128px cell, so neighbouring cells never overlap side by side. */
  radius: 64,
  /** Cruise speed range, px/s. */
  minCruise: 10,
  maxCruise: 18,
  /** Share of the approach speed kept after a bounce. */
  restitution: 0.9,
  /** How fast speed eases back to cruise after a bump or flick, per second. */
  relax: 2,
  /** Flick speed cap, px/s. */
  maxFlick: 1500,
  /** The circles cover at most this share of the field before it grows taller. */
  coverage: 0.3,
  /** Field the server lays out against; the client maps it onto the real one. */
  reference: { width: 1200, height: 420 },
  seed: 4,
} as const;

/** Height at which `count` circles cover FIELD.coverage of a field `width` wide. The CSS min-height is the floor. */
export function fieldHeight(count: number, width: number, radius: number = FIELD.radius): number {
  if (width <= 0) return 0;
  return Math.ceil((count * Math.PI * radius * radius) / (FIELD.coverage * width));
}

/**
 * Seeded starting layout: positions clear of each other where there is room, each with a seeded heading and cruise
 * speed. Same count, size and seed give the same layout, so the server and the client render the same first frame.
 */
export function seedLayout(count: number, size: Size, seed: number = FIELD.seed, radius: number = FIELD.radius): Body[] {
  const rand = mulberry32(seed);
  const span = (extent: number) => Math.max(extent - 2 * radius, 0);
  const bodies: Body[] = [];
  for (let i = 0; i < count; i++) {
    // Rejection sampling; if nothing clears in 200 tries, keep the roomiest spot and let settle() finish the job.
    let best = { x: size.width / 2, y: size.height / 2, gap: -Infinity };
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = radius + rand() * span(size.width);
      const y = radius + rand() * span(size.height);
      const gap = Math.min(Infinity, ...bodies.map((b) => Math.hypot(b.x - x, b.y - y) - b.r - radius));
      if (gap > best.gap) best = { x, y, gap };
      if (gap >= 0) break;
    }
    const angle = rand() * 2 * Math.PI;
    const cruise = FIELD.minCruise + rand() * (FIELD.maxCruise - FIELD.minCruise);
    bodies.push({ x: best.x, y: best.y, vx: Math.cos(angle) * cruise, vy: Math.sin(angle) * cruise, r: radius, cruise });
  }
  return bodies;
}

/**
 * Advances the field by `dt` seconds and returns new bodies; the input is not changed. Speeds ease back to cruise,
 * firms move, bounce softly off each other, then off the walls. Pinned firms (held or hovered) stay put and act as
 * immovable to the others, and keep their velocity for when they are let go.
 */
export function step(bodies: readonly Body[], size: Size, dt: number, pinned: ReadonlySet<number> = new Set()): Body[] {
  const next = bodies.map((b, i) => (pinned.has(i) ? { ...b } : advance(b, dt)));
  collide(next, pinned, true);
  next.forEach((b, i) => bounce(b, size, !pinned.has(i)));
  return next;
}

/** Pushes apart any overlaps (say, after the server layout is mapped onto a narrower field) without adding speed. */
export function settle(bodies: readonly Body[], size: Size, passes = 24): Body[] {
  const next = bodies.map((b) => ({ ...b }));
  const none = new Set<number>();
  for (let pass = 0; pass < passes; pass++) {
    collide(next, none, false);
    for (const b of next) bounce(b, size, false);
  }
  return next;
}

/** A firm let go after a drag takes the flick, capped; let go without a real flick, it picks its old heading back up. */
export function release(body: Body, flickVx: number, flickVy: number): Body {
  const speed = Math.hypot(flickVx, flickVy);
  if (speed < body.cruise) return { ...body };
  const scale = Math.min(1, FIELD.maxFlick / speed);
  return { ...body, vx: flickVx * scale, vy: flickVy * scale };
}

function advance(b: Body, dt: number): Body {
  const speed = Math.hypot(b.vx, b.vy);
  const eased = b.cruise + (speed - b.cruise) * Math.exp(-FIELD.relax * dt);
  const scale = speed > 0 ? eased / speed : 0;
  const vx = b.vx * scale;
  const vy = b.vy * scale;
  return { ...b, x: b.x + vx * dt, y: b.y + vy * dt, vx, vy };
}

/** Separates overlapping pairs in place; with `impulses`, also bounces them apart along the contact normal. */
function collide(bodies: Body[], pinned: ReadonlySet<number>, impulses: boolean) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const aFree = !pinned.has(i);
      const bFree = !pinned.has(j);
      if (!aFree && !bFree) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const overlap = a.r + b.r - dist;
      if (overlap <= 0) continue;
      if (dist === 0) [dx, dy, dist] = [1, 0, 1];
      const nx = dx / dist;
      const ny = dy / dist;
      // Free firms split the correction; a pinned one doesn't move, so the other takes all of it.
      const shareA = aFree ? (bFree ? 0.5 : 1) : 0;
      const shareB = bFree ? (aFree ? 0.5 : 1) : 0;
      a.x -= nx * overlap * shareA;
      a.y -= ny * overlap * shareA;
      b.x += nx * overlap * shareB;
      b.y += ny * overlap * shareB;
      if (!impulses) continue;
      // A pinned firm isn't moving, whatever velocity it is keeping for later.
      const approach = ((bFree ? b.vx : 0) - (aFree ? a.vx : 0)) * nx + ((bFree ? b.vy : 0) - (aFree ? a.vy : 0)) * ny;
      if (approach >= 0) continue;
      // Equal masses; a pinned firm is immovable (infinite mass).
      const impulse = (-(1 + FIELD.restitution) * approach) / (Number(aFree) + Number(bFree));
      if (aFree) {
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
      }
      if (bFree) {
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
    }
  }
}

/** Keeps a firm inside the field; a free firm's velocity reflects off the wall it hit. */
function bounce(b: Body, size: Size, free: boolean) {
  const e = FIELD.restitution;
  if (b.x < b.r) {
    b.x = b.r;
    if (free) b.vx = Math.abs(b.vx) * e;
  } else if (b.x > size.width - b.r) {
    b.x = size.width - b.r;
    if (free) b.vx = -Math.abs(b.vx) * e;
  }
  if (b.y < b.r) {
    b.y = b.r;
    if (free) b.vy = Math.abs(b.vy) * e;
  } else if (b.y > size.height - b.r) {
    b.y = size.height - b.r;
    if (free) b.vy = -Math.abs(b.vy) * e;
  }
}
