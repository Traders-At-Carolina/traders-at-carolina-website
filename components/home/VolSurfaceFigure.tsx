"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SurfaceHover } from "@/components/home/VolSurfaceCanvas";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { MARKET_REGIMES, describeSurface, easeInOut, lerpParams, type VolParams } from "@/lib/vol-surface";

// three.js stays out of the initial bundle: the canvas loads after hydration, once the figure is near the viewport.
const VolSurfaceCanvas = dynamic(() => import("@/components/home/VolSurfaceCanvas"), {
  ssr: false,
  loading: () => <VolSurfacePoster />,
});

/** How long each market is held, and how long the surface takes to morph into the next. */
const HOLD_MS = 4500;
const MORPH_MS = 2600;
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

type VolSurfaceFigureProps = {
  caption: string;
  className?: string;
};

/**
 * Fig. 1 on Home: a rotatable 3D implied-volatility surface that moves on its own through a cycle of
 * market regimes, holding each and easing smoothly into the next (spec 01 §3.1).
 */
export function VolSurfaceFigure({ caption, className = "" }: VolSurfaceFigureProps) {
  const [index, setIndex] = useState(0);
  const [params, setParams] = useState<VolParams>(MARKET_REGIMES[0].params);
  const [idle, setIdle] = useState(true);
  const [hover, setHover] = useState<SurfaceHover | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  const box = useRef<HTMLDivElement>(null);
  const current = useRef<VolParams>(MARKET_REGIMES[0].params);
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

  // Hold the current market, then morph to the next one. Pauses offscreen, in hidden tabs and under reduced motion;
  // a paused morph resumes from wherever the surface stopped.
  const cycling = !reducedMotion && inView && pageVisible;
  useEffect(() => {
    if (!cycling) return;
    const nextIndex = (index + 1) % MARKET_REGIMES.length;
    const from = current.current;
    const to = MARKET_REGIMES[nextIndex].params;
    let frame = 0;
    let start = 0;

    const morph = (now: number) => {
      start ||= now;
      const t = Math.min(1, (now - start) / MORPH_MS);
      const p = lerpParams(from, to, easeInOut(t));
      current.current = p;
      setParams(p);
      if (t < 1) frame = requestAnimationFrame(morph);
      else setIndex(nextIndex);
    };
    const hold = setTimeout(() => {
      frame = requestAnimationFrame(morph);
    }, HOLD_MS);

    return () => {
      clearTimeout(hold);
      cancelAnimationFrame(frame);
    };
  }, [cycling, index]);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const onInteractStart = useCallback(() => {
    clearTimeout(idleTimer.current);
    setIdle(false);
  }, []);
  const onInteractEnd = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  const regime = MARKET_REGIMES[index];
  const autoRotate = idle && !reducedMotion && inView && pageVisible;

  return (
    <figure className={`@container ${className}`}>
      <div ref={box} className="relative h-[260px] md:h-[340px] lg:h-[clamp(300px,46vh,460px)]">
        {nearViewport ? (
          <VolSurfaceCanvas
            params={params}
            autoRotate={autoRotate}
            label={`${regime.name}. ${describeSurface(regime.params)}`}
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
        <ol aria-label="Market regimes" className="flex gap-1.5">
          {MARKET_REGIMES.map((r, i) => (
            <li key={r.name} title={r.name} className={`size-2 transition-colors duration-500 ${i === index ? "bg-navy" : "bg-navy/20"}`}>
              <span className="sr-only">
                {r.name}
                {i === index ? " (showing)" : ""}
              </span>
            </li>
          ))}
        </ol>
        {/* Two lines reserved so notes of different lengths never shift the caption below. */}
        <p className="mt-2 min-h-[3em] text-caption">
          <span className="font-medium text-navy">{regime.name}</span>
          <span className="text-ink-3"> — {regime.note}</span>
        </p>
        {reducedMotion ? <p className="mt-2 text-caption text-ink-3">Showing one market because your device prefers reduced motion.</p> : null}

        <p className="mt-3 text-caption text-ink-2">{caption}</p>
        <p className="mt-1 flex items-center gap-2 text-caption text-ink-3">
          <span aria-hidden="true" className="h-2.5 w-10 bg-linear-to-r from-navy/40 to-navy" />
          Low to high implied vol
        </p>
      </figcaption>
    </figure>
  );
}
