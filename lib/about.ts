import type { AboutContent, Partner, TimelineEntry } from "@/content/types";

/** The milestones list appears only once there are enough entries to read as history (spec 02 §3.3). */
export const MILESTONE_THRESHOLD = 3;

export function sortPartners(partners: Partner[]): Partner[] {
  return [...partners].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export function sortTimeline(timeline: TimelineEntry[]): TimelineEntry[] {
  return [...timeline].sort((a, b) => a.year - b.year);
}

export function showMilestones(timeline: TimelineEntry[]): boolean {
  return timeline.length >= MILESTONE_THRESHOLD;
}

export type AboutSectionKey = "mission" | "story" | "principles" | "partners";

/** Sections that render, in page order. Story and partners need real content (spec 02 §3.3, §3.5). */
export function aboutSectionKeys(about: AboutContent, timeline: TimelineEntry[]): AboutSectionKey[] {
  const keys: AboutSectionKey[] = ["mission"];
  if (about.story.paragraphs.length > 0 || showMilestones(timeline)) keys.push("story");
  keys.push("principles");
  if (about.partners.length > 0 || about.advisors.length > 0) keys.push("partners");
  return keys;
}

/** Home's "Partner firms" stat: an explicit value wins, otherwise the partner list length (spec 02 §5). */
export function resolvePartnerFirms(explicit: number | undefined, partners: Partner[]): number | undefined {
  if (explicit !== undefined) return explicit;
  return partners.length > 0 ? partners.length : undefined;
}
