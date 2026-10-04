import { asc, desc, eq } from "drizzle-orm";
import type { ClubEvent, Recruiting, TrackId } from "@/content/types";
import { announcementStatus } from "@/lib/admin/portal-schemas";
import { getEvents, getRecruiting, missingTable, offline } from "@/lib/data/public";
import { db } from "@/lib/db/client";
import { announcements, membershipRequests, portalLinks as portalLinksTable, resources } from "@/lib/db/schema";
import { upcomingEvents } from "@/lib/events";
import { canSee, type AudienceViewer } from "@/lib/members/audience";
import { readPortalSetting } from "@/lib/members/settings";

/**
 * Portal getters (spec 06 §8). Uncached and per viewer; every one filters with canSee on the server, so nothing
 * members-only reaches a non-member's browser. Admin saves need no cache tag: the next portal load reads them.
 *
 * Without a database in local development (as lib/data/public.ts does) resources and announcements are empty, links
 * fall back to INTERNSHIP_TRACKER_URL and settings to their defaults. A table not yet migrated reads as empty.
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
    (await getEvents()).filter((event) => canSee(event.audience, viewer)),
    now,
  );
}

/** Rows from a portal table, or null without a database (local development) or before the table is migrated. */
async function portalRows<T>(table: string, query: () => Promise<T[]>): Promise<T[] | null> {
  if (offline()) return null;
  try {
    return await query();
  } catch (error) {
    // Preview builds share the production database, which migrates only on production deploys.
    if (!missingTable(error)) throw error;
    console.warn(`${table} table not migrated yet; the portal shows none`);
    return null;
  }
}

/**
 * Visible resources grouped by section, pinned first, then by order. Hidden ones never leave the server. `href` is the
 * link, or /portal/files/{id} for an uploaded file; the private Blob pathname is never returned (spec 06 §8).
 */
export async function portalResources(viewer: AudienceViewer): Promise<Record<ResourceSection, PortalResource[]>> {
  const rows = await portalRows("resources", () =>
    db().select().from(resources).where(eq(resources.hidden, false)).orderBy(desc(resources.pinned), asc(resources.sortOrder), asc(resources.title)),
  );
  if (!rows) return NO_RESOURCES;
  const grouped: Record<ResourceSection, PortalResource[]> = { learning: [], "interview-prep": [], recruiting: [], other: [] };
  for (const r of rows) {
    if (r.hidden || !canSee(r.audience, viewer)) continue;
    const href = r.file ? `/portal/files/${r.id}` : r.url;
    if (!href) continue;
    grouped[r.section].push({
      id: r.id,
      title: r.title,
      kind: r.kind,
      tracks: r.tracks,
      ...(r.description ? { description: r.description } : {}),
      href,
      pinned: r.pinned,
    });
  }
  return grouped;
}

/** Announcements within their dates, pinned first, then newest first. */
export async function portalAnnouncements(viewer: AudienceViewer, now: Date = new Date()): Promise<PortalAnnouncement[]> {
  const rows = await portalRows("announcements", () => db().select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt)));
  if (!rows) return [];
  return rows
    .filter((a) => canSee(a.audience, viewer) && announcementStatus(a, now) === "live")
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((a) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned }));
}

/**
 * The spec 09 interim link: the internship tracker from INTERNSHIP_TRACKER_URL (https only, never committed; the
 * repository is public), members only.
 */
function trackerFromEnv(viewer: AudienceViewer, env: Record<string, string | undefined>): PortalLink[] {
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
 * Member links in admin order, from /admin/portal. Until an admin adds the first one (or without a database), the
 * interim tracker link from `env` still shows, so nothing disappears at the cut-over. Once any link exists, only the
 * admin's links show.
 */
export async function portalLinks(viewer: AudienceViewer, env: Record<string, string | undefined> = process.env): Promise<PortalLink[]> {
  const rows = await portalRows("portal_links", () => db().select().from(portalLinksTable).orderBy(asc(portalLinksTable.sortOrder), asc(portalLinksTable.label)));
  if (!rows || rows.length === 0) return trackerFromEnv(viewer, env);
  return rows
    .filter((l) => canSee(l.audience, viewer))
    .map((l) => ({ id: l.id, label: l.label, url: l.url, ...(l.description ? { description: l.description } : {}) }));
}

/** Welcome lines and the request toggle, from the `portal` setting (spec 06 §5.2); the defaults until first saved. */
export async function portalSettings(): Promise<PortalSettings> {
  const { acceptRequests, welcomeMember, welcomeVisitor } = await readPortalSetting();
  return { acceptRequests, ...(welcomeMember ? { welcomeMember } : {}), ...(welcomeVisitor ? { welcomeVisitor } : {}) };
}

/** Recruiting settings plus upcoming `recruiting` events, for the non-member timeline. Interim: content files. */
export async function recruitingTimeline(now: Date = new Date()): Promise<RecruitingTimeline> {
  return {
    recruiting: await getRecruiting(),
    events: upcomingEvents(
      (await getEvents()).filter((event) => event.type === "recruiting" && canSee(event.audience, "signed_in")),
      now,
    ),
  };
}

/** The viewer's latest access request, if any (spec 06 §8). */
export async function myRequest(userId: string): Promise<AccessRequest | null> {
  const [row] = await db()
    .select({ status: membershipRequests.status })
    .from(membershipRequests)
    .where(eq(membershipRequests.userId, userId))
    .orderBy(desc(membershipRequests.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * An uploaded resource file the viewer may open (spec 06 §8 Files), or null. Null covers every refusal alike (no such
 * resource, hidden, a link rather than a file, or not for this viewer), so the file route can answer them all with
 * the same 404 and never reveal that a file exists.
 */
export async function portalFile(id: string, viewer: AudienceViewer): Promise<{ title: string; file: { pathname: string; size: number; contentType: string } } | null> {
  const rows = await portalRows("resources", () =>
    db().select({ title: resources.title, file: resources.file, hidden: resources.hidden, audience: resources.audience }).from(resources).where(eq(resources.id, id)).limit(1),
  );
  const row = rows?.[0];
  if (!row || row.hidden || !row.file || !canSee(row.audience, viewer)) return null;
  return { title: row.title, file: row.file };
}
