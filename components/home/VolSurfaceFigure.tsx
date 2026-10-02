"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { viewForChange } from "@/components/home/volSurfaceScene";
import { MARKET_REGIMES, describeSurface, easeInOut, lerpParams, type VolParams } from "@/lib/vol-surface";

// three.js stays out of the initial bundle: the canvas loads after hydration, once the figure is near the viewport.
const VolSurfaceCanvas = dynamic(() => import("@/components/home/VolSurfaceCanvas"), {
  ssr: false,
  loading: () => <VolSurfacePoster />,
});

/** How long each market is held (long enough for the camera to settle on the next view), and the morph length. */
const HOLD_MS = 5000;
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
 * Fig. 1 on Home: a rotatable 3D implied-volatility surface that eases on its own between market
 * regimes (spec 01 §3.1). Deliberately bare: the surface, three axes and a one-line caption.
 */
export function VolSurfaceFigure({ caption, className = "" }: VolSurfaceFigureProps) {
  const [index, setIndex] = useState(0);
  const [params, setParams] = useState<VolParams>(MARKET_REGIMES[0].params);
  const [idle, setIdle] = useState(true);
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
  // During each hold the camera turns to the angle that best shows the change that is coming next.
  const view = viewForChange(regime.params, MARKET_REGIMES[(index + 1) % MARKET_REGIMES.length].params);
  const animateCamera = idle && !reducedMotion && inView && pageVisible;

  return (
    <figure className={className}>
      <div ref={box} className="relative h-[300px] md:h-[420px] lg:h-[clamp(380px,58vh,600px)]">
        {nearViewport ? (
          <VolSurfaceCanvas
            params={params}
            animate={animateCamera}
            view={view}
            label={`${regime.name}. ${describeSurface(regime.params)}`}
            onInteractStart={onInteractStart}
            onInteractEnd={onInteractEnd}
          />
        ) : (
          <VolSurfacePoster />
        )}
      </div>

      <figcaption className="mt-4 text-caption text-ink-3">{caption}</figcaption>
    </figure>
  );
}
