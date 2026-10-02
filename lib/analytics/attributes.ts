/**
 * Names a click for analytics (spec 06 §7.1): `cta` is the action, `placement` where it sits, `target` the specific item.
 * PostHog autocapture copies these onto the click event, so reports read "apply · header" instead of raw element text.
 */
export type Track = { cta: string; placement?: string; target?: string };

const PREFIX = "data-ph-capture-attribute-";

/** Plain data attributes: no client JS, so they work in server components. */
export function trackAttrs(track?: Track): Record<string, string> {
  if (!track) return {};
  const attrs: Record<string, string> = { [`${PREFIX}cta`]: track.cta };
  if (track.placement) attrs[`${PREFIX}placement`] = track.placement;
  if (track.target) attrs[`${PREFIX}target`] = track.target;
  return attrs;
}

/** "Get notified" → "get-notified": a stable cta name for actions whose label depends on recruiting state. */
export function ctaFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
