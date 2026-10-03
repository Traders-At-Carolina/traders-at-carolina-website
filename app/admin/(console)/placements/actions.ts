"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deletePlacement, insertPlacement, setWallOrders, updatePlacement, wallOrder } from "@/lib/admin/lists-db";
import { checkbox, optionalImage } from "@/lib/admin/schemas";
import { TAGS } from "@/lib/data/public";

/** Placements (spec 06 §6.8): the Team firm list, the wall on Team and in the footer, and officers' badges. */
const schema = z
  .object({ firm: z.string().trim().min(1, "Add the firm's name.").max(80), logo: optionalImage, logoOnDark: optionalImage, showOnWall: checkbox })
  .refine((v) => !v.showOnWall || v.logo, { path: ["logo"], message: "The placement wall needs a logo for light backgrounds." });
const read = (f: FormData) => parseForm(schema, { firm: f.get("firm"), logo: f.get("logo"), logoOnDark: f.get("logoOnDark"), showOnWall: f.get("showOnWall") });
const done = () => revalidatePath("/admin", "layout");

export async function createPlacement(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const after = await insertPlacement(read(f));
    const undoId = await recordAudit({ ...who, action: "create", entity: "placement", entityId: after.id, entityLabel: after.firm, before: null, after });
    publish(TAGS.placements);
    done();
    return { ok: SAVED, undoId, viewHref: "/team", redirectTo: `/admin/placements?saved=${undoId ?? ""}` };
  });
}

export async function updatePlacementAction(id: string, _p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { before, after } = await updatePlacement(id, read(f));
    const undoId = await recordAudit({ ...who, action: "update", entity: "placement", entityId: id, entityLabel: after.firm, before, after });
    publish(TAGS.placements);
    done();
    return { ok: SAVED, undoId, viewHref: "/team" };
  });
}

export async function deletePlacementAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deletePlacement(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "placement", entityId: id, entityLabel: before.firm, before, after: null });
    publish(TAGS.placements);
    done();
    return { ok: `${before.firm} removed. Officers who listed it keep their placement line but lose the badge.`, undoId, redirectTo: `/admin/placements?saved=${undoId ?? ""}` };
  });
}

/** Moves one firm up or down the wall, as one undoable change (entity "wall-order"). */
export async function moveOnWall(_p: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = String(f.get("id") ?? "");
    const dir = f.get("dir") === "up" ? -1 : 1;
    const before = await wallOrder();
    const i = before.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= before.length) throw new FormError("It can't move further.");
    const ids = before.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const after = ids.map((rid, n) => ({ id: rid, wallOrder: n + 1 }));
    await setWallOrders(after);
    const undoId = await recordAudit({ ...who, action: "reorder", entity: "wall-order", entityId: "wall", entityLabel: "Placement wall order", before: { rows: before }, after: { rows: after } });
    publish(TAGS.placements);
    done();
    return { ok: SAVED, undoId, viewHref: "/team" };
  });
}
