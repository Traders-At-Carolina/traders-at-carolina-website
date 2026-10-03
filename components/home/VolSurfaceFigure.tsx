"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BitSurface } from "@/components/home/BitSurface";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MARKET_REGIMES, describeSurface, easeInOut, impliedVol, lerpParams, type VolParams } from "@/lib/vol-surface";

/** How long each market is held, and how long the surface takes to morph into the next. */
const HOLD_MS = 5000;
const MORPH_MS = 2600;
const IDLE_MS = 1500;

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

const pct = (v: number) => (v * 100).toFixed(1);

/**
 * Live numbers for the surface on screen, recomputed every frame of a morph: ATM vol at 3M, 1Y and 2Y (the term
 * structure) and 1Y skew as the vol spread between the 90% and 110% strikes. Sits under the plot on a hairline, like
 * the data line of a printed figure. Decorative duplicate of the figure's label, so hidden from assistive tech.
 */
function Readout({ name, params }: { name: string; params: VolParams }) {
  const atm = [0.25, 1, 2].map((T) => pct(impliedVol(0, T, params)));
  const skew = (impliedVol(Math.log(0.9), 1, params) - impliedVol(Math.log(1.1), 1, params)) * 100;
  return (
    <div aria-hidden="true" className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule pt-3 text-caption tabular">
      <p className="font-medium text-navy">{name}</p>
      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-ink-3">
        <div className="flex gap-2">
          <dt>ATM 3M / 1Y / 2Y</dt>
          <dd className="text-ink-2">
            {atm.join(" / ")}%
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>1Y skew 90–110</dt>
          <dd className="text-ink-2">
            {skew < 0 ? "−" : "+"}
            {Math.abs(skew).toFixed(1)} pts
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Fig. 1 on Home: a rotatable 3D implied-volatility surface drawn in 1s and 0s that eases on its own between market
 * regimes (spec 01 §3.1). Deliberately bare: the surface, its axes and the live readout under it; no caption.
 */
export function VolSurfaceFigure({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [params, setParams] = useState<VolParams>(MARKET_REGIMES[0].params);
  const [idle, setIdle] = useState(true);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  const box = useRef<HTMLDivElement>(null);
  const current = useRef<VolParams>(MARKET_REGIMES[0].params);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const visible = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    visible.observe(el);
    return () => visible.disconnect();
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
  const animateCamera = idle && !reducedMotion && inView && pageVisible;

  return (
    <figure className={className}>
      <div ref={box} className="relative h-[300px] md:h-[420px] lg:h-[clamp(380px,58vh,600px)]">
        <BitSurface
          params={params}
          animate={animateCamera}
          label={`${regime.name}. ${describeSurface(regime.params)}`}
          onInteractStart={onInteractStart}
          onInteractEnd={onInteractEnd}
        />
      </div>

      <Readout name={regime.name} params={params} />
    </figure>
  );
}
