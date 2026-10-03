"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ClubEvent } from "@/content/types";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { optionalHttps, optionalText } from "@/lib/admin/schemas";
import { deleteEvent, getEvent, insertEvent, updateEvent, type EventSnapshot } from "@/lib/admin/settings-db";
import { TAGS } from "@/lib/data/public";
import { shiftLocal } from "@/lib/events-local";
import { collectEventProblems } from "@/lib/validate-events";

const TYPES = ["general-meeting", "workshop", "speaker", "competition", "social", "recruiting", "other"] as const;
const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Events (spec 06 §6.10). Times are "YYYY-MM-DDTHH:mm" in Eastern time, as <input type="datetime-local"> gives them. */
const schema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(120),
  type: z.enum(TYPES, { error: "Pick a type." }),
  startsAt: z.string().regex(LOCAL, "Pick a start date and time."),
  endsAt: z.preprocess((v) => (v ? v : null), z.string().regex(LOCAL, "Use a date and time.").nullable()),
  location: optionalText(120),
  description: optionalText(400),
  url: optionalHttps(),
  audience: z.enum(["public", "signed_in", "members"]),
  featured: z.preprocess((v) => v === "on", z.boolean()),
});

const KEYS = ["title", "type", "startsAt", "endsAt", "location", "description", "url", "audience", "featured"];

function read(f: FormData): Omit<EventSnapshot, "id"> {
  const v = parseForm(schema, Object.fromEntries(KEYS.map((k) => [k, f.get(k)])));
  const asEvent: ClubEvent = {
    title: v.title,
    type: v.type,
    startsAt: v.startsAt,
    ...(v.endsAt ? { endsAt: v.endsAt } : {}),
    ...(v.url ? { url: v.url } : {}),
    audience: v.audience,
    featured: v.featured,
  };
  const problems = collectEventProblems([asEvent]);
  if (problems.length) {
    const fieldErrors: Record<string, string> = {};
    for (const p of problems) {
      const field = /endsAt/.test(p) ? "endsAt" : /featured/.test(p) ? "featured" : /url/.test(p) ? "url" : "startsAt";
      fieldErrors[field] = p.includes("featured") ? "Only website events can be featured on Home." : p.includes("endsAt must not be before") ? "The end can't be before the start." : p.replace(/^events\[0\]\.\w+ ?:? ?/, "");
    }
    throw new FormError("Check the highlighted fields.", fieldErrors);
  }
  return v;
}

const done = () => revalidatePath("/admin", "layout");

export async function createEvent(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertEvent(read(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "event", entityId: after.id, entityLabel: after.title, before: null, after });
    publish(TAGS.events);
    done();
    return { ok: SAVED, undoId, viewHref: after.audience === "public" ? "/" : "/portal", redirectTo: `/admin/events?saved=${undoId ?? ""}` };
  });
}

export async function updateEventAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updateEvent(id, read(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "event", entityId: id, entityLabel: after.title, before, after });
    publish(TAGS.events);
    done();
    return { ok: SAVED, undoId, viewHref: after.audience === "public" ? "/" : "/portal" };
  });
}

export async function deleteEventAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deleteEvent(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "event", entityId: id, entityLabel: before.title, before, after: null });
    publish(TAGS.events);
    done();
    return { ok: `${before.title} deleted.`, undoId, redirectTo: `/admin/events?saved=${undoId ?? ""}` };
  });
}

/** Duplicate (same time) or Duplicate +1 week (weekly meetings), spec 06 §6.10. Copies are never featured. */
export async function duplicateEvent(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = String(f.get("id") ?? "");
    const days = f.get("plusWeek") === "1" ? 7 : 0;
    const source = await getEvent(id);
    if (!source) throw new FormError("That event no longer exists.");
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = source;
    void _id;
    void _c;
    void _u;
    const after = await insertEvent({
      ...rest,
      featured: false,
      startsAt: shiftLocal(rest.startsAt, days),
      endsAt: rest.endsAt ? shiftLocal(rest.endsAt, days) : null,
    });
    const undoId = await recordAudit({ ...who, action: "create", entity: "event", entityId: after.id, entityLabel: after.title, before: null, after });
    publish(TAGS.events);
    done();
    return { ok: days ? "Copied to the same time next week." : "Copied.", undoId, redirectTo: `/admin/events/${after.id}` };
  });
}
