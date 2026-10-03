import { asc, eq, inArray, sql } from "drizzle-orm";
import { FormError } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { people, placements, settings, sponsors, tracks } from "@/lib/db/schema";

/**
 * Data access for the website lists (spec 06 §6.3, §6.7–6.9). Every write returns the row before and after, without
 * timestamps, so the audit log can drive Undo (spec 06 §3).
 */

const strip = <T extends Record<string, unknown>>(row: T): Omit<T, "createdAt" | "updatedAt"> => {
  const { createdAt: _c, updatedAt: _u, ...rest } = row as T & { createdAt?: unknown; updatedAt?: unknown };
  void _c;
  void _u;
  return rest;
};

const unique = (error: unknown, index: string) => new RegExp(index).test(String((error as Error)?.message ?? error));

export type SponsorRow = typeof sponsors.$inferSelect;
export type PlacementRow = typeof placements.$inferSelect;
export type PersonRow = typeof people.$inferSelect;
export type TrackRow = typeof tracks.$inferSelect;

export type SponsorSnapshot = ReturnType<typeof strip<SponsorRow>>;
export type PlacementSnapshot = ReturnType<typeof strip<PlacementRow>>;
export type PersonSnapshot = ReturnType<typeof strip<PersonRow>>;
export type TrackSnapshot = ReturnType<typeof strip<TrackRow>>;

export const sponsorSnapshot = (r: SponsorRow) => strip(r);
export const placementSnapshot = (r: PlacementRow) => strip(r);
export const personSnapshot = (r: PersonRow) => strip(r);
export const trackSnapshot = (r: TrackRow) => strip(r);

// ── Sponsors ──

export const listSponsors = () => db().select().from(sponsors).orderBy(asc(sponsors.name));
export async function getSponsor(id: string) {
  const [r] = await db().select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
  return r;
}
const dupSponsor = () => new FormError("There is already a sponsor with that name.", { name: "Already listed." });

export async function insertSponsor(input: Omit<SponsorSnapshot, "id"> & { id?: string }): Promise<SponsorSnapshot> {
  try {
    const [r] = await db().insert(sponsors).values(input).returning();
    return sponsorSnapshot(r);
  } catch (e) {
    if (unique(e, "sponsors_name_ci_idx")) throw dupSponsor();
    throw e;
  }
}
export async function updateSponsor(id: string, input: Omit<SponsorSnapshot, "id">) {
  const current = await getSponsor(id);
  if (!current) throw new FormError("That sponsor no longer exists.");
  try {
    const [r] = await db().update(sponsors).set({ ...input, updatedAt: new Date() }).where(eq(sponsors.id, id)).returning();
    return { before: sponsorSnapshot(current), after: sponsorSnapshot(r) };
  } catch (e) {
    if (unique(e, "sponsors_name_ci_idx")) throw dupSponsor();
    throw e;
  }
}
export async function deleteSponsor(id: string): Promise<SponsorSnapshot> {
  const current = await getSponsor(id);
  if (!current) throw new FormError("That sponsor no longer exists.");
  await db().delete(sponsors).where(eq(sponsors.id, id));
  return sponsorSnapshot(current);
}

// ── Placements ──

export const listPlacements = () => db().select().from(placements).orderBy(asc(placements.wallOrder), asc(placements.firm));
export async function getPlacement(id: string) {
  const [r] = await db().select().from(placements).where(eq(placements.id, id)).limit(1);
  return r;
}
const dupFirm = () => new FormError("That firm is already listed.", { firm: "Already listed." });

/** Next free wall position, so a firm switched onto the wall goes to the end. */
async function nextWallOrder(): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`coalesce(max(${placements.wallOrder}), 0)` })
    .from(placements);
  return Number(r?.n ?? 0) + 1;
}

export async function insertPlacement(input: Omit<PlacementSnapshot, "id" | "wallOrder"> & { id?: string; wallOrder?: number | null }) {
  try {
    const wallOrder = input.showOnWall ? (input.wallOrder ?? (await nextWallOrder())) : null;
    const [r] = await db().insert(placements).values({ ...input, wallOrder }).returning();
    return placementSnapshot(r);
  } catch (e) {
    if (unique(e, "placements_firm_ci_idx")) throw dupFirm();
    throw e;
  }
}
export async function updatePlacement(id: string, input: Omit<PlacementSnapshot, "id" | "wallOrder">) {
  const current = await getPlacement(id);
  if (!current) throw new FormError("That firm no longer exists.");
  const wallOrder = input.showOnWall ? (current.wallOrder ?? (await nextWallOrder())) : null;
  try {
    const [r] = await db()
      .update(placements)
      .set({ ...input, wallOrder, updatedAt: new Date() })
      .where(eq(placements.id, id))
      .returning();
    return { before: placementSnapshot(current), after: placementSnapshot(r) };
  } catch (e) {
    if (unique(e, "placements_firm_ci_idx")) throw dupFirm();
    throw e;
  }
}
export async function deletePlacement(id: string): Promise<PlacementSnapshot> {
  const current = await getPlacement(id);
  if (!current) throw new FormError("That firm no longer exists.");
  await db().delete(placements).where(eq(placements.id, id));
  return placementSnapshot(current);
}

