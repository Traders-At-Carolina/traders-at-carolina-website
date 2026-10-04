"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, adminAction, FormError, parseForm, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deletePortalLink, insertPortalLink, linkOrder, moveInOrder, setLinkOrders, updatePortalLink } from "@/lib/admin/portal-db";
import { portalLinkSchema, portalSettingsFormSchema, readPortalLinkForm } from "@/lib/admin/portal-schemas";
import { setSetting } from "@/lib/admin/settings-db";
import { parsePortalSetting, readPortalSetting } from "@/lib/members/settings";

/**
 * Portal settings and member links (spec 06 §6.13). The portal and membership checks read these per request (§8),
 * so a save takes effect on the next page load without any cache tag.
 */
const done = () => revalidatePath("/admin", "layout");

/** Welcome lines and the two access switches, stored as the `portal` setting (§5.2). */
export async function savePortalSettings(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const v = parseForm(portalSettingsFormSchema, {
      welcomeMember: f.get("welcomeMember"),
      welcomeVisitor: f.get("welcomeVisitor"),
      alumniAccess: f.get("alumniAccess"),
      acceptRequests: f.get("acceptRequests"),
    });
    const next = parsePortalSetting({
      alumniAccess: v.alumniAccess,
      acceptRequests: v.acceptRequests,
      ...(v.welcomeMember ? { welcomeMember: v.welcomeMember } : {}),
      ...(v.welcomeVisitor ? { welcomeVisitor: v.welcomeVisitor } : {}),
    });
    // The effective value before (the defaults until the first save), so even the first save can be undone.
    const before = await readPortalSetting();
    await setSetting("portal", next);
    const undoId = await recordAudit({ ...who, action: "update", entity: "portal-settings", entityId: "portal", entityLabel: "Portal settings", before, after: next });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}

const readLink = (f: FormData) => parseForm(portalLinkSchema, readPortalLinkForm(f));

export async function createPortalLink(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertPortalLink(readLink(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "portal-link", entityId: after.id, entityLabel: after.label, before: null, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}

export async function updatePortalLinkAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updatePortalLink(id, readLink(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "portal-link", entityId: id, entityLabel: after.label, before, after });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}

export async function deletePortalLinkAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deletePortalLink(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "portal-link", entityId: id, entityLabel: before.label, before, after: null });
    done();
    return { ok: `${before.label} removed.`, undoId, viewHref: "/portal" };
  });
}

/** Moves a member link up or down, as one undoable change (entity "portal-link-order"). */
export async function movePortalLink(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = String(f.get("id") ?? "");
    const before = await linkOrder();
    const after = moveInOrder(before, id, f.get("dir") === "up" ? "up" : "down");
    if (!after) throw new FormError("It can't move further.");
    await setLinkOrders(after);
    const undoId = await recordAudit({ ...who, action: "reorder", entity: "portal-link-order", entityId: "links", entityLabel: "Member link order", before: { rows: before }, after: { rows: after } });
    done();
    return { ok: SAVED, undoId, viewHref: "/portal" };
  });
}
