"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, adminAction, parseForm, publish } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { deleteContact, deleteScore, GAMES_TAG, scoreLabel } from "@/lib/admin/games-undo";

/** Game moderation (spec 11 §5.4). The page is otherwise read-only; these deletes are its only writes. */
const idSchema = z.object({ id: z.coerce.number({ error: "Unknown row." }).int("Unknown row.").positive("Unknown row.").max(Number.MAX_SAFE_INTEGER, "Unknown row.") });
const readId = (f: FormData) => parseForm(idSchema, { id: f.get("id") ?? undefined }).id;

function done(message: string, undoId: number | null): ActionState {
  publish(GAMES_TAG);
  revalidatePath("/admin", "layout");
  // The row disappears with the delete, so the page shows the toast (with Undo) from ?saved.
  return { ok: message, undoId, redirectTo: `/admin/games?saved=${undoId ?? ""}` };
}

/** Deletes a score and, with it, the contact volunteered after it (one entry, so one Undo restores both). */
export async function deleteGameScore(_prev: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = readId(f);
    const before = await deleteScore(id);
    const label = scoreLabel(before);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "game-score", entityId: String(id), entityLabel: label, before, after: null });
    return done(`${label} deleted.`, undoId);
  });
}

/** Deletes a volunteered contact; its score stays. */
export async function deleteGameContact(_prev: ActionState, f: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = readId(f);
    const before = await deleteContact(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "game-contact", entityId: String(id), entityLabel: before.name, before, after: null });
    return done(`${before.name} deleted.`, undoId);
  });
}
