"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { site } from "@/content/site";
import type { Recruiting } from "@/content/types";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { getSeasonSetting, setSeasonSetting } from "@/lib/admin/lists-db";
import { optionalText } from "@/lib/admin/schemas";
import { setSetting } from "@/lib/admin/settings-db";
import { TAGS } from "@/lib/data/public";
import { collectSiteProblems } from "@/lib/validate-site";

/** "2026-10-17T23:59" from <input type="datetime-local">, or a date alone; blank becomes undefined. */
const when = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined), z.string().optional());

const schema = z.object({
  mode: z.enum(["open", "closed", "scheduled"], { error: "Pick open, closed or scheduled." }),
  applyUrl: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string()),
  interestFormUrl: when,
  cycleLabel: optionalText(40),
  applyDeadline: when,
  interviewStart: when,
  interviewEnd: when,
  decisionDate: when,
  nextApplicationOpenDate: when,
  applicationMinutes: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.int("Use whole minutes.").min(1).max(240).optional()),
});

const FIELDS = ["mode", "applyUrl", "interestFormUrl", "cycleLabel", "applyDeadline", "interviewStart", "interviewEnd", "decisionDate", "nextApplicationOpenDate", "applicationMinutes"];

/** Maps a site-validator message to the field it is about, so it shows under that input. */
function fieldOf(problem: string): string {
  const f = problem.replace(/^recruiting\./, "").split(/[ :.]/)[0];
  return f === "interviewWindow" ? "interviewEnd" : f;
}

/** Recruiting (spec 06 §6.5): every Apply surface reads this. The 05 §5 rules run before anything is saved. */
export async function saveRecruiting(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const v = parseForm(schema, Object.fromEntries(FIELDS.map((k) => [k, f.get(k)])));
    if (v.mode === "scheduled" && !v.nextApplicationOpenDate) throw new FormError("Scheduled needs a next-open date and time.", { nextApplicationOpenDate: "When should applications open?" });
    const recruiting: Recruiting = {
      mode: v.mode,
      applicationsOpen: v.mode === "open",
      applyUrl: v.applyUrl,
      ...(v.interestFormUrl ? { interestFormUrl: v.interestFormUrl } : {}),
      ...(v.cycleLabel ? { cycleLabel: v.cycleLabel } : {}),
      ...(v.applyDeadline ? { applyDeadline: v.applyDeadline } : {}),
      ...(v.interviewStart && v.interviewEnd ? { interviewWindow: { start: v.interviewStart, end: v.interviewEnd } } : {}),
      ...(v.decisionDate ? { decisionDate: v.decisionDate } : {}),
      ...(v.nextApplicationOpenDate ? { nextApplicationOpenDate: v.nextApplicationOpenDate } : {}),
      ...(v.applicationMinutes ? { applicationMinutes: v.applicationMinutes } : {}),
    };
    // A scheduled cycle is validated as it will be once it opens (the apply form must be a Google Form by then).
    const problems = collectSiteProblems({ ...site, recruiting: { ...recruiting, applicationsOpen: recruiting.applicationsOpen || v.mode === "scheduled" } });
    if (problems.length) {
      throw new FormError("Check the highlighted fields.", Object.fromEntries(problems.map((p) => [fieldOf(p), p.replace(/^recruiting\.\w+(\.\w+)?:? ?/, "")])));
    }
    const { before, after } = await setSetting("recruiting", recruiting);
    const undoId = await recordAudit({ ...who, action: "update", entity: "recruiting", entityId: "recruiting", entityLabel: "Recruiting", before, after });
    publish(TAGS.recruiting);
    revalidatePath("/admin", "layout");
    return { ok: SAVED, undoId, viewHref: "/apply" };
  });
}

const countSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("auto") }),
  z.object({ mode: z.literal("hidden") }),
  z.object({ mode: z.literal("manual"), value: z.coerce.number().int("Use a whole number.").min(1, "Use a number above zero.").max(5000) }),
]);

/** "Active members on Home" (spec 06 §6.5 Season card): auto (Active roster count), manual, or hidden. */
export async function saveMemberCount(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const memberCount = parseForm(countSchema, { mode: f.get("mode"), value: f.get("value") });
    const current = await getSeasonSetting();
    const { before, after } = await setSeasonSetting({ ...current, memberCount });
    const undoId = await recordAudit({ ...who, action: "update", entity: "season", entityId: "season", entityLabel: "Member count", before, after });
    publish(TAGS.season);
    revalidatePath("/admin", "layout");
    return { ok: SAVED, undoId, viewHref: "/" };
  });
}
