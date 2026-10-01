import { generateWalks } from "@/lib/random-walk";

type RandomWalkProps = {
  seed: number;
  /** 3–5 paths (00 §7.2). */
  paths?: 3 | 4 | 5;
  size: "hero" | "header";
  /** Stroke draw-in on load; disabled automatically under reduced motion. */
  animate?: boolean;
  className?: string;
};

const sizes = {
  hero: { width: 600, height: 320, steps: 64 },
  header: { width: 400, height: 200, steps: 44 },
} as const;

/** Seeded Brownian paths — the site's signature motif. Decorative only. */
export function RandomWalk({ seed, paths = 4, size, animate = true, className = "" }: RandomWalkProps) {
  const { width, height, steps } = sizes[size];
  const walks = generateWalks({ seed, paths, steps, width, height });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`${animate ? "draw-in" : ""} ${className}`}
    >
      {walks.map((d, i) => {
        const primary = i === 0;
        const muted = i % 2 === 1 ? { className: "stroke-navy", opacity: "0.3" } : { className: "stroke-black", opacity: "0.25" };
        return (
          <path
            key={i}
            d={d}
            fill="none"
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={primary ? "stroke-navy" : muted.className}
            strokeWidth={primary ? "1.5" : "1"}
            strokeOpacity={primary ? undefined : muted.opacity}
          />
        );
      })}
    </svg>
  );
}
