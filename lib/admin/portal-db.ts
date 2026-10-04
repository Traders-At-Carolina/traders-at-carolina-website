import { and, asc, desc, eq, sql } from "drizzle-orm";
import { FormError } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { announcements, portalLinks, resources } from "@/lib/db/schema";

/**
 * Data access for the portal editors (spec 06 §6.11–6.13). Every write returns the row before and after, without
 * timestamps, so the audit log can drive Undo (spec 06 §3). Multi-row writes go through db.batch.
 */

const strip = <T extends Record<string, unknown>>(row: T): Omit<T, "createdAt" | "updatedAt"> => {
  const { createdAt: _c, updatedAt: _u, ...rest } = row as T & { createdAt?: unknown; updatedAt?: unknown };
  void _c;
  void _u;
  return rest;
};

type Batch = Parameters<ReturnType<typeof db>["batch"]>[0];

export type ResourceRow = typeof resources.$inferSelect;
export type AnnouncementRow = typeof announcements.$inferSelect;
export type PortalLinkRow = typeof portalLinks.$inferSelect;

export type ResourceSnapshot = ReturnType<typeof strip<ResourceRow>>;
export type AnnouncementSnapshot = ReturnType<typeof strip<AnnouncementRow>>;
export type PortalLinkSnapshot = PortalLinkRow;

export const resourceSnapshot = (r: ResourceRow): ResourceSnapshot => strip(r);
/** Dates become ISO strings, so a snapshot compares equal to its JSON copy in the audit log. */
export const announcementSnapshot = (r: AnnouncementRow) => {
  const s = strip(r);
  return { ...s, showFrom: s.showFrom ? new Date(s.showFrom).toISOString() : null, showUntil: s.showUntil ? new Date(s.showUntil).toISOString() : null };
};
export type AnnouncementState = ReturnType<typeof announcementSnapshot>;
export const portalLinkSnapshot = (r: PortalLinkRow): PortalLinkSnapshot => ({ ...r });

/** Audit `before`/`after` arrive as JSON; turn an announcement's ISO dates back into Dates for a write. */
export const announcementValues = (s: Omit<AnnouncementState, "id">) => ({
  ...s,
  showFrom: s.showFrom ? new Date(s.showFrom) : null,
  showUntil: s.showUntil ? new Date(s.showUntil) : null,
});

// ── Resources ──

export const listResources = () => db().select().from(resources).orderBy(asc(resources.section), desc(resources.pinned), asc(resources.sortOrder), asc(resources.title));

export async function getResource(id: string): Promise<ResourceRow | undefined> {
  const [r] = await db().select().from(resources).where(eq(resources.id, id)).limit(1);
  return r;
}

/** Last place in a section, for new resources and section changes. */
export async function nextResourceOrder(section: ResourceRow["section"]): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`coalesce(max(${resources.sortOrder}), 0)` })
    .from(resources)
    .where(eq(resources.section, section));
  return Number(r?.n ?? 0) + 1;
}

export async function insertResource(input: Omit<ResourceSnapshot, "id" | "sortOrder"> & { id?: string; sortOrder?: number }): Promise<ResourceSnapshot> {
  const sortOrder = input.sortOrder ?? (await nextResourceOrder(input.section));
  const [r] = await db()
    .insert(resources)
    .values({ ...input, sortOrder })
    .returning();
  return resourceSnapshot(r);
}

/** Moving a resource to another section puts it last there; otherwise it keeps its place. */
export async function updateResource(id: string, input: Omit<ResourceSnapshot, "id" | "sortOrder"> & { sortOrder?: number }) {
  const current = await getResource(id);
  if (!current) throw new FormError("That resource no longer exists.");
  const sortOrder = input.sortOrder ?? (input.section === current.section ? current.sortOrder : await nextResourceOrder(input.section));
  const [r] = await db()
    .update(resources)
    .set({ ...input, sortOrder, updatedAt: new Date() })
    .where(eq(resources.id, id))
    .returning();
  return { before: resourceSnapshot(current), after: resourceSnapshot(r) };
}

/** Deletes the row only. The private file stays in Blob, so Undo can bring the resource back intact. */
export async function deleteResource(id: string): Promise<ResourceSnapshot> {
  const current = await getResource(id);
  if (!current) throw new FormError("That resource no longer exists.");
  await db().delete(resources).where(eq(resources.id, id));
  return resourceSnapshot(current);
}

export type ResourceOrder = Array<{ id: string; sortOrder: number }>;

/**
 * The order of one group in a section, for the up/down buttons. Pinned resources always sort first (spec 06 §6.11), so
 * pinned and unpinned ones each reorder among themselves.
 */
