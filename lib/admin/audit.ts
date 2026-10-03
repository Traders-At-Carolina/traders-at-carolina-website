import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export type AuditEntry = typeof auditLog.$inferInsert;

/**
 * Records who changed what (spec 06 §5.1). Called after a change succeeds; a logging failure is reported but never
 * undoes or blocks the change itself. Editors pass `entityId` plus the row's `before`/`after` so the change can be
 * undone (spec 06 §3); admin grants and invitations carry only the Clerk id.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db().insert(auditLog).values(entry);
  } catch (error) {
    console.error("audit log write failed", error);
  }
}

export async function recentChanges(limit = 10) {
  return db().select().from(auditLog).orderBy(desc(auditLog.at)).limit(limit);
}
