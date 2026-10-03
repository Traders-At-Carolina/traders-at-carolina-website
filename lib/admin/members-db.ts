import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { TrackId } from "@/content/types";
import { FormError } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { members, membershipRequests } from "@/lib/db/schema";

export type MemberRow = typeof members.$inferSelect;
export type MemberStatus = MemberRow["status"];
export type RequestRow = typeof membershipRequests.$inferSelect;

/** A roster row as stored in the audit log (no timestamps), so Undo can compare and restore it. */
export type MemberSnapshot = {
  id: string;
  email: string;
  name: string;
  status: MemberStatus;
  track: TrackId | null;
  classYear: number | null;
  cohort: string | null;
  userId: string | null;
  notes: string | null;
};

export const memberSnapshot = (r: MemberRow): MemberSnapshot => ({
  id: r.id,
  email: r.email,
  name: r.name,
  status: r.status,
  track: r.track,
  classYear: r.classYear,
  cohort: r.cohort,
  userId: r.userId,
  notes: r.notes,
});

export type RosterFilter = { q?: string; status?: MemberStatus; track?: TrackId; classYear?: number };

export async function listMembers(filter: RosterFilter = {}): Promise<MemberRow[]> {
  const where = [
    filter.q ? or(ilike(members.name, `%${filter.q}%`), ilike(members.email, `%${filter.q}%`)) : undefined,
    filter.status ? eq(members.status, filter.status) : undefined,
    filter.track ? eq(members.track, filter.track) : undefined,
    filter.classYear ? eq(members.classYear, filter.classYear) : undefined,
  ].filter((w) => w !== undefined);
  return db()
    .select()
    .from(members)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(members.name));
}

export async function getMember(id: string): Promise<MemberRow | undefined> {
  const [row] = await db().select().from(members).where(eq(members.id, id)).limit(1);
  return row;
}

export async function getMembersByIds(ids: string[]): Promise<MemberRow[]> {
  if (ids.length === 0) return [];
  return db().select().from(members).where(inArray(members.id, ids));
}

/** Lowercased emails already on the roster, for the Add preview. */
export async function rosterEmails(): Promise<Set<string>> {
  const rows = await db().select({ email: members.email }).from(members);
  return new Set(rows.map((r) => r.email.toLowerCase()));
}

/** Clerk user ids already on the roster, for the All accounts badges. */
export async function rosterUserIds(): Promise<Map<string, MemberRow>> {
  const rows = await db().select().from(members).where(sql`${members.userId} is not null`);
  return new Map(rows.map((r) => [r.userId as string, r]));
}

export type NewMember = Omit<MemberSnapshot, "id" | "userId" | "notes"> & { userId?: string | null; notes?: string | null; id?: string };

export async function insertMembers(rows: NewMember[]): Promise<MemberSnapshot[]> {
  if (rows.length === 0) return [];
  const inserted = await db().insert(members).values(rows).onConflictDoNothing().returning();
  return inserted.map(memberSnapshot);
}

export type MemberPatch = Partial<Pick<MemberSnapshot, "email" | "name" | "status" | "track" | "classYear" | "cohort" | "notes">>;

export async function updateMember(id: string, patch: MemberPatch): Promise<{ before: MemberSnapshot; after: MemberSnapshot }> {
  const current = await getMember(id);
  if (!current) throw new FormError("That member is no longer on the roster.");
  try {
    const [row] = await db().update(members).set({ ...patch, updatedAt: new Date() }).where(eq(members.id, id)).returning();
    return { before: memberSnapshot(current), after: memberSnapshot(row) };
  } catch (error) {
    if (/members_email_ci_idx/.test(String((error as Error).message))) throw new FormError("Another roster row already has that email.", { email: "Already on the roster." });
    throw error;
  }
}

/** Applies one patch to many rows in one transaction. Returns each row before and after. */
export async function bulkUpdate(ids: string[], patch: MemberPatch): Promise<{ before: MemberSnapshot[]; after: MemberSnapshot[] }> {
  const current = await getMembersByIds(ids);
  if (current.length === 0) throw new FormError("Select at least one member.");
  await db().update(members).set({ ...patch, updatedAt: new Date() }).where(inArray(members.id, current.map((r) => r.id)));
  const after = await getMembersByIds(current.map((r) => r.id));
  return { before: current.map(memberSnapshot), after: after.map(memberSnapshot) };
}

/** Removes rows (ending member access); the Clerk accounts stay (spec 06 §9). */
export async function removeMembers(ids: string[]): Promise<MemberSnapshot[]> {
  const current = await getMembersByIds(ids);
  if (current.length === 0) throw new FormError("Select at least one member.");
  await db().delete(members).where(inArray(members.id, current.map((r) => r.id)));
  return current.map(memberSnapshot);
}

/** Puts rows back exactly as recorded (Undo), by id. */
export async function restoreMembers(rows: MemberSnapshot[]): Promise<void> {
  if (rows.length === 0) return;
  await db()
    .insert(members)
    .values(rows)
    .onConflictDoUpdate({
      target: members.id,
      set: {
        email: sql`excluded.email`,
        name: sql`excluded.name`,
        status: sql`excluded.status`,
        track: sql`excluded.track`,
        classYear: sql`excluded.class_year`,
        cohort: sql`excluded.cohort`,
        userId: sql`excluded.user_id`,
        notes: sql`excluded.notes`,
        updatedAt: new Date(),
      },
    });
}

export async function deleteMembersById(ids: string[]): Promise<void> {
  if (ids.length) await db().delete(members).where(inArray(members.id, ids));
}

// ── Requests ──

export async function pendingRequests(): Promise<RequestRow[]> {
  return db().select().from(membershipRequests).where(eq(membershipRequests.status, "pending")).orderBy(asc(membershipRequests.createdAt));
}

export async function pendingRequestCount(): Promise<number> {
  const [row] = await db().select({ n: count() }).from(membershipRequests).where(eq(membershipRequests.status, "pending"));
  return row?.n ?? 0;
}

export async function getRequest(id: string): Promise<RequestRow | undefined> {
  const [row] = await db().select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1);
  return row;
}

export async function setRequestStatus(id: string, status: RequestRow["status"], decidedBy: string | null): Promise<void> {
  await db()
    .update(membershipRequests)
    .set({ status, decidedBy, decidedAt: status === "pending" ? null : new Date() })
    .where(eq(membershipRequests.id, id));
}

export async function latestRequests(limit = 20): Promise<RequestRow[]> {
  return db().select().from(membershipRequests).orderBy(desc(membershipRequests.createdAt)).limit(limit);
}
