import type { ClubEvent } from "@/content/types";
import type { ApplyAction } from "@/lib/apply";
import type { Viewer } from "@/lib/auth/viewer";

export type PortalSectionKey = "recruiting" | "prep" | "events" | "tracks" | "club" | "learning" | "tools";

/**
 * Section order for whoever is viewing (spec 09 §3). Members get their own resources first and no recruiting
 * timeline; everyone else gets dates and preparation first.
 */
export function portalSections(viewer: Pick<Viewer, "isMember">): PortalSectionKey[] {
  return viewer.isMember
    ? ["learning", "tools", "events", "prep", "tracks", "club"]
    : ["recruiting", "prep", "events", "tracks", "club"];
}

/**
 * Upcoming for this viewer (spec 09 §4.4): recruiting events sit in the recruiting timeline for non-members, so
 * Upcoming leaves them out; members, who see no timeline, get them here.
 */
export function upcomingForViewer(events: ClubEvent[], viewer: Pick<Viewer, "isMember">): ClubEvent[] {
  return viewer.isMember ? events : events.filter((event) => event.type !== "recruiting");
}

/** /apply's action, with on-page anchors (its FAQ or process) pointed back at /apply from the portal (spec 09 §4.2). */
export function portalApplyAction(action: ApplyAction): ApplyAction {
  return action.href.startsWith("#") ? { ...action, href: `/apply${action.href}` } : action;
}
