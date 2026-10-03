"use server";

import { randomUUID } from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { TrackId } from "@/content/types";
import { type ActionState, adminAction, FormError, parseForm, publish } from "@/lib/admin/action";
import { TAGS } from "@/lib/data/public";
import { recordAudit } from "@/lib/admin/audit";
import { emailsWithAccounts } from "@/lib/admin/clerk-admins";
import {
  bulkUpdate,
  getRequest,
  insertMembers,
  type MemberPatch,
  removeMembers,
  rosterEmails,
  setRequestStatus,
  updateMember,
} from "@/lib/admin/members-db";
import { displayName, parseRosterInput, previewAdd } from "@/lib/members/roster";

const TRACKS = ["trading", "research", "development"] as const;
const STATUSES = ["active", "alumni", "inactive"] as const;

const optionalTrack = z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(TRACKS).nullable());
const optionalYear = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.int("Use a four-digit year, like 2027.").min(1990, "Use a four-digit year, like 2027.").max(2100, "Use a four-digit year, like 2027.").nullable(),
);
const optionalText = (max: number) => z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

/** Roster changes refresh the admin and Home's automatic member count (spec 06 §5.2 memberCount "auto"). */
function refresh() {
  revalidatePath("/admin", "layout");
  publish(TAGS.members);
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

// ── Add members ──

const defaultsSchema = z.object({
  status: z.enum(STATUSES).default("active"),
  track: optionalTrack,
  classYear: optionalYear,
  cohort: optionalText(40),
});

export type AddPreview = {
  add: Array<{ line: number; email: string; name: string }>;
  existing: Array<{ line: number; email: string }>;
  duplicates: Array<{ line: number; email: string }>;
  invalid: Array<{ line: number; text: string; reason: string }>;
};
export type AddState = ActionState & { preview?: AddPreview };

const defaultsFrom = (formData: FormData) =>
  parseForm(defaultsSchema, {
    status: formData.get("status") || undefined,
    track: formData.get("track"),
    classYear: formData.get("classYear"),
    cohort: formData.get("cohort"),
  });

/** Step 1 (spec 06 §6.2): show new, already-on-roster, duplicate and invalid rows before anything is saved. */
export async function previewMembers(_prev: AddState, formData: FormData): Promise<AddState> {
  return adminAction<AddState>(async () => {
    defaultsFrom(formData);
    const { rows, invalid } = parseRosterInput(String(formData.get("list") ?? ""));
    if (rows.length === 0 && invalid.length === 0) throw new FormError("Paste at least one email, or upload a CSV.", { list: "Paste at least one email." });
    const { add, existing, duplicates } = previewAdd(rows, await rosterEmails());
    return { preview: { add, existing, duplicates, invalid } };
  });
}

/** Step 2: add the new rows with the batch defaults, optionally emailing a sign-up link. Undoable as one change. */
export async function addMembers(_prev: AddState, formData: FormData): Promise<AddState> {
  return adminAction<AddState>(async (who) => {
    const defaults = defaultsFrom(formData);
    const { rows } = parseRosterInput(String(formData.get("list") ?? ""));
    const { add } = previewAdd(rows, await rosterEmails());
    if (add.length === 0) throw new FormError("Nobody new to add: everyone listed is already on the roster.");
    const inserted = await insertMembers(
      add.map((r) => ({
        email: r.email,
        name: displayName(r.name, r.email),
        status: defaults.status,
        track: (r.track ?? defaults.track) as TrackId | null,
        classYear: r.classYear ?? defaults.classYear,
        cohort: defaults.cohort,
      })),
    );
    const batchId = randomUUID();
    const undoId = await recordAudit({
      ...who,
      action: "add-members",
      entity: "member-batch",
      entityId: batchId,
      entityLabel: `${inserted.length} member${inserted.length === 1 ? "" : "s"}${defaults.cohort ? ` · ${defaults.cohort}` : ""}`,
      before: null,
      after: { rows: inserted },
    });

    let note = "";
    if (formData.get("invite") === "on" && inserted.length) {
      const emails = inserted.map((r) => r.email);
      const existing = await emailsWithAccounts(emails);
      const toInvite = emails.filter((e) => !existing.has(e));
      const client = await clerkClient();
      const redirectUrl = `${await origin()}/account/sign-up`;
      let sent = 0;
      for (const emailAddress of toInvite) {
        try {
          await client.invitations.createInvitation({ emailAddress, redirectUrl, ignoreExisting: true });
          sent++;
        } catch (error) {
          console.error("member invitation failed", emailAddress, error);
        }
      }
      note = ` Sign-up links sent to ${sent}.${existing.size ? ` ${existing.size} already had an account and can sign in now.` : ""}`;
    }
    refresh();
    return { ok: `Added ${inserted.length} to the roster.${note}`, undoId, redirectTo: `/admin/members?saved=${undoId ?? ""}` };
  });
}

// ── Edit one ──

const memberSchema = z.object({
  name: z.string().trim().min(1, "Add a name.").max(120),
  email: z.email("Use a valid email address.").transform((e) => e.toLowerCase()),
  status: z.enum(STATUSES),
  track: optionalTrack,
  classYear: optionalYear,
  cohort: optionalText(40),
  notes: optionalText(2000),
});

export async function updateMemberAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = parseForm(memberSchema, Object.fromEntries(["name", "email", "status", "track", "classYear", "cohort", "notes"].map((k) => [k, formData.get(k)])));
    const { before, after } = await updateMember(id, input);
    const undoId = await recordAudit({ ...who, action: "update", entity: "member", entityId: id, entityLabel: after.name, before, after });
    refresh();
    return { ok: "Saved · takes effect on their next page load", undoId, viewHref: "/portal" };
  });
}

