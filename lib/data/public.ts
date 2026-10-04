import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { about } from "@/content/about";
import { events as contentEvents } from "@/content/events";
import { home } from "@/content/home";
import { membership } from "@/content/membership";
import { placementWall } from "@/content/placement-wall";
import { placements as contentPlacements } from "@/content/placements";
import { site } from "@/content/site";
import { team } from "@/content/team";
import type { ClubEvent, CompanyMark, HomePhoto, MembershipContent, Partner, Person, Placement, Recruiting } from "@/content/types";
import { db } from "@/lib/db/client";
import { events, members, people, photos, placements, settings, sponsors, tracks } from "@/lib/db/schema";

/**
 * Cached reads for the public pages (spec 06 §3 Read path). Each getter carries its collection's tag; admin saves call
 * updateTag(tag), so the next visitor gets fresh content while pages stay statically generated.
 * Public pages must read editable content only through this module, or saves won't reach them.
 */
export const TAGS = {
  photos: "photos",
  sponsors: "sponsors",
  placements: "placements",
  people: "people",
  tracks: "tracks",
  season: "season",
  recruiting: "recruiting",
  events: "events",
  members: "members",
} as const;

/**
 * Backstop for time-driven content (spec 06 §3 Scheduled changes): pages that show recruiting or events regenerate at
 * least this often, so a scheduled opening, a passed deadline or an ended event takes effect without a save.
 */
export const SCHEDULED_REVALIDATE = 300;

/** Bump when a getter's output shape changes: unstable_cache keeps entries across deployments. */
const VERSION = "v1";

/** Local development without a database falls back to content/*.ts. Production never does (spec 06 §3). */
export const offline = () => !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";

/** Postgres "undefined_table" (42P01), raised directly or as the cause of a Drizzle query error. */
export function missingTable(error: unknown): boolean {
  const codes = [error, (error as { cause?: unknown })?.cause].map((e) => (e as { code?: unknown } | null)?.code);
  return codes.includes("42P01");
}

type PhotoRow = typeof photos.$inferSelect;

const toHomePhoto = (row: PhotoRow): HomePhoto => ({ src: row.image, alt: row.alt, caption: row.caption, ratio: row.ratio });

const slotted = (column: typeof photos.homeOrder | typeof photos.membershipOrder) =>
  db().select().from(photos).where(isNotNull(column)).orderBy(asc(column));

/** Home "Inside the club", in slot order (01 §6). */
export const getHomePhotos = unstable_cache(
  async (): Promise<HomePhoto[]> => (offline() ? home.photos : (await slotted(photos.homeOrder)).map(toHomePhoto)),
  ["home-photos", VERSION],
  { tags: [TAGS.photos] },
);

/** Membership photo bands: slot 1 runs wide, slots 2–3 pair after Activities (03). */
export const getMembershipPhotos = unstable_cache(
  async (): Promise<HomePhoto[]> => (offline() ? (membership.photos ?? []) : (await slotted(photos.membershipOrder)).map(toHomePhoto)),
  ["membership-photos", VERSION],
  { tags: [TAGS.photos] },
);

// ── Phase 5: sponsors, placements, officers, tracks, season ──

const TRACK_ORDER = ["trading", "research", "development"] as const;

/** Sponsors (02 §5), for About and Home. Order is alphabetical at render (sortPartners). */
export const getSponsors = unstable_cache(
  async (): Promise<Partner[]> => {
    if (offline()) return about.partners;
    const rows = await db().select().from(sponsors).orderBy(asc(sponsors.name));
    return rows.map((r) => ({
      name: r.name,
      ...(r.relationship ? { relationship: r.relationship } : {}),
      ...(r.url ? { url: r.url } : {}),
      ...(r.logo ? { logo: r.logo } : {}),
    }));
  },
  ["sponsors", VERSION],
  { tags: [TAGS.sponsors] },
);

/** Every placement firm (the Team list) and the wall's marks in order (Team header strip, footer strip). */
export const getPlacements = unstable_cache(
  async (): Promise<{ firms: Placement[]; wall: CompanyMark[] }> => {
    if (offline()) return { firms: contentPlacements, wall: placementWall };
    const rows = await db().select().from(placements).orderBy(asc(placements.wallOrder), asc(placements.firm));
    return {
      firms: rows.map((r) => ({ firm: r.firm })),
      wall: rows.filter((r) => r.showOnWall && r.logo).map((r) => ({ name: r.firm, logo: r.logo! })),
    };
  },
  ["placements", VERSION],
  { tags: [TAGS.placements] },
);

/** `season` settings (spec 06 §5.2). The academic year titles the first Team tier. */
export const getSeason = unstable_cache(
  async (): Promise<{ academicYear?: string }> => {
    if (offline()) return team.academicYear ? { academicYear: team.academicYear } : {};
    let row: { value: unknown } | undefined;
    try {
      [row] = await db().select().from(settings).where(eq(settings.key, "season")).limit(1);
    } catch (error) {
      // Preview builds share the production database, where migrations run only on production deploys (vercel-build).
      // Until `settings` exists there, no academic year is set, which is also the state before anyone saves one.
      if (!missingTable(error)) throw error;
      console.warn("settings table not migrated yet; treating the season as unset");
    }
    const value = (row?.value ?? {}) as { academicYear?: unknown };
    return typeof value.academicYear === "string" && value.academicYear.trim() ? { academicYear: value.academicYear.trim() } : {};
  },
  ["season", VERSION],
  { tags: [TAGS.season] },
);