export async function sectionOrder(section: ResourceRow["section"], pinned: boolean): Promise<ResourceOrder> {
  return db()
    .select({ id: resources.id, sortOrder: resources.sortOrder })
    .from(resources)
    .where(and(eq(resources.section, section), eq(resources.pinned, pinned)))
    .orderBy(asc(resources.sortOrder), asc(resources.title));
}

export async function setResourceOrders(rows: ResourceOrder): Promise<void> {
  if (rows.length === 0) return;
  await db().batch(rows.map((r) => db().update(resources).set({ sortOrder: r.sortOrder, updatedAt: new Date() }).where(eq(resources.id, r.id))) as unknown as Batch);
}

// ── Announcements ──

export const listAnnouncements = () => db().select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt));

export async function getAnnouncement(id: string): Promise<AnnouncementRow | undefined> {
  const [r] = await db().select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return r;
}

type AnnouncementWrite = Omit<AnnouncementRow, "id" | "createdAt" | "updatedAt">;

export async function insertAnnouncement(input: AnnouncementWrite & { id?: string }): Promise<AnnouncementState> {
  const [r] = await db().insert(announcements).values(input).returning();
  return announcementSnapshot(r);
}

export async function updateAnnouncement(id: string, input: AnnouncementWrite) {
  const current = await getAnnouncement(id);
  if (!current) throw new FormError("That announcement no longer exists.");
  const [r] = await db()
    .update(announcements)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();
  return { before: announcementSnapshot(current), after: announcementSnapshot(r) };
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementState> {
  const current = await getAnnouncement(id);
  if (!current) throw new FormError("That announcement no longer exists.");
  await db().delete(announcements).where(eq(announcements.id, id));
  return announcementSnapshot(current);
}

// ── Member links ──

export const listPortalLinks = () => db().select().from(portalLinks).orderBy(asc(portalLinks.sortOrder), asc(portalLinks.label));

export async function getPortalLink(id: string): Promise<PortalLinkRow | undefined> {
  const [r] = await db().select().from(portalLinks).where(eq(portalLinks.id, id)).limit(1);
  return r;
}

async function nextLinkOrder(): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`coalesce(max(${portalLinks.sortOrder}), 0)` })
    .from(portalLinks);
  return Number(r?.n ?? 0) + 1;
}

export async function insertPortalLink(input: Omit<PortalLinkRow, "id" | "sortOrder"> & { id?: string; sortOrder?: number }): Promise<PortalLinkSnapshot> {
  const sortOrder = input.sortOrder ?? (await nextLinkOrder());
  const [r] = await db()
    .insert(portalLinks)
    .values({ ...input, sortOrder })
    .returning();
  return portalLinkSnapshot(r);
}

export async function updatePortalLink(id: string, input: Omit<PortalLinkRow, "id" | "sortOrder"> & { sortOrder?: number }) {
  const current = await getPortalLink(id);
  if (!current) throw new FormError("That link no longer exists.");
  const [r] = await db()
    .update(portalLinks)
    .set({ ...input, sortOrder: input.sortOrder ?? current.sortOrder })
    .where(eq(portalLinks.id, id))
    .returning();
  return { before: portalLinkSnapshot(current), after: portalLinkSnapshot(r) };
}

export async function deletePortalLink(id: string): Promise<PortalLinkSnapshot> {
  const current = await getPortalLink(id);
  if (!current) throw new FormError("That link no longer exists.");
  await db().delete(portalLinks).where(eq(portalLinks.id, id));
  return portalLinkSnapshot(current);
}

export type LinkOrder = Array<{ id: string; sortOrder: number }>;

export async function linkOrder(): Promise<LinkOrder> {
  return db().select({ id: portalLinks.id, sortOrder: portalLinks.sortOrder }).from(portalLinks).orderBy(asc(portalLinks.sortOrder), asc(portalLinks.label));
}

export async function setLinkOrders(rows: LinkOrder): Promise<void> {
  if (rows.length === 0) return;
  await db().batch(rows.map((r) => db().update(portalLinks).set({ sortOrder: r.sortOrder }).where(eq(portalLinks.id, r.id))) as unknown as Batch);
}

/** Swaps one item with its neighbour and renumbers 1…n, or null when it can't move that way. */
export function moveInOrder(order: Array<{ id: string; sortOrder: number }>, id: string, dir: "up" | "down"): Array<{ id: string; sortOrder: number }> | null {
  const i = order.findIndex((r) => r.id === id);
  const j = i + (dir === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= order.length) return null;
  const ids = order.map((r) => r.id);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return ids.map((rid, n) => ({ id: rid, sortOrder: n + 1 }));
}
