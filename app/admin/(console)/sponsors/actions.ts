"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, adminAction, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deleteSponsor, insertSponsor, updateSponsor } from "@/lib/admin/lists-db";
import { optionalHttps, optionalImage, optionalText } from "@/lib/admin/schemas";
import { TAGS } from "@/lib/data/public";

/** Sponsors (spec 06 §6.7), shown on About and Home. */
const schema = z.object({
  name: z.string().trim().min(1, "Add the firm's name.").max(80),
  relationship: optionalText(80),
  url: optionalHttps(),
  logo: optionalImage,
});
const read = (f: FormData) => parseForm(schema, { name: f.get("name"), relationship: f.get("relationship"), url: f.get("url"), logo: f.get("logo") });
const done = () => revalidatePath("/admin", "layout");

export async function createSponsor(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertSponsor(read(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "sponsor", entityId: after.id, entityLabel: after.name, before: null, after });
    publish(TAGS.sponsors);
    done();
    return { ok: SAVED, undoId, viewHref: "/about", redirectTo: `/admin/sponsors?saved=${undoId ?? ""}` };
  });
}

export async function updateSponsorAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updateSponsor(id, read(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "sponsor", entityId: id, entityLabel: after.name, before, after });
    publish(TAGS.sponsors);
    done();
    return { ok: SAVED, undoId, viewHref: "/about" };
  });
}

export async function deleteSponsorAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deleteSponsor(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "sponsor", entityId: id, entityLabel: before.name, before, after: null });
    publish(TAGS.sponsors);
    done();
    return { ok: `${before.name} removed.`, undoId, redirectTo: `/admin/sponsors?saved=${undoId ?? ""}` };
  });
}
