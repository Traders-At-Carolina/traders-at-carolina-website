# Team Firm Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a § 04 section to `/team`, below the leadership tiers, where the placement-wall firms float in a bounded field, collide softly and can be dragged and flicked.

**Architecture:** A pure, seeded physics module (`lib/float-field.ts`) owns layout, stepping, collisions and release. A client component (`components/team/FirmField.tsx`) renders the server's seeded layout as percentage positions, takes over on mount with one `requestAnimationFrame` loop that writes `translate3d` offsets, and runs only while on screen. `TeamPage` wraps it in a section with the same centered heading as the leadership tiers.

**Tech Stack:** Next.js 16.3.8 (App Router), React 19.2, TypeScript, Tailwind v4, Vitest 5 + Testing Library (jsdom).

**Spec:** `docs/specs/04-team.md` §4.6 (and §2, §4.4, §8 criteria 11–15); `docs/specs/00-vision-and-style.md` §3, §7.5, §9.2.

## Global Constraints

- No animation or physics library: `requestAnimationFrame` and pointer events only (00 §9.2).
- Under `prefers-reduced-motion: reduce`, every effect is disabled and content renders in its final state (00 §9.2): the field is a centered, wrapped static row with no transforms and no pause button.
- No hard-coded hex values or font stacks; only spec-00 tokens (spec 04 §8.9).
- Firm marks are monochrome ink, never full colour (00 §7.5).
- Never use the legacy names "CIG" or "Carolina Investment Group".
- `AGENTS.md`: this Next.js has breaking changes. Read `node_modules/next/dist/docs/` before using any Next API not already used the same way in this repo.
- Every task ends with `pnpm test` green; the last task also runs `pnpm typecheck`, `pnpm lint` and `pnpm build`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `lib/float-field.ts` (create) | Constants, seeded layout, `step`, `settle`, `release`, `fieldHeight`. No DOM. |
| `tests/lib/float-field.test.ts` (create) | Physics unit tests. |
| `lib/use-reduced-motion.ts` (create) | `useReducedMotion()` hook, moved out of `VolSurfaceFigure.tsx`. |
| `components/home/VolSurfaceFigure.tsx` (modify) | Import the shared hook instead of its local copy. |
| `components/team/FirmField.tsx` (create) | Client component: server layout, takeover, loop, drag, hover, pause. |
| `app/globals.css` (modify) | `.firm-field*` styles next to `.logo-strip`. |
| `tests/components/firm-field.test.tsx` (create) | Component tests. |
| `components/team/LeadershipTier.tsx` (modify) | Extract `TierHeader` for reuse. |
| `components/team/TeamPage.tsx` (modify) | Render the § 04 section; renumber Placements. |
| `tests/components/team-page.test.tsx` (modify) | Numbering and presence tests. |
| `docs/specs/04-team.md` (modify) | Sync two small deviations (see Task 4). |

---

### Task 1: Physics module

**Files:**
- Create: `lib/float-field.ts`
- Test: `tests/lib/float-field.test.ts`

**Interfaces:**
- Consumes: `mulberry32(seed: number): () => number` from `lib/random-walk.ts`.
- Produces:
  - `type Body = { x: number; y: number; vx: number; vy: number; r: number; cruise: number }`
  - `type Size = { width: number; height: number }`
  - `const FIELD` with `radius` (64), `minCruise` (10), `maxCruise` (18), `restitution` (0.9), `relax` (2), `maxFlick` (1500), `coverage` (0.3), `reference` ({ width: 1200, height: 420 }), `seed` (4)
  - `fieldHeight(count: number, width: number, radius?: number): number`
  - `seedLayout(count: number, size: Size, seed?: number, radius?: number): Body[]`
  - `step(bodies: readonly Body[], size: Size, dt: number, pinned?: ReadonlySet<number>): Body[]`
  - `settle(bodies: readonly Body[], size: Size, passes?: number): Body[]`
  - `release(body: Body, flickVx: number, flickVy: number): Body`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/float-field.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/lib/float-field.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/float-field"".

