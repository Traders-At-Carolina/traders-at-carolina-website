"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, adminAction, parseForm, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deleteAnnouncement, insertAnnouncement, updateAnnouncement } from "@/lib/admin/portal-db";
import { announcementSchema, readAnnouncementForm } from "@/lib/admin/portal-schemas";

/**
 * Announcements (spec 06 §6.12). The portal reads them per request, uncached (§8), so a save needs no cache tag: the
 * next portal load shows it. Only the console's own pages are revalidated.
 */
const read = (f: FormData) => parseForm(announcementSchema, readAnnouncementForm(f));
const done = () => revalidatePath("/admin", "layout");

export async function createAnnouncement(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertAnnouncement(read(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "announcement", entityId: after.id, entityLabel: after.title, before: null, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal", redirectTo: `/admin/announcements?saved=${undoId ?? ""}` };
  });
}

export async function updateAnnouncementAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updateAnnouncement(id, read(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "announcement", entityId: id, entityLabel: after.title, before, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}

export async function deleteAnnouncementAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deleteAnnouncement(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "announcement", entityId: id, entityLabel: before.title, before, after: null });
    done();
    return { ok: `${before.title} deleted.`, undoId, viewHref: "/portal", redirectTo: `/admin/announcements?saved=${undoId ?? ""}` };
  });
}
