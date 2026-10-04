import type { Recruiting } from "@/content/types";
import { listPeople } from "@/lib/admin/lists-db";
import { pendingRequests } from "@/lib/admin/members-db";
import { listPhotos } from "@/lib/admin/photos-db";
import { listEvents } from "@/lib/admin/settings-db";
import { getRecruiting } from "@/lib/data/public";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { HOME_INSIDE_MIN_PHOTOS, MIN_HEADSHOT_WIDTH, MIN_PHOTO_WIDTH, STALE_REQUEST_DAYS } from "@/lib/thresholds";

/** One thing on the Overview's "Needs attention" list, linking to the screen that fixes it (spec 11 §5.3). */
export type HealthIssue = { id: string; tone: "warning" | "danger"; message: string; href: string };

type Image = { width: number } | null;

export type HealthInput = {
  people?: Array<{ id: string; name: string; group: string; visible: boolean; headshot: Image }>;
  photos?: Array<{ id: string; caption: string | null; image: Image; homeOrder: number | null; membershipOrder: number | null }>;
  events?: Array<{ id: string; title: string; startsAt: string; endsAt: string | null; featured: boolean }>;
  recruiting?: Recruiting;
  requests?: Array<{ createdAt: Date }>;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The checks themselves, pure so they're testable. A missing source (its query failed) skips only its own checks.
 * Officers count only where Team shows them: visible and not a track lead.
 */
export function computeHealth(input: HealthInput, now = new Date()): HealthIssue[] {
  const issues: HealthIssue[] = [];

  if (input.people) {
    const shown = input.people.filter((p) => p.visible && p.group !== "track-lead");
    const missing = shown.filter((p) => !p.headshot);
    if (missing.length === 1) issues.push({ id: "headshot-missing", tone: "warning", message: `${missing[0].name} has no headshot on the Team page`, href: `/admin/officers/${missing[0].id}` });
    else if (missing.length > 1) issues.push({ id: "headshot-missing", tone: "warning", message: `${plural(missing.length, "visible officer")} have no headshot`, href: "/admin/officers" });
    for (const p of shown) {
      if (p.headshot && p.headshot.width < MIN_HEADSHOT_WIDTH) {
        issues.push({ id: `headshot-small-${p.id}`, tone: "warning", message: `Headshot for ${p.name} is ${p.headshot.width}px wide (needs ${MIN_HEADSHOT_WIDTH}px)`, href: `/admin/officers/${p.id}` });
      }
    }
  }

  if (input.photos) {
    const onHome = input.photos.filter((p) => p.homeOrder != null).length;
    if (onHome < HOME_INSIDE_MIN_PHOTOS) {
      issues.push({ id: "home-photos", tone: "warning", message: `Home's “Inside the club” needs ${HOME_INSIDE_MIN_PHOTOS} photos (has ${onHome}), so it's hidden`, href: "/admin/photos" });
    }
    for (const p of input.photos) {
      if ((p.homeOrder != null || p.membershipOrder != null) && p.image && p.image.width < MIN_PHOTO_WIDTH) {
        issues.push({ id: `photo-small-${p.id}`, tone: "warning", message: `${p.caption ? `“${p.caption}”` : "A page photo"} is ${p.image.width}px wide (needs ${MIN_PHOTO_WIDTH}px)`, href: `/admin/photos/${p.id}` });
      }
    }
  }

  if (input.events) {
    for (const e of input.events) {
      if (!e.featured) continue;
      const ends = parseEasternDateTime(e.endsAt ?? e.startsAt);
      if (ends.getTime() < now.getTime()) issues.push({ id: `event-featured-${e.id}`, tone: "warning", message: `“${e.title}” has ended but is still featured`, href: `/admin/events/${e.id}` });
    }
  }

  const r = input.recruiting;
  if (r?.mode === "open" && r.applyDeadline && parseEasternDateTime(r.applyDeadline.length === 10 ? `${r.applyDeadline}T23:59` : r.applyDeadline).getTime() < now.getTime()) {
    issues.push({ id: "recruiting-overdue", tone: "danger", message: "Recruiting is set to Open but its deadline has passed, so the site shows it closed", href: "/admin/recruiting" });
  }

  if (input.requests) {
    const cutoff = now.getTime() - STALE_REQUEST_DAYS * 24 * 60 * 60 * 1000;
    const stale = input.requests.filter((q) => q.createdAt.getTime() < cutoff).length;
    if (stale > 0) issues.push({ id: "requests-stale", tone: "warning", message: `${plural(stale, "access request")} ${stale === 1 ? "has" : "have"} waited more than ${STALE_REQUEST_DAYS} days`, href: "/admin/members?tab=requests" });
  }

  return issues;
}

const settle = <T>(p: Promise<T>) => p.then((v) => v, () => undefined);

/** Loads every source in parallel; each failure only drops its own checks. */
export async function healthChecks(now = new Date()): Promise<HealthIssue[]> {
  const [people, photos, events, recruiting, requests] = await Promise.all([settle(listPeople()), settle(listPhotos()), settle(listEvents()), settle(getRecruiting()), settle(pendingRequests())]);
  return computeHealth({ people, photos, events, recruiting, requests }, now);
}
