"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import {
  deletePerson,
  freeSlug,
  getPerson,
  insertPerson,
  nextSortOrder,
  setOrders,
  getSeasonSetting,
  setSeasonSetting,
  tierOrder,
  tracksLedBy,
  updatePerson,
} from "@/lib/admin/lists-db";
import { checkbox, optionalHttps, optionalImage, optionalText, optionalTrack, optionalYear } from "@/lib/admin/schemas";
import { TAGS } from "@/lib/data/public";

const GROUPS = ["exec", "co-president", "director", "track-lead"] as const;

/** Officers (spec 06 §6.3). The 04 §5 rules (alt text with a headshot, https LinkedIn, a track for track leads) apply. */
const schema = z
  .object({
    name: z.string().trim().min(1, "Add a name.").max(80),
    role: z.string().trim().min(1, "Add a role, e.g. “President”.").max(80),
    group: z.enum(GROUPS, { error: "Pick a tier." }),
    track: optionalTrack,
    classYear: optionalYear,
    major: optionalText(80),
    headshot: optionalImage,
    alt: optionalText(200),
    placementNote: optionalText(120),
    companyId: z.preprocess((v) => (v ? v : null), z.uuid().nullable()),
    linkedin: optionalHttps("Use the full https:// LinkedIn link."),
    visible: checkbox,
  })
  .refine((v) => v.group !== "track-lead" || v.track, { path: ["track"], message: "Track leads need a track." })
  .refine((v) => !v.headshot || v.alt, { path: ["alt"], message: "Describe the headshot, e.g. “Portrait of Jane Doe”." });

const keys = ["name", "role", "group", "track", "classYear", "major", "headshot", "alt", "placementNote", "companyId", "linkedin", "visible"];
const read = (f: FormData) => parseForm(schema, Object.fromEntries(keys.map((k) => [k, f.get(k)])));
const done = () => revalidatePath("/admin", "layout");

export async function createOfficer(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = read(f);
    const after = await insertPerson({ ...input, slug: await freeSlug(input.name), sortOrder: await nextSortOrder(input.group) });
    const undoId = await recordAudit({ ...who, action: "create", entity: "person", entityId: after.id, entityLabel: after.name, before: null, after });
    publish(TAGS.people);
    done();
    return { ok: SAVED, undoId, viewHref: `/team#${after.slug}`, redirectTo: `/admin/officers?saved=${undoId ?? ""}` };
  });
}

export async function updateOfficerAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = read(f);
    const current = await getPerson(id);
    if (!current) throw new FormError("That officer no longer exists.");
    if (!input.visible && current.visible) {
      const led = await tracksLedBy(current.slug);
      if (led.length) throw new FormError(`${current.name} leads ${led.map((t) => t.name).join(" and ")}. Pick another lead in Tracks before hiding them.`);
    }
    const sortOrder = input.group === current.group ? current.sortOrder : await nextSortOrder(input.group);
    const { before, after } = await updatePerson(id, { ...input, sortOrder });
    const undoId = await recordAudit({ ...who, action: "update", entity: "person", entityId: id, entityLabel: after.name, before, after });
    publish(TAGS.people);
    done();
    return { ok: SAVED, undoId, viewHref: `/team#${after.slug}` };
  });
}

export async function deleteOfficerAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const current = await getPerson(id);
    const led = current ? await tracksLedBy(current.slug) : [];
    const before = await deletePerson(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "person", entityId: id, entityLabel: before.name, before, after: null });
    publish(TAGS.people, TAGS.tracks);
    done();
    const cleared = led.length ? ` ${led.map((t) => t.name).join(" and ")} now has no lead.` : "";
    return { ok: `${before.name} removed.${cleared}`, undoId, redirectTo: `/admin/officers?saved=${undoId ?? ""}` };
  });
}

/** Up/down within a tier, as one undoable change per tier (entity "people-order"). */
export async function moveOfficer(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { id, group, dir } = parseForm(z.object({ id: z.uuid(), group: z.enum(GROUPS), dir: z.enum(["up", "down"]) }), {
      id: f.get("id"),
      group: f.get("group"),
      dir: f.get("dir"),
    });
    const before = await tierOrder(group);
    const i = before.findIndex((r) => r.id === id);
    const j = i + (dir === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= before.length) throw new FormError("It can't move further.");
    const ids = before.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const after = ids.map((rid, n) => ({ id: rid, sortOrder: n + 1 }));
    await setOrders(after);
    const undoId = await recordAudit({ ...who, action: "reorder", entity: "people-order", entityId: group, entityLabel: `${group} order`, before: { rows: before }, after: { rows: after } });
    publish(TAGS.people);
    done();
    return { ok: SAVED, undoId, viewHref: "/team" };
  });
}

/** The academic year titles the first Team tier, e.g. "Leadership, 2026–27" (spec 06 §6.3, §5.2 `season`). */
export async function saveAcademicYear(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { academicYear } = parseForm(
      z.object({ academicYear: optionalText(20).refine((v) => v === null || /^\d{4}[–-]\d{2}$/.test(v), "Use the form 2026–27.") }),
      { academicYear: f.get("academicYear") },
    );
    // Merge: the season also holds the Home member-count mode (Recruiting screen).
    const { academicYear: _old, ...rest } = await getSeasonSetting();
    void _old;
    const next = academicYear ? { ...rest, academicYear: academicYear.replace("-", "–") } : rest;
    const { before, after } = await setSeasonSetting(next);
    const undoId = await recordAudit({ ...who, action: "update", entity: "season", entityId: "season", entityLabel: "Academic year", before, after });
    publish(TAGS.season);
    done();
    return { ok: SAVED, undoId, viewHref: "/team" };
  });
}
