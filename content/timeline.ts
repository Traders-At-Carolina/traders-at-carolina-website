import type { TimelineEntry } from "@/content/types";

/**
 * Club history milestones (docs/specs/02-about.md §5). Any order; the page sorts oldest first.
 * The list on /about appears automatically once there are 3 or more entries.
 * Example: { year: 2021, title: "First mock trading competition", description: "…" }
 */
export const timeline: TimelineEntry[] = [];
