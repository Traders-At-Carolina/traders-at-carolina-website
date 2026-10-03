import { asc, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";
import { FormError } from "@/lib/admin/action";
import { photoSnapshot, slotProblem, type PhotoSnapshot, type SlotPage } from "@/lib/admin/photos";

export type PhotoRow = typeof photos.$inferSelect;
export type PhotoInput = Omit<PhotoSnapshot, "id">;
/** Slot 1–3 → photo id, or null for an empty slot. Stored in the audit log as one unit per page. */
export type Slots = [string | null, string | null, string | null];

const column = (page: SlotPage) => (page === "home" ? photos.homeOrder : photos.membershipOrder);
const field = (page: SlotPage) => (page === "home" ? "homeOrder" : "membershipOrder");

export async function listPhotos(): Promise<PhotoRow[]> {
  return db().select().from(photos).orderBy(desc(photos.createdAt));
}

export async function getPhoto(id: string): Promise<PhotoRow | undefined> {
  const [row] = await db().select().from(photos).where(eq(photos.id, id)).limit(1);
  return row;
}

export async function insertPhoto(input: PhotoInput & { id?: string }): Promise<PhotoSnapshot> {
  const [row] = await db().insert(photos).values(input).returning();
  return photoSnapshot(row);
}

export async function updatePhoto(id: string, input: PhotoInput): Promise<{ before: PhotoSnapshot; after: PhotoSnapshot }> {
  const current = await getPhoto(id);
  if (!current) throw new FormError("That photo no longer exists.");
  const [row] = await db().update(photos).set({ ...input, updatedAt: new Date() }).where(eq(photos.id, id)).returning();
  return { before: photoSnapshot(current), after: photoSnapshot(row) };
}

/** Deletes a photo that isn't on any page (spec 06 §6.6). Returns what was removed, for Undo. */
export async function deletePhoto(id: string): Promise<PhotoSnapshot> {
  const current = await getPhoto(id);
  if (!current) throw new FormError("That photo no longer exists.");
  if (current.homeOrder != null || current.membershipOrder != null) {
    throw new FormError("Take this photo off Home and Membership before deleting it.");
  }
  await db().delete(photos).where(eq(photos.id, id));
  return photoSnapshot(current);
}

export async function getSlots(page: SlotPage): Promise<Slots> {
  const rows = await db().select().from(photos).where(isNotNull(column(page))).orderBy(asc(column(page)));
  const slots: Slots = [null, null, null];
  for (const r of rows) {
    const n = r[field(page)];
    if (n && n >= 1 && n <= 3) slots[n - 1] = r.id;
  }
  return slots;
}

/**
 * Replaces one page's slot assignment in a single transaction: clear the page's column, then set it per slot.
 * Slots are compacted (empty slots close up) so the page always renders 1, 2, 3 in order.
 */
export async function setSlots(page: SlotPage, next: Slots): Promise<{ before: Slots; after: Slots }> {
  const ids = next.filter((id): id is string => Boolean(id));
  const problem = slotProblem(page, ids);
  if (problem) throw new FormError(problem);
  if (ids.length) {
    const found = await db().select({ id: photos.id }).from(photos).where(inArray(photos.id, ids));
    if (found.length !== ids.length) throw new FormError("One of those photos no longer exists. Reload and try again.");
  }
  const before = await getSlots(page);
  const after: Slots = [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null];
  const col = column(page);
  const key = field(page);
  await db().batch([
    db().update(photos).set({ [key]: null }).where(isNotNull(col)),
    ...ids.map((id, i) => db().update(photos).set({ [key]: i + 1, updatedAt: new Date() }).where(eq(photos.id, id))),
  ] as unknown as Parameters<ReturnType<typeof db>["batch"]>[0]);
  return { before, after };
}

/** Photo ids on either page, so the library can mark them and block deletes. */
export async function slottedIds(): Promise<Set<string>> {
  const rows = await db().select({ id: photos.id }).from(photos).where(or(isNotNull(photos.homeOrder), isNotNull(photos.membershipOrder)));
  return new Set(rows.map((r) => r.id));
}
