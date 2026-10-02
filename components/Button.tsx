import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "inverse";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  /** Opens in a new tab with ↗ (00 §10). */
  external?: boolean;
  /** Trailing → on internal links (external links always show ↗). */
  arrow?: boolean;
  fullWidth?: boolean;
  /** `pill` is reserved for the header's Apply button (00 §10 SiteHeader). */
  shape?: "square" | "pill";
  /** `sm` (36px) is reserved for the desktop header's Apply button (00 §10 SiteHeader). */
  size?: "md" | "sm";
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-press",
  secondary: "border border-black text-black hover:bg-black hover:text-bone",
  inverse: "bg-bone text-navy hover:bg-white",
};

const sizes = {
  md: "min-h-11 px-6 py-3",
  sm: "min-h-9 px-5 py-2",
} as const;

/** Square link-button (00 §10): 44px min height, 12 × 24px padding. */
export function Button({
  href,
  children,
  variant = "primary",
  external,
  arrow,
  fullWidth,
  shape = "square",
  size = "md",
  className = "",
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-button font-semibold transition-colors duration-150",
    sizes[size],
    variants[variant],
    shape === "pill" ? "rounded-full" : "",
    fullWidth ? "w-full" : "",
    className,
  ].join(" ");

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
      {arrow ? <span aria-hidden="true">→</span> : null}
    </Link>
  );
}
