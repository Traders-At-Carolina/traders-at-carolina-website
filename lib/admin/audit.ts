import { and, desc, eq, gte, inArray, lte, max, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export type AuditEntry = typeof auditLog.$inferInsert;
export type AuditRow = typeof auditLog.$inferSelect;

/**
 * Records who changed what (spec 06 §5.1) and returns the entry's id for Undo. Called after a change succeeds; a
 * logging failure is reported but never undoes or blocks the change itself (that change then just has no Undo).
 * Editors pass `entityId` plus the item's `before`/`after`; admin grants and invitations carry only the Clerk id.
 */
export async function recordAudit(entry: AuditEntry): Promise<number | null> {
  try {
    const [row] = await db().insert(auditLog).values(entry).returning({ id: auditLog.id });
    return row?.id ?? null;
  } catch (error) {
    console.error("audit log write failed", error);
    return null;
  }
}

export async function recentChanges(limit = 10): Promise<AuditRow[]> {
  return db().select().from(auditLog).orderBy(desc(auditLog.id)).limit(limit);
}

export async function getEntry(id: number): Promise<AuditRow | undefined> {
  const [row] = await db().select().from(auditLog).where(eq(auditLog.id, id)).limit(1);
  return row;
}

/** Newest entry id for one item, which is the only one Undo may act on. */
export async function latestEntryId(entity: string, entityId: string): Promise<number | null> {
  const [row] = await db()
    .select({ id: max(auditLog.id) })
    .from(auditLog)
    .where(and(eq(auditLog.entity, entity), eq(auditLog.entityId, entityId)));
  return row?.id ?? null;
}

/** Newest entry id per item for a set of entries, so History can show Undo only where it applies. */
export async function latestIdsFor(rows: AuditRow[]): Promise<Set<number>> {
  const ids = [...new Set(rows.flatMap((r) => (r.entityId ? [r.entityId] : [])))];
  if (ids.length === 0) return new Set();
  const latest = await db()
    .select({ id: max(auditLog.id) })
    .from(auditLog)
    .where(inArray(auditLog.entityId, ids))
    .groupBy(auditLog.entity, auditLog.entityId);
  return new Set(latest.flatMap((r) => (r.id == null ? [] : [r.id])));
}

export type HistoryFilter = { actor?: string; entity?: string; from?: Date; to?: Date };

export async function listHistory(filter: HistoryFilter, limit = 100): Promise<AuditRow[]> {
  const where = [
    filter.actor ? eq(auditLog.actorEmail, filter.actor) : undefined,
    filter.entity ? eq(auditLog.entity, filter.entity) : undefined,
    filter.from ? gte(auditLog.at, filter.from) : undefined,
    filter.to ? lte(auditLog.at, filter.to) : undefined,
  ].filter((w) => w !== undefined);
  return db()
    .select()
    .from(auditLog)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditLog.id))
    .limit(limit);
}

/** Distinct people and areas, for the History filters. */
export async function historyFacets(): Promise<{ actors: string[]; entities: string[] }> {
  const rows = await db()
    .select({ actor: auditLog.actorEmail, entity: auditLog.entity })
    .from(auditLog)
    .groupBy(auditLog.actorEmail, auditLog.entity)
    .orderBy(sql`1`);
  return {
    actors: [...new Set(rows.flatMap((r) => (r.actor ? [r.actor] : [])))].sort(),
    entities: [...new Set(rows.map((r) => r.entity))].sort(),
  };
}