export async function removeMemberAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const [before] = await removeMembers([id]);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "member", entityId: id, entityLabel: before.name, before, after: null });
    refresh();
    return { ok: `${before.name} removed from the roster.`, undoId, redirectTo: `/admin/members?saved=${undoId ?? ""}` };
  });
}

// ── Bulk ──

const bulkSchema = z.object({
  op: z.enum(["status", "track", "cohort", "remove"]),
  ids: z.array(z.uuid()).min(1, "Select at least one member."),
});

/** Bulk actions on selected rows (spec 06 §6.2), including year-end "Mark alumni". Undoable as one change. */
export async function bulkMembers(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    // "Mark alumni" (year end, spec 06 §6.2) is a shortcut for setting status to alumni.
    const markAlumni = formData.get("markAlumni") === "1";
    const { op, ids } = parseForm(bulkSchema, { op: markAlumni ? "status" : formData.get("op"), ids: formData.getAll("ids") });
    const batchId = randomUUID();
    if (op === "remove") {
      const before = await removeMembers(ids);
      const undoId = await recordAudit({
        ...who,
        action: "remove-members",
        entity: "member-batch",
        entityId: batchId,
        entityLabel: `Removed ${before.length} member${before.length === 1 ? "" : "s"}`,
        before: { rows: before },
        after: null,
      });
      refresh();
      return { ok: `Removed ${before.length} from the roster. Their accounts stay.`, undoId };
    }
    const raw = markAlumni ? "alumni" : formData.get("value");
    const patch: MemberPatch =
      op === "status"
        ? { status: parseForm(z.object({ v: z.enum(STATUSES) }), { v: raw }).v }
        : op === "track"
          ? { track: parseForm(z.object({ v: optionalTrack }), { v: raw }).v as TrackId | null }
          : { cohort: parseForm(z.object({ v: optionalText(40) }), { v: raw }).v };
    const { before, after } = await bulkUpdate(ids, patch);
    const what = op === "status" ? `status → ${patch.status}` : op === "track" ? `track → ${patch.track ?? "none"}` : `cohort → ${patch.cohort ?? "none"}`;
    const undoId = await recordAudit({
      ...who,
      action: "update-members",
      entity: "member-batch",
      entityId: batchId,
      entityLabel: `${after.length} member${after.length === 1 ? "" : "s"}: ${what}`,
      before: { rows: before },
      after: { rows: after },
    });
    refresh();
    return { ok: `Updated ${after.length}: ${what}.`, undoId };
  });
}

// ── Requests ──

export async function approveRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { id, track } = parseForm(z.object({ id: z.uuid(), track: optionalTrack }), { id: formData.get("id"), track: formData.get("track") });
    const req = await getRequest(id);
    if (!req || req.status !== "pending") throw new FormError("That request has already been handled.");
    const taken = (await rosterEmails()).has(req.email.toLowerCase());
    const [member] = taken
      ? []
      : await insertMembers([{ email: req.email.toLowerCase(), name: req.name, status: "active", track: track as TrackId | null, classYear: null, cohort: null, userId: req.userId }]);
    await setRequestStatus(id, "approved", who.actorId);
    const undoId = await recordAudit({
      ...who,
      action: "approve-request",
      entity: "membership-request",
      entityId: id,
      entityLabel: req.name,
      before: { status: "pending" },
      after: { status: "approved", member: member ?? null },
    });
    refresh();
    return { ok: taken ? `${req.name} was already on the roster; request approved.` : `${req.name} is now a member.`, undoId };
  });
}

export async function declineRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { id } = parseForm(z.object({ id: z.uuid() }), { id: formData.get("id") });
    const req = await getRequest(id);
    if (!req || req.status !== "pending") throw new FormError("That request has already been handled.");
    await setRequestStatus(id, "declined", who.actorId);
    const undoId = await recordAudit({
      ...who,
      action: "decline-request",
      entity: "membership-request",
      entityId: id,
      entityLabel: req.name,
      before: { status: "pending" },
      after: { status: "declined", member: null },
    });
    refresh();
    return { ok: `Declined ${req.name}'s request.`, undoId };
  });
}

// ── All accounts ──

/** Adds an existing account to the roster, already linked (spec 06 §6.2 All accounts). */
export async function makeMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const userId = String(formData.get("userId") ?? "");
    const client = await clerkClient();
    const user = await client.users.getUser(userId).catch(() => null);
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!user || !email) throw new FormError("That account has no email address to put on the roster.");
    if ((await rosterEmails()).has(email)) throw new FormError(`${email} is already on the roster.`);
    const [after] = await insertMembers([
      { email, name: user.fullName || displayName("", email), status: "active", track: null, classYear: null, cohort: null, userId },
    ]);
    const undoId = await recordAudit({ ...who, action: "create", entity: "member", entityId: after.id, entityLabel: after.name, before: null, after });
    refresh();
    return { ok: `${after.name} is now a member.`, undoId };
  });
}
