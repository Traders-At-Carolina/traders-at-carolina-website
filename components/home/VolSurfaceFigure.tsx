"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/Button";
import type { SurfaceHover } from "@/components/home/VolSurfaceCanvas";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { mulberry32 } from "@/lib/random-walk";
import {
  DEFAULT_PARAMS,
  RANGES,
  describeSurface,
  randomParams,
  stepParams,
  type VolParams,
} from "@/lib/vol-surface";

// three.js stays out of the initial bundle: the canvas loads after hydration, once the figure is near the viewport.
const VolSurfaceCanvas = dynamic(() => import("@/components/home/VolSurfaceCanvas"), {
  ssr: false,
  loading: () => <VolSurfacePoster />,
});

const TICK_MS = 80;
const IDLE_MS = 4000;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(reducedMotionQuery);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

function usePageVisible() {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);
      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => !document.hidden,
    () => true,
  );
}

function nextSeed(current: number | null) {
  let seed = current;
  while (seed === current) seed = 1000 + Math.floor(Math.random() * 9000);
  return seed as number;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const signed = (v: number) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2)}`;

const sliders: { key: keyof VolParams; label: string; step: number; format: (v: number) => string }[] = [
  { key: "atmVol", label: "ATM vol", step: 0.01, format: pct },
  { key: "skew", label: "Skew ρ", step: 0.01, format: signed },
  { key: "termSlope", label: "Term slope", step: 0.01, format: signed },
];

type VolSurfaceFigureProps = {
  caption: string;
  className?: string;
};

/** Fig. 1 on Home: a rotatable, simulatable implied-volatility surface (spec 01 §3.1). */
export function VolSurfaceFigure({ caption, className = "" }: VolSurfaceFigureProps) {
  const [params, setParams] = useState<VolParams>(DEFAULT_PARAMS);
  const [seed, setSeed] = useState<number | null>(null);
  // The regime the market ticks mean-revert to (set by sliders and "New regime"); mirrored in `anchor` for the tick loop.
  const [regime, setRegime] = useState<VolParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(false);
  const [idle, setIdle] = useState(true);
  const [hover, setHover] = useState<SurfaceHover | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  const box = useRef<HTMLDivElement>(null);
  // The regime the market ticks mean-revert to: set by sliders and "New regime".
  const anchor = useRef<VolParams>(DEFAULT_PARAMS);
  const rand = useRef(mulberry32(1));
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setNearViewport(true), { rootMargin: "200px" });
    const visible = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    near.observe(el);
    visible.observe(el);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, []);

  const simulating = playing && !reducedMotion && inView && pageVisible;
  useEffect(() => {
    if (!simulating) return;
    const id = setInterval(() => {
      setParams((p) => stepParams(p, anchor.current, TICK_MS / 1000, rand.current));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [simulating]);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const onInteractStart = useCallback(() => {
    clearTimeout(idleTimer.current);
    setIdle(false);
  }, []);
  const onInteractEnd = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  function setParam(key: keyof VolParams, value: number) {
    const nextRegime = { ...regime, [key]: value };
    anchor.current = nextRegime;
    setRegime(nextRegime);
    setParams({ ...params, [key]: value });
  }

  function newRegime() {
    const s = nextSeed(seed);
    const p = randomParams(s);
    rand.current = mulberry32(s);
    anchor.current = p;
    setRegime(p);
    setSeed(s);
    setParams(p);
  }

  const autoRotate = idle && !reducedMotion && inView && pageVisible;

  return (
    <figure className={`@container ${className}`}>
      <div ref={box} className="relative h-[260px] md:h-[340px] lg:h-[clamp(260px,38vh,400px)]">
        {nearViewport ? (
          <VolSurfaceCanvas
            params={params}
            autoRotate={autoRotate}
            label={describeSurface(regime)}
            onHover={setHover}
            onInteractStart={onInteractStart}
            onInteractEnd={onInteractEnd}
          />
        ) : (
          <VolSurfacePoster />
        )}
        {hover ? (
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 bg-bone/90 px-3 py-2 text-caption leading-snug tabular">
            <span className="block font-medium text-navy">σ {(hover.vol * 100).toFixed(1)}%</span>
            <span className="block text-ink-2">K/S {hover.moneyness.toFixed(2)}</span>
            <span className="block text-ink-2">T {hover.maturity.toFixed(2)}y</span>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-5">
        <div className="grid gap-x-6 gap-y-3 @lg:grid-cols-3">
          {sliders.map(({ key, label, step, format }) => {
            const id = `vol-${key}`;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between text-caption">
                  <label htmlFor={id} className="text-ink-2">
                    {label}
                  </label>
                  <output htmlFor={id} className="text-navy tabular">
                    {format(params[key])}
                  </output>
                </div>
                <input
                  id={id}
                  type="range"
                  min={RANGES[key][0]}
                  max={RANGES[key][1]}
                  step={step}
                  value={params[key]}
                  onChange={(e) => setParam(key, Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-navy"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            aria-pressed={playing}
            disabled={reducedMotion}
            onClick={() => setPlaying((p) => !p)}
            className={buttonClasses({ variant: "secondary", className: "cursor-pointer px-5 disabled:cursor-not-allowed disabled:opacity-50" })}
          >
            {playing ? "Pause market" : "Play market"}
          </button>
          <button type="button" onClick={newRegime} className={buttonClasses({ variant: "secondary", className: "cursor-pointer px-5" })}>
            New regime
          </button>
          <p aria-live="polite" className="text-caption text-ink-3 tabular">
            {seed === null ? "Default regime" : `Regime ${seed}`}
          </p>
        </div>
        {reducedMotion ? <p className="mt-2 text-caption text-ink-3">Animation is off because your device prefers reduced motion.</p> : null}

        <p className="mt-4 text-caption text-ink-2">{caption}</p>
        <p className="mt-1 flex items-center gap-2 text-caption text-ink-3">
          <span aria-hidden="true" className="h-2.5 w-10 bg-linear-to-r from-navy/40 to-navy" />
          Low to high implied vol
        </p>
      </figcaption>
    </figure>
  );
}
