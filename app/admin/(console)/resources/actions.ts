"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, adminAction, FormError, parseForm, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deleteResource, getResource, insertResource, moveInOrder, sectionOrder, setResourceOrders, updateResource } from "@/lib/admin/portal-db";
import { readResourceForm, resourceSchema } from "@/lib/admin/portal-schemas";
import { privateBlobToken } from "@/lib/admin/upload-policy";

/**
 * Resources (spec 06 §6.11). Uploaded files live in the private Blob store and are served only through
 * /portal/files/[id]; without BLOB_PRIVATE_READ_WRITE_TOKEN only links can be saved. Portal getters are uncached
 * (§8), so saves publish no cache tag.
 */
const read = (f: FormData) => parseForm(resourceSchema({ uploadsEnabled: Boolean(privateBlobToken()) }), readResourceForm(f));
const done = () => revalidatePath("/admin", "layout");

export async function createResource(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertResource(read(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "resource", entityId: after.id, entityLabel: after.title, before: null, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal", redirectTo: `/admin/resources?saved=${undoId ?? ""}` };
  });
}

export async function updateResourceAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updateResource(id, read(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "resource", entityId: id, entityLabel: after.title, before, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}

/** Deletes the row; the file stays in the private store so Undo restores the resource intact. */
export async function deleteResourceAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deleteResource(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "resource", entityId: id, entityLabel: before.title, before, after: null });
    done();
    return { ok: `${before.title} deleted.`, undoId, viewHref: "/portal", redirectTo: `/admin/resources?saved=${undoId ?? ""}` };
  });
}

/** Moves a resource up or down within its section (pinned ones among the pinned), as one undoable change. */
export async function moveResource(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = String(f.get("id") ?? "");
    const row = await getResource(id);
    if (!row) throw new FormError("That resource no longer exists.");
    const before = await sectionOrder(row.section, row.pinned);
    const after = moveInOrder(before, id, f.get("dir") === "up" ? "up" : "down");
    if (!after) throw new FormError("It can't move further.");
    await setResourceOrders(after);
    const group = `${row.section}:${row.pinned ? "pinned" : "rest"}`;
    const undoId = await recordAudit({ ...who, action: "reorder", entity: "resource-order", entityId: group, entityLabel: "Resource order", before: { rows: before }, after: { rows: after } });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}
