"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { walkStroke } from "@/components/RandomWalk";
import {
  SIDES,
  bookScale,
  depthCurves,
  depthGeometry,
  generateBook,
  levelBars,
  nextEvent,
  sideSpan,
  type Book,
  type Side,
} from "@/lib/order-book";
import { mulberry32, toPathData, type Point } from "@/lib/random-walk";
import { usePageVisible } from "@/lib/use-page-visible";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { easeInOut } from "@/lib/vol-surface";

type DepthChartProps = {
  seed: number;
  className?: string;
};

const box = { levels: 14, width: 400, height: 200 } as const;

/** Room above the starting book, so the live book can deepen without rescaling the chart. */
const HEADROOM = 1.2;
/** The CSS entrance (globals.css): a wipe out from the spread draws the curves and ladder, then the fills wash in. */
const ENTRANCE_MS = 1400;
/** Idle: a book event every 0.9–1.6s, each change tweened over 550ms. */
const TICK_MS = [900, 1600] as const;
const TWEEN_MS = 550;

/** Bids take the walk's lead stroke (solid navy); asks take its muted black (00 §7.2). */
const sides = [
  { key: "bids", stroke: walkStroke(0), color: "var(--color-navy)", fillOpacity: 0.1, bar: "fill-navy", barOpacity: "0.14" },
  { key: "asks", stroke: walkStroke(2), color: "var(--color-black)", fillOpacity: 0.05, bar: "fill-black", barOpacity: "0.08" },
] as const;

/** Closes a depth curve down to the baseline so it can be filled. */
const toAreaData = (points: Point[], baseline: number) => `${toPathData([...points, [points.at(-1)![0], baseline]])} Z`;

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

type Model = ReturnType<typeof useModel>;

function useModel(seed: number) {
  return useMemo(() => {
    const opts = { seed, ...box };
    const geometry = depthGeometry(opts);
    const book = generateBook(opts);
    const scale = bookScale(book, opts, HEADROOM);
    // The deepest a side may get before its curve would pass the top margin.
    const cap = (geometry.baseline - geometry.top) / scale;
    return { opts, geometry, book, scale, cap };
  }, [seed]);
}

type Tween = { from: number; to: number; start: number; ms: number; ease: (t: number) => number };
type Pulse = { key: number; side: Side; y: number };

type Live = {
  shown: Book;
  target: Book;
  tweens: Record<Side, (Tween | null)[]>;
  /** Animation time in ms; only advances while the chart is live, so a paused book resumes where it stopped. */
  clock: number;
  nextTick: number;
  rand: () => number;
};

/**
 * Drives the book: on first sight it marks the chart ready, which starts the CSS draw-in, then it trades quietly. Frames write straight to
 * the SVG through `draw`, so React renders the chart once. Runs only while on screen, in a visible tab and without
 * reduced motion; under reduced motion the static book shows.
 */
function useLiveBook(model: Model, root: RefObject<HTMLDivElement | null>, draw: (book: Book) => void) {
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const [inView, setInView] = useState(false);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    if (!reducedMotion) return;
    const s = live.current;
    if (s) {
      s.shown = s.target;
      s.tweens = { bids: [], asks: [] };
    }
    draw(s?.target ?? model.book);
    root.current?.setAttribute("data-ready", "");
  }, [reducedMotion, model, draw, root]);

  const running = !reducedMotion && inView && pageVisible;
  useEffect(() => {
    if (!running) return;
    const { book, cap, scale, geometry, opts } = model;

    let s = live.current;
    if (!s) {
      s = live.current = {
        shown: book,
        target: book,
        tweens: { bids: [], asks: [] },
        clock: 0,
        nextTick: ENTRANCE_MS + TICK_MS[0],
        rand: mulberry32(opts.seed ^ 0x5bd1e995),
      };
      root.current?.setAttribute("data-ready", "");
    }
    const state = s;

    const tick = () => {
      const event = nextEvent(state.target, book, cap, state.rand);
      for (const { side, i } of event.changed) {
        const to = event.book[side][i];
        state.tweens[side][i] = { from: state.shown[side][i], to, start: state.clock, ms: TWEEN_MS, ease: easeInOut };
      }
      state.target = event.book;
      if (event.trade) {
        const side = event.trade;
        setPulse((p) => ({ key: (p?.key ?? 0) + 1, side, y: geometry.baseline - event.book[side][0] * scale }));
      }
      state.nextTick = state.clock + TICK_MS[0] + state.rand() * (TICK_MS[1] - TICK_MS[0]);
    };

    // Moves every tweening level to the current clock; returns whether anything moved.
    const advance = () => {
      let moved = false;
      const shown: Book = { bids: [...state.shown.bids], asks: [...state.shown.asks] };
      for (const side of SIDES) {
        state.tweens[side].forEach((tw, i) => {
          if (!tw) return;
          const t = Math.min(1, Math.max(0, (state.clock - tw.start) / tw.ms));
          shown[side][i] = tw.from + (tw.to - tw.from) * tw.ease(t);
          if (t === 1) state.tweens[side][i] = null;
          moved = true;
        });
      }
      state.shown = shown;
      return moved;
    };

    let frame = 0;
    let last = 0;
    const step = (now: number) => {
      // Cap each step so a long frame, or a resumed tab, doesn't skip the motion.
      state.clock += last ? Math.min(now - last, 64) : 16;
      last = now;
      if (state.clock >= state.nextTick) tick();
      if (advance()) draw(state.shown);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running, model, draw, root]);

  return reducedMotion ? null : pulse;
}

