"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { buttonClasses } from "@/components/Button";
import { walkStroke } from "@/components/RandomWalk";
import { envelopePath, generateWalkPoints, standardizedValue, toPathData, type Point } from "@/lib/random-walk";

/** Plot box for the hero figure. The origin is centred so the ±σ√t band still fits at the last step. */
const box = { steps: 96, width: 1200, height: 400, originRatio: 0.5, sigmaRatio: 0.042 } as const;
const PATHS = 5;
/** Server render and first client render share this seed, so hydration matches. */
export const INITIAL_SEED = 2026;

const envelope = envelopePath(box);
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

function formatSigma(value: number) {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(2)}σ`;
}

function nextSeed(current: number) {
  let seed = current;
  while (seed === current) seed = 1000 + Math.floor(Math.random() * 9000);
  return seed;
}

type HeroFigureProps = {
  caption: string;
  className?: string;
};

/** Fig. 1 on Home: seeded random walks with mean and ±σ√t band, re-drawable and scrubbable (spec 01 §3.1). */
export function HeroFigure({ caption, className = "" }: HeroFigureProps) {
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [step, setStep] = useState<number | null>(null);
  const frame = useRef(0);
  const walks = useMemo(() => generateWalkPoints({ seed, paths: PATHS, ...box }), [seed]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // The crosshair is a fine-pointer enhancement; touch only gets the re-draw button.
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setStep(Math.min(box.steps, Math.max(0, Math.round(ratio * box.steps))));
    });
  }

  function onPointerLeave() {
    cancelAnimationFrame(frame.current);
    setStep(null);
  }

  return (
    <figure className={className}>
      <div
        className="relative h-[200px] border-b border-l border-rule-strong md:h-[280px] lg:h-[clamp(220px,34vh,400px)]"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          className="envelope-in absolute inset-0 h-full w-full"
        >
          <path d={envelope} className="fill-navy" fillOpacity="0.045" />
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-navy/40" />
        <span aria-hidden="true" className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2 text-caption text-ink-3 tabular">
          0
        </span>

        <svg
          key={seed}
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          className="draw-in absolute inset-0 h-full w-full overflow-visible"
        >
          {walks.map((points, i) => (
            <path
              key={i}
              d={toPathData(points)}
              fill="none"
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              {...walkStroke(i)}
            />
          ))}
        </svg>

        {step !== null ? <Crosshair step={step} walks={walks} /> : null}
      </div>

      <figcaption className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-[46rem]">
          <p className="text-caption text-ink-2">{caption}</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-caption text-ink-3">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-[1.5px] w-5 bg-navy" />
              Sample paths
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="w-5 border-t border-dashed border-navy/60" />
              Mean, E[X] = 0
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-5 bg-navy/8" />
              ±σ√t band
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-5 md:shrink-0">
          <p aria-live="polite" className="text-caption text-ink-3 tabular">
            Seed {seed}
          </p>
          <button
            type="button"
            onClick={() => setSeed(nextSeed(seed))}
            className={buttonClasses({ variant: "secondary", className: "flex-1 cursor-pointer md:flex-none" })}
          >
            Draw new paths
          </button>
        </div>
      </figcaption>
    </figure>
  );
}

/** Vertical hairline at the hovered step, a marker on each path and a small σ readout. Decorative. */
function Crosshair({ step, walks }: { step: number; walks: Point[][] }) {
  const left = pct(step, box.steps);
  const values = walks.map((points) => standardizedValue(points[step][1], box));
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const flip = step > box.steps * 0.72;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-y-0 w-px bg-navy" style={{ left }} />
      {walks.map((points, i) => (
        <span
          key={i}
          className={`absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ${i === 0 ? "bg-navy" : "bg-ink-3"}`}
          style={{ left, top: pct(points[step][1], box.height) }}
        />
      ))}
      <div
        className={`absolute top-3 bg-bone/90 px-3 py-2 text-caption leading-snug whitespace-nowrap tabular ${flip ? "-ml-3 -translate-x-full" : "ml-3"}`}
        style={{ left }}
      >
        {/* Spans, not <p>: the base `p { text-wrap: pretty }` would undo nowrap. */}
        <span className="block font-medium text-navy">t = {step}</span>
        <span className="block text-ink-2">Path 1 {formatSigma(values[0])}</span>
        <span className="block text-ink-2">Mean {formatSigma(mean)}</span>
        <span className="block text-ink-3">Band ±{Math.sqrt(step).toFixed(2)}σ</span>
      </div>
    </div>
  );
}
