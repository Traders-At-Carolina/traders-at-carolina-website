import { LoaderCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ui-accent text-white shadow-ui-card hover:bg-ui-accent-hover",
  secondary: "border border-ui-border bg-ui-surface text-ui-text shadow-ui-card hover:border-ui-border-strong hover:bg-ui-subtle",
  ghost: "text-ui-text-2 hover:bg-ui-subtle hover:text-ui-text",
  danger: "bg-ui-danger text-white shadow-ui-card hover:bg-[color-mix(in_oklab,var(--color-ui-danger)_88%,black)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-ui-label",
  md: "h-9 gap-2 px-3.5 text-ui-base",
};

/** Console button classes (spec 11 §4); also used by links that look like buttons. */
export function buttonClasses({ variant = "secondary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cx(
    "inline-flex shrink-0 items-center justify-center rounded-ui-md font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; icon?: LucideIcon; children?: ReactNode };

export function Button({
  variant,
  size,
  icon: Icon,
  pending = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Common & { pending?: boolean } & ComponentProps<"button">) {
  return (
    <button type={type} disabled={disabled || pending} aria-busy={pending || undefined} className={buttonClasses({ variant, size, className })} {...props}>
      {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : Icon ? <Icon aria-hidden className="size-4" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, icon: Icon, className, children, ...props }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {Icon ? <Icon aria-hidden className="size-4" strokeWidth={2} /> : null}
      {children}
    </Link>
  );
}