- [ ] **Step 3: Write the implementation**

Create `lib/float-field.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/lib/float-field.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/float-field.ts tests/lib/float-field.test.ts
git commit -m "feat: add seeded float-field physics for the Team firm field"
```

---

### Task 2: `FirmField` component

**Files:**
- Create: `lib/use-reduced-motion.ts`
- Modify: `components/home/VolSurfaceFigure.tsx` (remove the local `reducedMotionQuery` + `useReducedMotion`, import the shared one)
- Create: `components/team/FirmField.tsx`
- Modify: `app/globals.css` (after the `.logo-strip` block, before the `link-underline` utility)
- Test: `tests/components/firm-field.test.tsx`

**Interfaces:**
- Consumes: everything Task 1 produces; `CompanyMark` (`{ name: string; logo: ImageAsset }`) from `content/types.ts`; `Reveal` from `components/Reveal.tsx`.
- Produces:
  - `useReducedMotion(): boolean` from `lib/use-reduced-motion.ts`
  - `FirmField({ companies }: { companies: CompanyMark[] })` from `components/team/FirmField.tsx`. Renders `div.firm-field > ul.firm-field-list > li.firm-field-cell` (one per firm, in order), then a "Pause motion" / "Play motion" button unless reduced motion is on.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/firm-field.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { FirmField } from "@/components/team/FirmField";
import type { CompanyMark } from "@/content/types";
import { seedLayout } from "@/lib/float-field";

const logo = { src: "/x.png", width: 96, height: 96 } as StaticImageData;
const companies: CompanyMark[] = ["Citadel", "AWS"].map((name) => ({ name, logo }));
// Two firms fit the reference field (1200 × 420) at its base height, so the server layout maps onto it one to one.
const REFERENCE = { width: 1200, height: 420 };

const cells = () => screen.getAllByRole("listitem");
const drag = (el: HTMLElement, dx: number, dy: number) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
};

