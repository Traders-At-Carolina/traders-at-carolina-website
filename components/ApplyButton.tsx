import { Button, type ButtonVariant } from "@/components/Button";
import { site } from "@/content/site";
import type { Recruiting } from "@/content/types";
import { getApplicationState } from "@/lib/applications";

type ApplyButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  label?: string;
  /** Evaluation time; defaults to build time for static pages. */
  now?: Date;
  recruiting?: Recruiting;
  className?: string;
};

/** Resolves where an Apply action goes right now (spec 05 §3). */
export function getApplyTarget(now: Date = new Date(), recruiting: Recruiting = site.recruiting) {
  const state = getApplicationState(now, recruiting);
  return state.status === "open"
    ? { href: recruiting.applyUrl, external: true, state }
    : { href: "/apply", external: false, state };
}

/** Apply button shared by the header, CTA bands and page heroes. */
export function ApplyButton({ variant = "primary", fullWidth, label = "Apply", now, recruiting, className }: ApplyButtonProps) {
  const { href, external } = getApplyTarget(now, recruiting);
  return (
    <Button href={href} external={external} variant={variant} fullWidth={fullWidth} className={className}>
      {label}
    </Button>
  );
}
