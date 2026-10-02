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
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-press",
  secondary: "border border-black text-black hover:bg-black hover:text-bone",
  inverse: "bg-bone text-navy hover:bg-white",
};

/** Button styling, shared with the few real `<button>` actions (e.g. the hero figure's re-draw). */
export function buttonClasses({ variant = "primary", fullWidth, className = "" }: Pick<ButtonProps, "variant" | "fullWidth" | "className">) {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-button font-semibold transition-colors duration-150",
    variants[variant],
    fullWidth ? "w-full" : "",
    className,
  ].join(" ");
}

/** Square link-button (00 §10): 44px min height, 12 × 24px padding. */
export function Button({ href, children, variant = "primary", external, arrow, fullWidth, className = "" }: ButtonProps) {
  const classes = buttonClasses({ variant, fullWidth, className });

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
