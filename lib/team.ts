import type { Person, Placement, TrackId } from "@/content/types";
import { TRACK_ORDER } from "@/lib/membership";

/** The placements section appears once there are enough firms to be meaningful (spec 04 §4.4). */
export const PLACEMENT_THRESHOLD = 5;

const byOrder = (a: Person, b: Person) => a.order - b.order;

export function execMembers(people: Person[]): Person[] {
  return people.filter((p) => p.group === "exec").sort(byOrder);
}

export type TrackGroup = {
  track: TrackId;
  /** Track-lead cards for this track. */
  leads: Person[];
  /** Exec members who also lead this track; shown as a "Led by" line, not a second card. */
  execLeads: Person[];
};

/** Track leads grouped in the fixed Trading → Research → Development order (spec 04 §4.3). */
export function trackGroups(people: Person[]): TrackGroup[] {
  return TRACK_ORDER.map((track) => ({
    track,
    leads: people.filter((p) => p.group === "track-lead" && p.track === track).sort(byOrder),
    execLeads: people.filter((p) => p.group === "exec" && p.track === track).sort(byOrder),
  }));
}

/** slug → name for everyone who leads a track, used by /membership "Led by" links (spec 04 §5). */
export function trackLeadNames(people: Person[]): Record<string, string> {
  return Object.fromEntries(people.filter((p) => p.track).map((p) => [p.slug, p.name]));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

/** 2027 → "'27" */
export function shortClassYear(year: number): string {
  return `'${String(year).slice(-2)}`;
}

export function showPlacements(placements: Placement[]): boolean {
  return placements.length >= PLACEMENT_THRESHOLD;
}

export function sortFirms(placements: Placement[]): string[] {
  return placements.map((p) => p.firm).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}
