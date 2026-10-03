import { Button, type ButtonVariant } from "@/components/Button";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
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
  /** Where this Apply sits, for analytics (e.g. "band", "hero"). */
  placement?: string;
  shape?: "square" | "rounded";
};

/** Resolves where an Apply action goes right now (spec 05 §3). */
export function getApplyTarget(now: Date = new Date(), recruiting: Recruiting = site.recruiting) {
  const state = getApplicationState(now, recruiting);
  return state.status === "open"
    ? { href: recruiting.applyUrl, external: true, state }
    : { href: "/apply", external: false, state };
}

/**
 * Apply button shared by CTA bands, page heroes and the Membership games. While open with a deadline it switches to
 * the closed target in the browser at the exact deadline, like the header and footer (spec 05 §3, spec 06 §10).
 */
export function ApplyButton({ variant = "primary", fullWidth, label = "Apply", now, recruiting, className, placement, shape }: ApplyButtonProps) {
  const { href, external, state } = getApplyTarget(now, recruiting);
  const button = (to: string, ext: boolean) => (
    <Button href={to} external={ext} variant={variant} fullWidth={fullWidth} className={className} shape={shape} track={{ cta: "apply", placement }}>
      {label}
    </Button>
  );
  if (state.status === "open" && state.deadline) {
    return <DeadlineSwitch deadline={state.deadline.toISOString()} before={button(href, external)} after={button("/apply", false)} />;
  }
  return button(href, external);
}
