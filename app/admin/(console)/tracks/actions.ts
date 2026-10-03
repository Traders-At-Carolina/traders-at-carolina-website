"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { membership } from "@/content/membership";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { getTrack, listPeople, listTracks, updateTrack } from "@/lib/admin/lists-db";
import { optionalText } from "@/lib/admin/schemas";
import { TAGS } from "@/lib/data/public";
import { collectMembershipProblems } from "@/lib/validate-membership";

/** The three fixed tracks (spec 06 §6.9). The 03 §5 rules run on the proposed set of tracks before saving. */
const schema = z.object({
  roleLabel: z.string().trim().min(1, "Add a role label.").max(60),
  name: z.string().trim().min(1, "Add a name.").max(60),
  description: z.string().trim().min(1, "Add a description.").max(600),
  goodFit: optionalText(200),
  sampleProblem: optionalText(400),
  recommendedBackground: z.array(z.string().trim().min(1)).min(2, "List 2 to 4 items.").max(4, "List 2 to 4 items."),
  leadSlug: optionalText(80),
});

export async function updateTrackAction(id: "trading" | "research" | "development", _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = parseForm(schema, {
      roleLabel: f.get("roleLabel"),
      name: f.get("name"),
      description: f.get("description"),
      goodFit: f.get("goodFit"),
      sampleProblem: f.get("sampleProblem"),
      recommendedBackground: String(f.get("recommendedBackground") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      leadSlug: f.get("leadSlug"),
    });
    if (!(await getTrack(id))) throw new FormError("That track no longer exists.");
    // Only visible officers can lead a track (spec 06 §6.3), and the 03 §5 rules apply to the whole set.
    const visible = (await listPeople()).filter((p) => p.visible).map((p) => p.slug);
    const proposed = (await listTracks()).map((t) =>
      t.id === id
        ? { id, ...input, goodFit: input.goodFit ?? undefined, sampleProblem: input.sampleProblem ?? undefined, leadSlug: input.leadSlug ?? undefined }
        : { ...t, goodFit: t.goodFit ?? undefined, sampleProblem: t.sampleProblem ?? undefined, leadSlug: t.leadSlug ?? undefined },
    );
    const order = ["trading", "research", "development"];
    proposed.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const problems = collectMembershipProblems({ ...membership, tracks: proposed }, visible).filter((p) => p.startsWith(`tracks.${id}`) || p.startsWith("tracks must"));
    if (problems.length) throw new FormError(problems.map((p) => p.replace(`tracks.${id}.`, "").replace(`tracks.${id} `, "")).join(" "));
    const { before, after } = await updateTrack(id, input);
    const undoId = await recordAudit({ ...who, action: "update", entity: "track", entityId: id, entityLabel: after.name, before, after });
    publish(TAGS.tracks);
    revalidatePath("/admin", "layout");
    return { ok: SAVED, undoId, viewHref: "/membership#tracks" };
  });
}
