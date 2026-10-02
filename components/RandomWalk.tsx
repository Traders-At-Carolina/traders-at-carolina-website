import { generateWalks } from "@/lib/random-walk";

type RandomWalkProps = {
  seed: number;
  /** 3–5 paths (00 §7.2). */
  paths?: 3 | 4 | 5;
  size: "hero" | "header";
  /** "up" starts low and drifts up and to the right, like a rising equity curve. */
  trend?: "up";
  /** Stroke draw-in on load; disabled automatically under reduced motion. */
  animate?: boolean;
  className?: string;
};

const sizes = {
  hero: { width: 600, height: 320, steps: 64 },
  header: { width: 400, height: 200, steps: 44 },
} as const;

/** Origin, σ and drift for an upward walk; the origin sits low so the climb has room. */
const upward = { originRatio: 0.8, sigmaRatio: 0.03, driftRatio: 0.013, leadDriftRatio: 0.016 } as const;

/** Stroke for path `i`: the first is solid navy, the rest alternate muted navy and black (00 §7.2). */
export function walkStroke(i: number) {
  if (i === 0) return { className: "stroke-navy", strokeWidth: "1.5", strokeOpacity: undefined };
  return i % 2 === 1
    ? { className: "stroke-navy", strokeWidth: "1", strokeOpacity: "0.3" }
    : { className: "stroke-black", strokeWidth: "1", strokeOpacity: "0.25" };
}

/** Seeded Brownian paths — the site's signature motif. Decorative only. */
export function RandomWalk({ seed, paths = 4, size, animate = true, trend, className = "" }: RandomWalkProps) {
  const { width, height, steps } = sizes[size];
  const walks = generateWalks({ seed, paths, steps, width, height, ...(trend === "up" ? upward : {}) });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`${animate ? "draw-in" : ""} ${className}`}
    >
      {walks.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          {...walkStroke(i)}
        />
      ))}
    </svg>
  );
}
