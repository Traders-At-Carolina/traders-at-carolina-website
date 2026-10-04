"use server";

import { asc, desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, members, people, placements, sponsors } from "@/lib/db/schema";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { eventTypeLabel } from "@/lib/events";
import { formatEventDateTime } from "@/lib/format";

export type SearchKind = "member" | "event" | "officer" | "sponsor" | "placement";

export type SearchResult = { kind: SearchKind; id: string; label: string; sub?: string; href: string };

const PER_KIND = 5;

/** Escapes ILIKE wildcards so a typed `%` or `_` matches itself (backslash is Postgres's default escape). */
const pattern = (term: string) => `%${term.replace(/[\\%_]/g, "\\$&")}%`;

/** One kind failing (a bad row, a timeout) leaves the others' results in place. */
async function safely(kind: SearchKind, run: () => Promise<SearchResult[]>): Promise<SearchResult[]> {
  try {
    return await run();
  } catch (error) {
    console.error(`searchAdmin: ${kind} search failed`, error);
    return [];
  }
}

function eventSub(startsAt: string, type: (typeof events.$inferSelect)["type"]): string {
  let when = startsAt;
  try {
    when = formatEventDateTime(parseEasternDateTime(startsAt));
  } catch {
    // Keep the stored string if it doesn't parse.
  }
  return `${when} · ${eventTypeLabel(type)}`;
}

/**
 * Record search for the ⌘K palette (spec 11 §5.1): at most 5 each of members, events, officers, sponsors and
 * placements, by case-insensitive `ilike`. Admins only; anyone else gets nothing.
 */
export async function searchAdmin(q: string): Promise<SearchResult[]> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) return [];
    throw error;
  }

  const term = typeof q === "string" ? q.trim() : "";
  if (term.length < 2) return [];
  const like = pattern(term);

  const groups = await Promise.all([
    safely("member", async () => {
      const rows = await db()
        .select({ id: members.id, name: members.name, email: members.email })
        .from(members)
        .where(or(ilike(members.name, like), ilike(members.email, like)))
        .orderBy(asc(members.name))
        .limit(PER_KIND);
      return rows.map((r) => ({ kind: "member", id: r.id, label: r.name || r.email, sub: r.email, href: `/admin/members/${r.id}` }));
    }),
    safely("event", async () => {
      const rows = await db()
        .select({ id: events.id, title: events.title, startsAt: events.startsAt, type: events.type })
        .from(events)
        .where(ilike(events.title, like))
        .orderBy(desc(events.startsAt))
        .limit(PER_KIND);
      return rows.map((r) => ({ kind: "event", id: r.id, label: r.title, sub: eventSub(r.startsAt, r.type), href: `/admin/events/${r.id}` }));
    }),
    safely("officer", async () => {
      // The officer edit page takes the uuid id (it checks UUID.test before getPerson), not the slug.
      const rows = await db()
        .select({ id: people.id, name: people.name, role: people.role })
        .from(people)
        .where(or(ilike(people.name, like), ilike(people.role, like)))
        .orderBy(asc(people.name))
        .limit(PER_KIND);
      return rows.map((r) => ({ kind: "officer", id: r.id, label: r.name, sub: r.role, href: `/admin/officers/${r.id}` }));
    }),
    safely("sponsor", async () => {
      const rows = await db()
        .select({ id: sponsors.id, name: sponsors.name, relationship: sponsors.relationship })
        .from(sponsors)
        .where(ilike(sponsors.name, like))
        .orderBy(asc(sponsors.name))
        .limit(PER_KIND);
      return rows.map((r) => ({ kind: "sponsor", id: r.id, label: r.name, sub: r.relationship ?? "Sponsor", href: `/admin/sponsors/${r.id}` }));
    }),
    safely("placement", async () => {
      const rows = await db()
        .select({ id: placements.id, firm: placements.firm, showOnWall: placements.showOnWall })
        .from(placements)
        .where(ilike(placements.firm, like))
        .orderBy(asc(placements.firm))
        .limit(PER_KIND);
      return rows.map((r) => ({ kind: "placement", id: r.id, label: r.firm, sub: r.showOnWall ? "Placement · on the logo wall" : "Placement", href: `/admin/placements/${r.id}` }));
    }),
  ]);

  return groups.flat();
}