/**
 * Officers shown on the site (04 §5): visible rows only, in tier order, each with its company badge (the on-dark
 * logo when there is one, since the badge sits on the headshot). Hidden officers are left out entirely.
 */
export const getPeople = unstable_cache(
  async (): Promise<Person[]> => {
    if (offline()) return team.people;
    const rows = await db()
      .select({ person: people, firm: placements.firm, logo: placements.logo, logoOnDark: placements.logoOnDark })
      .from(people)
      .leftJoin(placements, eq(people.companyId, placements.id))
      .where(eq(people.visible, true))
      .orderBy(asc(people.group), asc(people.sortOrder));
    return rows.map(({ person: p, firm, logo, logoOnDark }) => {
      const badge = logoOnDark ?? logo;
      const person: Person = { slug: p.slug, name: p.name, role: p.role, group: p.group, order: p.sortOrder };
      if (p.track) person.track = p.track;
      if (p.classYear) person.classYear = p.classYear;
      if (p.major) person.major = p.major;
      if (p.headshot) person.headshot = p.headshot;
      if (p.alt) person.alt = p.alt;
      if (p.placementNote) person.placement = p.placementNote;
      if (firm && badge) person.company = { name: firm, logo: badge };
      if (p.linkedin) person.linkedin = p.linkedin;
      return person;
    });
  },
  ["people", VERSION],
  { tags: [TAGS.people, TAGS.placements] },
);

/** The three tracks (03 §5), always in Trading, Research, Development order. */
export const getTracks = unstable_cache(
  async (): Promise<MembershipContent["tracks"]> => {
    if (offline()) return membership.tracks;
    const rows = await db().select().from(tracks);
    return TRACK_ORDER.flatMap((id) => {
      const r = rows.find((t) => t.id === id);
      if (!r) return [];
      return [
        {
          id: r.id,
          roleLabel: r.roleLabel,
          name: r.name,
          description: r.description,
          ...(r.goodFit ? { goodFit: r.goodFit } : {}),
          ...(r.sampleProblem ? { sampleProblem: r.sampleProblem } : {}),
          recommendedBackground: r.recommendedBackground,
          ...(r.leadSlug ? { leadSlug: r.leadSlug } : {}),
        },
      ];
    });
  },
  ["tracks", VERSION],
  { tags: [TAGS.tracks, TAGS.people] },
);

// ── Phase 6: recruiting, member count, events ──

async function settingValue(key: "recruiting" | "season"): Promise<unknown | undefined> {
  try {
    const [row] = await db().select().from(settings).where(eq(settings.key, key)).limit(1);
    return row?.value;
  } catch (error) {
    if (!missingTable(error)) throw error;
    return undefined;
  }
}

/**
 * Recruiting settings (spec 06 §5.2), the source for every Apply surface. Until an admin first saves the Recruiting
 * screen, the site's existing recruiting content applies (the seed copies it in), so a deploy never flips the state.
 */
export const getRecruiting = unstable_cache(
  async (): Promise<Recruiting> => {
    if (offline()) return site.recruiting;
    const value = await settingValue("recruiting");
    if (!value) {
      console.warn("recruiting setting not saved yet; using content/site.ts");
      return site.recruiting;
    }
    return value as Recruiting;
  },
  ["recruiting", VERSION],
  { tags: [TAGS.recruiting], revalidate: SCHEDULED_REVALIDATE },
);

export type MemberCountSetting = { mode: "auto" } | { mode: "manual"; value: number } | { mode: "hidden" };

/** Home's "active members" stat (spec 06 §5.2 season.memberCount): the Active roster count, a number, or hidden. */
export const getMemberCount = unstable_cache(
  async (): Promise<number | undefined> => {
    if (offline()) return home.stats.members;
    const season = (await settingValue("season")) as { memberCount?: MemberCountSetting } | undefined;
    const setting = season?.memberCount;
    if (!setting) return home.stats.members;
    if (setting.mode === "hidden") return undefined;
    if (setting.mode === "manual") return setting.value;
    try {
      const [row] = await db().select({ n: count() }).from(members).where(and(eq(members.status, "active")));
      return row?.n || undefined;
    } catch (error) {
      if (!missingTable(error)) throw error;
      return undefined;
    }
  },
  ["member-count", VERSION],
  { tags: [TAGS.season, TAGS.members] },
);

/** Every event, soonest first (spec 06 §6.10). Callers filter by audience and time (lib/events). */
export const getEvents = unstable_cache(
  async (): Promise<ClubEvent[]> => {
    if (offline()) return contentEvents;
    try {
      const rows = await db().select().from(events).orderBy(asc(events.startsAt));
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        startsAt: r.startsAt,
        ...(r.endsAt ? { endsAt: r.endsAt } : {}),
        ...(r.location ? { location: r.location } : {}),
        ...(r.description ? { description: r.description } : {}),
        ...(r.url ? { url: r.url } : {}),
        audience: r.audience,
        featured: r.featured,
      }));
    } catch (error) {
      // Preview builds share the production database, which migrates only on production deploys.
      if (!missingTable(error)) throw error;
      console.warn("events table not migrated yet; showing no events");
      return [];
    }
  },
  ["events", VERSION],
  { tags: [TAGS.events], revalidate: SCHEDULED_REVALIDATE },
);
