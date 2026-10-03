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
      // Clamped so a tab coming back from the background doesn't fling everything, and so a frame stamped before the
      // loop started can't run time backwards.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
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
                className="firm-field-cell flex h-20 w-32 flex-col items-center justify-center gap-2 px-2"
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
                {/* In the firm's own colours, like the header strip (00 §7.5 exception), and decorative; the caption
                    names the firm (Infragrid's mark is a bare square). */}
                <Image src={company.logo} alt="" draggable={false} className="h-auto max-h-8 w-auto max-w-full object-contain" />
                <span className="whitespace-nowrap text-caption text-ink-2">{company.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {reduced ? null : (
        // Below the field rather than inside it, so firms never drift under it (WCAG 2.2.2). The ::after stretches the
        // tap target to 44px tall while the underline stays under the text.
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={togglePause}
            className="link-underline relative text-caption text-ink-2 after:absolute after:inset-x-0 after:-inset-y-3"
          >
            {paused ? "Play motion" : "Pause motion"}
          </button>
        </div>
      )}
    </Reveal>
  );
}