/**
 * Membership header art (spec 03 §3.1, 00 §7.6): a seeded order book as a depth chart over a ladder of resting
 * sizes, either side of a dashed mid. It draws out from the spread, then trades quietly: levels resize and the
 * occasional fill prints at the touch. Decorative only.
 */
export function DepthChart({ seed, className = "" }: DepthChartProps) {
  const model = useModel(seed);
  const { opts, geometry, book, scale } = model;
  const { bidEdge, askEdge, baseline, top } = geometry;
  const mid = box.width / 2;
  const gradient = useId();

  const root = useRef<HTMLDivElement>(null);
  const curves = useRef<Partial<Record<Side, SVGPathElement | null>>>({});
  const fills = useRef<Partial<Record<Side, SVGPathElement | null>>>({});
  const bars = useRef<(SVGRectElement | null)[]>([]);

  const draw = useCallback(
    (b: Book) => {
      const depth = depthCurves(b, opts, scale);
      for (const side of SIDES) {
        curves.current[side]?.setAttribute("d", toPathData(depth[side]));
        fills.current[side]?.setAttribute("d", toAreaData(depth[side], baseline));
      }
      levelBars(b, opts, scale).forEach((bar, k) => {
        bars.current[k]?.setAttribute("y", String(bar.y));
        bars.current[k]?.setAttribute("height", String(bar.h));
      });
    },
    [opts, scale, baseline],
  );

  const pulse = useLiveBook(model, root, draw);

  // Server render (and the no-JS / reduced-motion view): the full starting book.
  const depth = depthCurves(book, opts, scale);
  const ladder = levelBars(book, opts, scale);
  const ticks = SIDES.flatMap((side) => {
    const { edge, dx } = sideSpan(side, opts);
    return Array.from({ length: opts.levels + 1 }, (_, i) => `M${(edge + i * dx).toFixed(1)} ${baseline}v4`);
  }).join("");

  return (
    <div ref={root} aria-hidden="true" className={`depth-chart relative ${className}`}>
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          {sides.map(({ key, color, fillOpacity }) => (
            <linearGradient key={key} id={`${gradient}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={fillOpacity} />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}
          {/* The pen: each side's clip widens out from the spread, so the line is drawn rather than raised. A clip
              works in the viewBox's own units, unlike stroke dashes, which a non-scaling stroke measures on screen. */}
          {sides.map(({ key }) => (
            <clipPath key={key} id={`${gradient}-${key}-pen`}>
              <rect
                data-pen={key}
                x={key === "bids" ? -2 : askEdge - 1}
                width={key === "bids" ? bidEdge + 3 : box.width - askEdge + 3}
                y={-2}
                height={box.height + 4}
              />
            </clipPath>
          ))}
        </defs>
        <rect data-layer="spread" x={bidEdge} width={askEdge - bidEdge} y={top} height={baseline - top} className="fill-navy" fillOpacity="0.04" />
        <g data-layer="bars">
          {ladder.map((bar, k) => {
            const side = sides.find((s) => s.key === bar.side)!;
            return (
              <rect
                key={`${bar.side}-${bar.i}`}
                ref={(el) => {
                  bars.current[k] = el;
                }}
                data-side={bar.side}
                clipPath={`url(#${gradient}-${bar.side}-pen)`}
                x={bar.x}
                width={bar.w}
                y={bar.y}
                height={bar.h}
                className={side.bar}
                fillOpacity={side.barOpacity}
              />
            );
          })}
        </g>
        <g data-layer="fills">
          {sides.map(({ key }) => (
            <path
              key={key}
              ref={(el) => {
                fills.current[key] = el;
              }}
              data-side={key}
              d={toAreaData(depth[key], baseline)}
              fill={`url(#${gradient}-${key})`}
            />
          ))}
        </g>
        <path data-layer="ticks" d={ticks} className="stroke-rule" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1={0} x2={box.width} y1={baseline} y2={baseline} className="stroke-rule" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line
          data-layer="mid"
          x1={mid}
          x2={mid}
          y1={top}
          y2={baseline}
          className="stroke-rule-strong"
          strokeWidth="1"
          strokeDasharray="2 4"
          vectorEffect="non-scaling-stroke"
        />
        <g data-layer="curves">
          {sides.map(({ key, stroke }) => (
            <path
              key={key}
              ref={(el) => {
                curves.current[key] = el;
              }}
              data-side={key}
              d={toPathData(depth[key])}
              clipPath={`url(#${gradient}-${key}-pen)`}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              {...stroke}
            />
          ))}
        </g>
      </svg>
      {/* Round marks sit outside the stretched SVG so they stay circular at any aspect ratio. */}
      <span
        data-layer="mid-dot"
        className="absolute size-1.5 -translate-1/2 rounded-full bg-navy"
        style={{ left: pct(mid, box.width), top: pct(top, box.height) }}
      />
      {pulse ? (
        <span
          key={pulse.key}
          data-layer="pulse"
          data-side={pulse.side}
          className={`depth-pulse absolute size-5 rounded-full border ${pulse.side === "bids" ? "border-navy" : "border-ink-3"}`}
          style={{ left: pct(pulse.side === "bids" ? bidEdge : askEdge, box.width), top: pct(pulse.y, box.height) }}
        />
      ) : null}
    </div>
  );
}
