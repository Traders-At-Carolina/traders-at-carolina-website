import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export type AuditEntry = typeof auditLog.$inferInsert;

/**
 * Records who changed what (spec 06 §5). Called after a change succeeds; a logging failure is reported but never
 * undoes or blocks the change itself.
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