// ── People (officers) ──

export const listPeople = () => db().select().from(people).orderBy(asc(people.group), asc(people.sortOrder));
export async function getPerson(id: string) {
  const [r] = await db().select().from(people).where(eq(people.id, id)).limit(1);
  return r;
}
export async function personBySlug(slug: string) {
  const [r] = await db().select().from(people).where(eq(people.slug, slug)).limit(1);
  return r;
}

/** "Jane Doe" → "jane-doe", or "jane-doe-2" when taken. Fixed after creation (04 §5). */
export async function freeSlug(name: string): Promise<string> {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "officer";
  const taken = new Set((await db().select({ slug: people.slug }).from(people)).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Last place in a tier, for new officers and tier changes. */
export async function nextSortOrder(group: PersonRow["group"]): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`coalesce(max(${people.sortOrder}), 0)` })
    .from(people)
    .where(eq(people.group, group));
  return Number(r?.n ?? 0) + 1;
}

export async function insertPerson(input: Omit<PersonSnapshot, "id"> & { id?: string }): Promise<PersonSnapshot> {
  const [r] = await db().insert(people).values(input).returning();
  return personSnapshot(r);
}
export async function updatePerson(id: string, input: Partial<Omit<PersonSnapshot, "id" | "slug">>) {
  const current = await getPerson(id);
  if (!current) throw new FormError("That officer no longer exists.");
  const [r] = await db().update(people).set({ ...input, updatedAt: new Date() }).where(eq(people.id, id)).returning();
  return { before: personSnapshot(current), after: personSnapshot(r) };
}
/** Deleting clears any track the person led (foreign key ON DELETE SET NULL). */
export async function deletePerson(id: string): Promise<PersonSnapshot> {
  const current = await getPerson(id);
  if (!current) throw new FormError("That officer no longer exists.");
  await db().delete(people).where(eq(people.id, id));
  return personSnapshot(current);
}

/** Order snapshots for one tier, for the up/down buttons (one audited unit per tier). */
export async function tierOrder(group: PersonRow["group"]): Promise<Array<{ id: string; sortOrder: number }>> {
  return db().select({ id: people.id, sortOrder: people.sortOrder }).from(people).where(eq(people.group, group)).orderBy(asc(people.sortOrder));
}
export async function setOrders(rows: Array<{ id: string; sortOrder: number }>): Promise<void> {
  if (rows.length === 0) return;
  await db().batch(
    rows.map((r) => db().update(people).set({ sortOrder: r.sortOrder, updatedAt: new Date() }).where(eq(people.id, r.id))) as unknown as Parameters<
      ReturnType<typeof db>["batch"]
    >[0],
  );
}

export async function wallOrder(): Promise<Array<{ id: string; wallOrder: number | null }>> {
  return db().select({ id: placements.id, wallOrder: placements.wallOrder }).from(placements).where(eq(placements.showOnWall, true)).orderBy(asc(placements.wallOrder));
}
export async function setWallOrders(rows: Array<{ id: string; wallOrder: number | null }>): Promise<void> {
  if (rows.length === 0) return;
  await db().batch(
    rows.map((r) => db().update(placements).set({ wallOrder: r.wallOrder, updatedAt: new Date() }).where(eq(placements.id, r.id))) as unknown as Parameters<
      ReturnType<typeof db>["batch"]
    >[0],
  );
}

// ── Tracks ──

export const listTracks = () => db().select().from(tracks);
export async function getTrack(id: TrackRow["id"]) {
  const [r] = await db().select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return r;
}
export async function updateTrack(id: TrackRow["id"], input: Omit<TrackSnapshot, "id">) {
  const current = await getTrack(id);
  if (!current) throw new FormError("That track no longer exists.");
  const [r] = await db().update(tracks).set({ ...input, updatedAt: new Date() }).where(eq(tracks.id, id)).returning();
  return { before: trackSnapshot(current), after: trackSnapshot(r) };
}
/** Tracks an officer leads, so hiding them can be refused while they're still named as a lead. */
export async function tracksLedBy(slug: string): Promise<TrackRow[]> {
  return db().select().from(tracks).where(eq(tracks.leadSlug, slug));
}

// ── Season (settings) ──

export type Season = { academicYear?: string };
export async function getSeasonSetting(): Promise<Season> {
  const [r] = await db().select().from(settings).where(eq(settings.key, "season")).limit(1);
  return (r?.value as Season) ?? {};
}
export async function setSeasonSetting(next: Season): Promise<{ before: Season; after: Season }> {
  const before = await getSeasonSetting();
  await db()
    .insert(settings)
    .values({ key: "season", value: next })
    .onConflictDoUpdate({ target: settings.key, set: { value: next, updatedAt: new Date() } });
  return { before, after: next };
}

export async function placementsByIds(ids: string[]) {
  return ids.length ? db().select().from(placements).where(inArray(placements.id, ids)) : [];
}

