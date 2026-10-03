import Link from "next/link";
import type { ReactNode } from "react";
import { type Track, trackAttrs } from "@/lib/analytics/attributes";

/**
 * `light` and `light-outline` are for graphite surfaces, where `surface-graphite` remaps navy to bone and the
 * other variants lose their contrast (the Membership games, 03 §3.7).
 */
export type ButtonVariant = "primary" | "secondary" | "inverse" | "light" | "light-outline";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  /** Opens in a new tab with ↗ (00 §10). */
  external?: boolean;
  /** Trailing → on internal links (external links always show ↗). */
  arrow?: boolean;
  fullWidth?: boolean;
  /** `rounded` (10px corners) is reserved for the header's Apply button (00 §10 SiteHeader) and the Membership games (03 §3.7). */
  shape?: "square" | "rounded";
  /**
   * `compact` trims side padding for tight spots like the mobile header; height stays 44px.
   * `sm` (32px tall) is reserved for the desktop header's Apply button (00 §10 SiteHeader).
   */
  size?: "default" | "compact" | "sm";
  className?: string;
  /** Names the click in analytics (spec 06 §7.1). */
  track?: Track;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-press",
  secondary: "border border-black text-black hover:bg-black hover:text-bone",
  inverse: "bg-bone text-navy hover:bg-white",
  light: "bg-bone text-graphite hover:bg-white",
  "light-outline": "border border-rule-strong text-bone hover:bg-bone hover:text-graphite",
};

const sizes = {
  default: "min-h-11 px-6 py-3",
  compact: "min-h-11 px-4 py-3",
  sm: "min-h-8 px-5 py-1.5",
} as const;

/** Button styling, shared with the few real `<button>` actions (e.g. the hero figure's re-draw). */
export function buttonClasses({
  variant = "primary",
  fullWidth,
  shape = "square",
  size = "default",
  className = "",
}: Pick<ButtonProps, "variant" | "fullWidth" | "shape" | "size" | "className">) {
  return [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-button font-semibold transition-colors duration-150",
    sizes[size],
    variants[variant],
    shape === "rounded" ? "rounded-[0.625rem]" : "",
    fullWidth ? "w-full" : "",
    className,
  ].join(" ");
}

/** Square link-button (00 §10): 44px min height, 12 × 24px padding. */
export function Button({ href, children, variant = "primary", external, arrow, fullWidth, shape, size, className = "", track }: ButtonProps) {
  const classes = buttonClasses({ variant, fullWidth, shape, size, className });
  const tracking = trackAttrs(track);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...tracking}>
        {children}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...tracking}>
      {children}
      {arrow ? <span aria-hidden="true">→</span> : null}
    </Link>
  );
}