describe("FirmField", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
    // jsdom has no layout; give the field the reference size.
    vi.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(function (this: Element) {
      return this.classList.contains("firm-field") ? REFERENCE.width : 0;
    });
    vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
      return this.classList.contains("firm-field") ? REFERENCE.height : 0;
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("lists each firm once with its name, with decorative marks at the seeded positions", () => {
    const { container } = render(<FirmField companies={companies} />);
    expect(cells().map((cell) => cell.textContent)).toEqual(["Citadel", "AWS"]);
    expect(container.querySelectorAll("img[alt='']")).toHaveLength(2);
    const [first] = seedLayout(2, REFERENCE);
    expect(cells()[0].style.left).toBe(`${((first.x / REFERENCE.width) * 100).toFixed(2)}%`);
    expect(cells()[0].style.top).toBe(`${((first.y / REFERENCE.height) * 100).toFixed(2)}%`);
  });

  it("moves a firm with the pointer while it is held, and stops following once let go", () => {
    render(<FirmField companies={companies} />);
    const [b] = seedLayout(2, REFERENCE);
    // Drag toward the middle so the walls never clamp the move.
    const dx = b.x < REFERENCE.width / 2 ? 10 : -10;
    const dy = b.y < REFERENCE.height / 2 ? 5 : -5;
    const cell = cells()[0];
    expect(cell.style.transform).toBe("translate3d(0px, 0px, 0)");
    drag(cell, dx, dy);
    expect(cell.style.transform).toBe(`translate3d(${dx}px, ${dy}px, 0)`);
    fireEvent.pointerUp(cell, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
    fireEvent.pointerMove(cell, { pointerId: 1, clientX: 300, clientY: 300 });
    expect(cell.style.transform).toBe(`translate3d(${dx}px, ${dy}px, 0)`);
  });

  it("ignores the secondary mouse button", () => {
    render(<FirmField companies={companies} />);
    const cell = cells()[0];
    fireEvent.pointerDown(cell, { pointerId: 1, button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(cell, { pointerId: 1, clientX: 110, clientY: 100 });
    expect(cell.style.transform).toBe("translate3d(0px, 0px, 0)");
  });

  it("pauses and resumes from a button that names its action; a paused field can't be dragged", () => {
    render(<FirmField companies={companies} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    const play = screen.getByRole("button", { name: "Play motion" });
    expect(play).not.toHaveAttribute("aria-pressed");
    drag(cells()[0], 10, 5);
    expect(cells()[0].style.transform).toBe("translate3d(0px, 0px, 0)");
    fireEvent.click(play);
    expect(screen.getByRole("button", { name: "Pause motion" })).toBeInTheDocument();
  });

  it("only runs the loop once the field is on screen", () => {
    const original = globalThis.IntersectionObserver;
    let report: IntersectionObserverCallback = () => {};
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback;
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    try {
      render(<FirmField companies={companies} />);
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      report([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it("is a static row under reduced motion: no pause button, no transforms, no dragging", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      render(<FirmField companies={companies} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      drag(cells()[0], 10, 5);
      expect(cells()[0].style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/components/firm-field.test.tsx`
Expected: FAIL, "Failed to resolve import "@/components/team/FirmField"".

- [ ] **Step 3: Move `useReducedMotion` into `lib/`**

Create `lib/use-reduced-motion.ts`:

```ts
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

/** Live `prefers-reduced-motion: reduce`. False on the server; hydration corrects it for visitors who ask for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
```

In `components/home/VolSurfaceFigure.tsx`, delete the `reducedMotionQuery` constant and the local `function useReducedMotion() { … }` (lines 19–30 today), and add `import { useReducedMotion } from "@/lib/use-reduced-motion";` with the other imports. If `reducedMotionQuery` is referenced anywhere else in that file, replace the reference with the literal `"(prefers-reduced-motion: reduce)"`. Keep `useSyncExternalStore` in the React import (`usePageVisible` still uses it).

- [ ] **Step 4: Write the component**

Create `components/team/FirmField.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Reveal } from "@/components/Reveal";
import type { CompanyMark } from "@/content/types";
import { FIELD, fieldHeight, release, seedLayout, settle, step, type Body, type Size } from "@/lib/float-field";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type FirmFieldProps = { companies: CompanyMark[] };

type Layout = { size: Size; bodies: Body[] };

/** A firm being dragged: where it was grabbed, the field's viewport offset, and the smoothed pointer velocity. */
type Hold = {
  index: number;
  grabX: number;
  grabY: number;
  left: number;
  top: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  vx: number;
  vy: number;
};

/** A pointer that rested this long before letting go isn't a flick. */
const STALE_FLICK_MS = 80;

const pct = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;
const px = (v: number) => `${Math.round(v * 10) / 10}px`;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The layout the server renders: seeded positions in the reference field, as percentages of it (spec 04 §4.6). */
function serverLayout(count: number): Layout {
  const { width, height } = FIELD.reference;
  const size = { width, height: Math.max(height, fieldHeight(count, width)) };
  return { size, bodies: seedLayout(count, size) };
}

/** Offsets each cell from its server position (inline left/top) to where its body is now. */
function paint(cells: HTMLElement[], bodies: Body[], start: Layout, size: Size) {
  cells.forEach((cell, i) => {
    const body = bodies[i];
    const anchor = start.bodies[i];
    if (!body || !anchor) return;
    const dx = body.x - (anchor.x / start.size.width) * size.width;
    const dy = body.y - (anchor.y / start.size.height) * size.height;
    cell.style.transform = `translate3d(${px(dx)}, ${px(dy)}, 0)`;
  });
}

/**
 * Team § 04 (spec 04 §4.6): the placement-wall firms floating loose in a bounded field. They drift, bounce softly off
 * each other and the edges, and can be dragged and flicked. The server renders a seeded scatter; on mount the loop
 * takes over from exactly those positions, and it runs only while the field is on screen. Layout and the static
 * reduced-motion row live in globals.css (.firm-field).
 */
export function FirmField({ companies }: FirmFieldProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const start = useMemo(() => serverLayout(companies.length), [companies.length]);
  // Mutable motion state; kept out of React state because it changes every frame.
  const motion = useRef({
    bodies: [] as Body[],
    size: { width: 0, height: 0 } as Size,
    cells: [] as HTMLElement[],
    live: false,
    paused: false,
    hovered: null as number | null,
    hold: null as Hold | null,
  });

  useEffect(() => {
    const field = fieldRef.current;
    // With reduced motion the CSS makes the field a static row and none of this runs.
    if (!field || reduced) return;
    const m = motion.current;
    m.cells = Array.from(field.querySelectorAll<HTMLElement>(".firm-field-cell"));

    /** Fits the field's height to its width, maps the current layout onto it, and pushes apart anything that now overlaps. */
    const layout = () => {
      const width = field.clientWidth;
      if (width === 0) return;
      // The CSS min-height is the base; this only takes over once many firms need more room.
      field.style.height = `${fieldHeight(m.cells.length, width)}px`;
      const size = { width, height: field.clientHeight };
      const from: Layout = m.live ? { size: m.size, bodies: m.bodies } : start;
      m.bodies = settle(
        from.bodies.map((b) => ({ ...b, x: (b.x / from.size.width) * size.width, y: (b.y / from.size.height) * size.height })),
        size,
      );
      m.size = size;
      m.live = true;
      paint(m.cells, m.bodies, start, size);
    };

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      // Clamped so a tab coming back from the background doesn't fling everything.
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (m.live && !m.paused) {
        const pinned = new Set<number>();
        if (m.hold) pinned.add(m.hold.index);
        if (m.hovered !== null) pinned.add(m.hovered);
        m.bodies = step(m.bodies, m.size, dt, pinned);
        paint(m.cells, m.bodies, start, m.size);
      }
      frame = requestAnimationFrame(tick);
    };
    const run = (visible: boolean) => {
      cancelAnimationFrame(frame);
      if (!visible) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    layout();
    const visibility = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
    visibility.observe(field);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(layout);
    resize?.observe(field);
    return () => {
      run(false);
      visibility.disconnect();
      resize?.disconnect();
      field.style.height = "";
      for (const cell of m.cells) cell.style.transform = "";
      m.live = false;
      m.hold = null;
    };
  }, [reduced, start]);

  const grab = (index: number) => (e: PointerEvent<HTMLLIElement>) => {
    const m = motion.current;
    const field = fieldRef.current;
    const body = m.bodies[index];
    if (e.button !== 0 || reduced || paused || !m.live || !field || !body) return;
    const rect = field.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    m.hold = { index, grabX: x - body.x, grabY: y - body.y, left: rect.left, top: rect.top, lastX: x, lastY: y, lastTime: performance.now(), vx: 0, vy: 0 };
    e.currentTarget.setAttribute("data-dragging", "");
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const drag = (e: PointerEvent<HTMLLIElement>) => {
    const m = motion.current;
    const hold = m.hold;
    if (!hold) return;
    const x = e.clientX - hold.left;
    const y = e.clientY - hold.top;
    const now = performance.now();
    const dt = (now - hold.lastTime) / 1000;
    // Smoothed pointer velocity, handed to the firm as a flick on release.
    if (dt > 0) {
      hold.vx = 0.7 * hold.vx + 0.3 * ((x - hold.lastX) / dt);
      hold.vy = 0.7 * hold.vy + 0.3 * ((y - hold.lastY) / dt);
    }
    hold.lastX = x;
    hold.lastY = y;
    hold.lastTime = now;
    m.bodies = m.bodies.map((b, i) =>
      i === hold.index
        ? { ...b, x: clamp(x - hold.grabX, b.r, m.size.width - b.r), y: clamp(y - hold.grabY, b.r, m.size.height - b.r) }
        : b,
    );
    paint(m.cells, m.bodies, start, m.size);
  };

  const letGo = (e: PointerEvent<HTMLLIElement>) => {
    const m = motion.current;
    const hold = m.hold;
    if (!hold) return;
    const flick = performance.now() - hold.lastTime < STALE_FLICK_MS;
    m.bodies = m.bodies.map((b, i) => (i === hold.index ? release(b, flick ? hold.vx : 0, flick ? hold.vy : 0) : b));
    m.hold = null;
    e.currentTarget.removeAttribute("data-dragging");
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const togglePause = () => {
    motion.current.paused = !paused;
    setPaused(!paused);
  };

  return (
    <Reveal className="mt-8 md:mt-12">
      <div ref={fieldRef} className="firm-field border-y border-rule">
        <ul className="firm-field-list">
          {companies.map((company, i) => {
            const anchor = start.bodies[i];
            return (
              <li
                key={company.name}
                className="firm-field-cell group flex h-20 w-32 flex-col items-center justify-center gap-2 px-2"
                style={{ left: pct(anchor.x / start.size.width), top: pct(anchor.y / start.size.height) }}
                onPointerDown={grab(i)}
                onPointerMove={drag}
                onPointerUp={letGo}
                onPointerCancel={letGo}
                onPointerEnter={() => (motion.current.hovered = i)}
                onPointerLeave={() => {
                  if (motion.current.hovered === i) motion.current.hovered = null;
                }}
              >
                {/* Flattened to ink and decorative; the caption names the firm (Infragrid's mark is a bare square). */}
                <Image
                  src={company.logo}
                  alt=""
                  draggable={false}
                  className="h-auto max-h-8 w-auto max-w-full object-contain opacity-70 brightness-0 transition-opacity group-hover:opacity-100"
                />
                <span className="whitespace-nowrap text-caption text-ink-2">{company.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {reduced ? null : (
        // Below the field rather than inside it, so firms never drift under the button (WCAG 2.2.2).
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={togglePause} className="inline-flex min-h-11 items-center text-caption text-ink-2">
            <span className="link-underline">{paused ? "Play motion" : "Pause motion"}</span>
          </button>
        </div>
      )}
    </Reveal>
  );
}
```

Before keeping the button markup, read the `@utility link-underline` block in `app/globals.css` (around line 243). If its hover state is keyed to the element itself rather than a parent, move `link-underline` onto the `<button>` and drop the inner `<span>`, keeping `min-h-11` only if the underline still sits under the text; otherwise use `py-3` instead of `min-h-11` for the 44px target.

- [ ] **Step 5: Add the styles**

In `app/globals.css`, directly after the `.logo-strip` block's closing `}` (the `@media (prefers-reduced-motion: no-preference)` block that ends with `.logo-strip-copy { display: flex; }`), add:

```css
/* Team firm field (spec 04 §4.6). Static by default: a centered, wrapped row. Without a reduced-motion preference it
   becomes a bounded field: each cell is centered on its server-seeded position (inline left/top), and
   components/team/FirmField.tsx moves it from there with transforms. JS raises the height only when many firms need room. */
.firm-field-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

@media (prefers-reduced-motion: no-preference) {
  .firm-field {
    position: relative;
    min-height: 20rem;
    overflow: hidden;
    user-select: none;
    /* Drags that start on empty field scroll the page; drags on a firm move it. */
    touch-action: pan-y;

    @media (min-width: 48rem) {
      min-height: 26.25rem;
    }
  }

  .firm-field-list {
    position: absolute;
    inset: 0;
    display: block;
  }

  .firm-field-cell {
    position: absolute;
    translate: -50% -50%;
    cursor: grab;
    touch-action: none;
    will-change: transform;
  }

  .firm-field-cell[data-dragging] {
    cursor: grabbing;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run tests/components/firm-field.test.tsx tests/components/vol-surface-figure.test.tsx`
Expected: PASS (6 firm-field tests; the vol-surface tests unchanged).

- [ ] **Step 7: Commit**

```bash
git add lib/use-reduced-motion.ts components/home/VolSurfaceFigure.tsx components/team/FirmField.tsx app/globals.css tests/components/firm-field.test.tsx
git commit -m "feat: add the FirmField floating logo field"
```

---

### Task 3: Put the field on /team

**Files:**
- Modify: `components/team/LeadershipTier.tsx` (extract the `<header>` into an exported `TierHeader`)
- Modify: `components/team/TeamPage.tsx`
- Test: `tests/components/team-page.test.tsx`

**Interfaces:**
- Consumes: `FirmField` (Task 2); `Section` from `components/Section.tsx`.
- Produces: `TierHeader({ index, eyebrow, title, id }: { index: number; eyebrow: string; title: string; id: string })` exported from `components/team/LeadershipTier.tsx`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe("TeamPage", …)` block in `tests/components/team-page.test.tsx`:

```tsx
  it("adds the firm field after the tiers as the next section, with each firm once", () => {
    renderTeam({ people: [dir, co, pres] }, [], ["Citadel", "AWS"].map(mark));
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Leadership", "§ 03 — Programs", "§ 04 — Where we've worked"]);
    const region = screen.getByRole("region", { name: "Where our leadership has worked" });
    expect(within(region).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Citadel", "AWS"]);
  });

  it("numbers placements after the firm field", () => {
    renderTeam({ people: [] }, firms(5), [mark("Citadel")]);
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Where we've worked", "§ 03 — Placements"]);
  });

  it("leaves the firm field out when the wall has no firms", () => {
    renderTeam({ people: [pres] });
    expect(screen.queryByRole("region", { name: "Where our leadership has worked" })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/components/team-page.test.tsx`
Expected: FAIL on the first two new tests (no "§ 04 — Where we've worked" eyebrow; Placements is "§ 02"). The third passes already.

- [ ] **Step 3: Extract `TierHeader`**

In `components/team/LeadershipTier.tsx`, add above `LeadershipTier`:

```tsx
type TierHeaderProps = { index: number; eyebrow: string; title: string; id: string };

/** Centered team heading: sentence-case eyebrow over a heavy Chivo title. Shared by the tiers and the firm field. */
export function TierHeader({ index, eyebrow, title, id }: TierHeaderProps) {
  return (
    <header className="border-t border-rule pt-6 text-center md:pt-8">
      <Eyebrow index={index} className="!normal-case !tracking-[0.04em]">
        {eyebrow}
      </Eyebrow>
      <h2 id={id} className="mt-4 font-title text-h2 font-extrabold text-black">
        {title}
      </h2>
    </header>
  );
}
```

and replace the inline `<header>…</header>` inside `LeadershipTier` with:

```tsx
      <TierHeader index={index} eyebrow={eyebrow} title={title} id={id} />
```

- [ ] **Step 4: Render the section in `TeamPage`**

In `components/team/TeamPage.tsx`:

1. Change the imports:

```tsx
import { FirmField } from "@/components/team/FirmField";
import { LeadershipTier, TierHeader } from "@/components/team/LeadershipTier";
```

2. Replace `const nextIndex = noLeadership ? 2 : tiers.length + 1;` with:

```tsx
  // The firm field and Placements take the next numbers after the tiers, so § numbers stay contiguous.
  const fieldIndex = noLeadership ? 2 : tiers.length + 1;
  const showField = wall.length > 0;
  const placementsIndex = showField ? fieldIndex + 1 : fieldIndex;
```

3. Between the tiers and the Placements line, render:

```tsx
      {showField ? (
        <Section labelledBy="firm-field-title" density="compact">
          <TierHeader index={fieldIndex} eyebrow="Where we've worked" title="Where our leadership has worked" id="firm-field-title" />
          <FirmField companies={wall} />
        </Section>
      ) : null}
```

4. Change the Placements line to use `placementsIndex`:

```tsx
      {showPlacements(placements) ? <Placements index={placementsIndex} firms={sortFirms(placements)} /> : null}
```

5. Update the `wall` prop's doc comment to: `/** Firms for the header strip and the § 04 firm field (content/placement-wall.ts); empty omits both. */`

- [ ] **Step 5: Run the whole suite**

Run: `pnpm test`
Expected: PASS, 36 + 2 = 38 files, 297 + 14 + 6 + 3 = 320 tests.

- [ ] **Step 6: Commit**

```bash
git add components/team/LeadershipTier.tsx components/team/TeamPage.tsx tests/components/team-page.test.tsx
git commit -m "feat: show the floating firm field below the Team leadership tiers"
```

---

### Task 4: Spec sync and verification

**Files:**
- Modify: `docs/specs/04-team.md` (§4.6 Content and Motion, §8 criterion 14)

**Interfaces:** none.

- [ ] **Step 1: Sync the two deviations into spec 04**

These came out of planning; both follow existing Team page conventions:

1. **Heading.** The field uses the leadership tiers' centered heading (`TierHeader`: sentence-case eyebrow, heavy Chivo H2, no period) rather than `SectionHeader`, so it matches the tiers above it. In §4.6 **Content**, replace the `SectionHeader` bullet with:

```md
- Heading: the same centered heading as the leadership tiers (`TierHeader` in `components/team/LeadershipTier.tsx`): eyebrow `§ 04 — Where we've worked` in sentence case, H2 in heavy Chivo (working copy: "Where our leadership has worked", without a period, like the tier titles; see open items below), no lead.
```

2. **Pause button.** A toggle whose visible label changes must not also carry `aria-pressed` (screen readers would announce "Play motion, pressed"), and placing it below the field keeps firms from drifting under it. In §4.6 **Motion**, replace the Pause bullet with:

```md
- **Pause (WCAG 2.2.2):** a caption-size text button just below the field's bottom hairline, right-aligned, with a 44px tap target. Its label names the action, "Pause motion" or "Play motion"; it has no `aria-pressed`, because the label already carries the state. While paused, the firms stop where they are and can't be dragged.
```

In §8, replace criterion 14 with:

```md
14. The pause button stops and restarts all motion, and its label names the action it will take. The loop does not run while the field is off screen.
```

In §4.6 open items, change the H2 copy item's working copy to "Where our leadership has worked" (no period).

- [ ] **Step 2: Typecheck, lint, test, build**

Run each and expect it to pass with no new warnings:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

If `pnpm lint` flags the ref writes in `FirmField`'s `onPointerEnter`/`onPointerLeave`, compare with `PlacementWall.tsx`, which uses the same pattern, before changing anything.

- [ ] **Step 3: Check it in the browser**

Start the dev server with `preview_start` (name from `.claude/launch.json`) and open `/team`:
- The § 04 section sits after Directors with four firms scattered in a 420px field between hairlines, drifting slowly. No console errors or hydration warnings.
- Dragging a firm moves it and shoves others; a flick sends it off and it slows back to cruise. Hovering a firm stills it and darkens its mark.
- "Pause motion" freezes the field and becomes "Play motion".
- At the mobile preset (375px) the field is 320px tall (or taller if the firms need room), and a vertical drag on empty field scrolls the page.
- With `prefers-reduced-motion: reduce` emulated, the firms are a centered static row and the button is gone.

Take a screenshot of the desktop section for the summary.

- [ ] **Step 4: Commit**

```bash
git add docs/specs/04-team.md
git commit -m "docs(spec-04): match the firm field heading and pause button to what shipped"
```
