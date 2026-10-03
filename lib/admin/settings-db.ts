import { asc, eq } from "drizzle-orm";
import { FormError } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { events, settings } from "@/lib/db/schema";

/** Settings rows (spec 06 §5.2), one JSON value per key. */
export type SettingKey = "recruiting" | "season" | "portal";

export async function getSetting<T>(key: SettingKey): Promise<T | undefined> {
  const [r] = await db().select().from(settings).where(eq(settings.key, key)).limit(1);
  return r?.value as T | undefined;
}

/** Replaces a setting's value and returns the value before, for the audit log. */
export async function setSetting<T>(key: SettingKey, value: T): Promise<{ before: T | null; after: T }> {
  const before = ((await getSetting<T>(key)) ?? null) as T | null;
  await db()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return { before, after: value };
}

// ── Events (spec 06 §6.10) ──

export type EventRow = typeof events.$inferSelect;
export type EventSnapshot = Omit<EventRow, "createdAt" | "updatedAt">;
export const eventSnapshot = ({ createdAt: _c, updatedAt: _u, ...rest }: EventRow): EventSnapshot => (void _c, void _u, rest);

export const listEvents = () => db().select().from(events).orderBy(asc(events.startsAt));

export async function getEvent(id: string): Promise<EventRow | undefined> {
  const [r] = await db().select().from(events).where(eq(events.id, id)).limit(1);
  return r;
}

export async function insertEvent(input: Omit<EventSnapshot, "id"> & { id?: string }): Promise<EventSnapshot> {
  const [r] = await db().insert(events).values(input).returning();
  return eventSnapshot(r);
}

export async function updateEvent(id: string, input: Omit<EventSnapshot, "id">) {
  const current = await getEvent(id);
  if (!current) throw new FormError("That event no longer exists.");
  const [r] = await db().update(events).set({ ...input, updatedAt: new Date() }).where(eq(events.id, id)).returning();
  return { before: eventSnapshot(current), after: eventSnapshot(r) };
}

export async function deleteEvent(id: string): Promise<EventSnapshot> {
  const current = await getEvent(id);
  if (!current) throw new FormError("That event no longer exists.");
  await db().delete(events).where(eq(events.id, id));
  return eventSnapshot(current);
}
