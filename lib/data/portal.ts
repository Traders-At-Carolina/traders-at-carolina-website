import { events as contentEvents } from "@/content/events";
import { site } from "@/content/site";
import type { ClubEvent, Recruiting, TrackId } from "@/content/types";
import { upcomingEvents } from "@/lib/events";
import { canSee, type AudienceViewer } from "@/lib/members/audience";

/**
 * Portal getters (spec 06 §8). Uncached and per viewer; every one filters with canSee on the server.
 *
 * INTERIM bodies until spec 06 phases 4, 6 and 7 add the tables: events come from content/events.ts, recruiting from
 * content/site.ts, the internship tracker from a server-only environment variable, and everything else is empty.
 * Those phases replace the bodies; the signatures and return types stay, so the portal needs no changes.
 */

export type ResourceKind = "slides" | "notes" | "textbook" | "problem-set" | "video" | "link";
export type ResourceSection = "learning" | "interview-prep" | "recruiting" | "other";

/** A resource as the portal shows it. `href` is the url, or /portal/files/{id} for an uploaded file (spec 06 §8). */
export type PortalResource = {
  id: string;
  title: string;
  kind: ResourceKind;
  /** Empty means all tracks. */
  tracks: TrackId[];
  description?: string;
  href: string;
  pinned: boolean;
};

export type PortalAnnouncement = { id: string; title: string; /** Inline markdown: [links](/path) and *em*. */ body: string; pinned: boolean };
export type PortalLink = { id: string; label: string; url: string; description?: string };
export type PortalSettings = { welcomeMember?: string; welcomeVisitor?: string; acceptRequests: boolean };
export type AccessRequest = { status: "pending" | "approved" | "declined" };
export type RecruitingTimeline = { recruiting: Recruiting; events: ClubEvent[] };

export const NO_RESOURCES: Record<ResourceSection, PortalResource[]> = { learning: [], "interview-prep": [], recruiting: [], other: [] };

/** Upcoming events the viewer may see, soonest first. Competitions are `type === "competition"`. */
export async function portalEvents(viewer: AudienceViewer, now: Date = new Date()): Promise<ClubEvent[]> {
  return upcomingEvents(
    contentEvents.filter((event) => canSee(event.audience, viewer)),
    now,
  );
}

/** Visible resources grouped by section, pinned first. Interim: none until phase 7. */
export async function portalResources(viewer: AudienceViewer): Promise<Record<ResourceSection, PortalResource[]>> {
  void viewer;
  return NO_RESOURCES;
}

/** Announcements within their dates, pinned first, newest first. Interim: none until phase 7. */
export async function portalAnnouncements(viewer: AudienceViewer): Promise<PortalAnnouncement[]> {
  void viewer;
  return [];
}

/**
 * Member links in admin order. Interim until phase 7: the internship tracker alone, from INTERNSHIP_TRACKER_URL
 * (https only, never committed; the repository is public), members only.
 */
export async function portalLinks(viewer: AudienceViewer, env: Record<string, string | undefined> = process.env): Promise<PortalLink[]> {
  const tracker = env.INTERNSHIP_TRACKER_URL?.trim();
  if (!tracker || !/^https:\/\//.test(tracker) || !canSee("members", viewer)) return [];
  return [
    {
      id: "internship-tracker",
      label: "Internship tracker",
      url: tracker,
      description: "A community-run spreadsheet of where members are applying, interviewing and landing. Add your own as you go.",
    },
  ];
}

/**
 * Welcome lines and the request toggle. Interim: no custom welcome lines, and requests stay off until phase 4 has
 * somewhere to keep them (spec 06's default is on).
 */
export async function portalSettings(): Promise<PortalSettings> {
  return { acceptRequests: false };
}

/** Recruiting settings plus upcoming `recruiting` events, for the non-member timeline. Interim: content files. */
export async function recruitingTimeline(now: Date = new Date()): Promise<RecruitingTimeline> {
  return {
    recruiting: site.recruiting,
    events: upcomingEvents(
      contentEvents.filter((event) => event.type === "recruiting" && canSee(event.audience, "signed_in")),
      now,
    ),
  };
}

/** The viewer's latest access request, if any. Interim: none until phase 4. */
export async function myRequest(userId: string): Promise<AccessRequest | null> {
  void userId;
  return null;
}
