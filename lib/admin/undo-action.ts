"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, adminAction } from "@/lib/admin/action";
import { undoEntry } from "@/lib/admin/undo";

/** Undo from the save toast, History or the Overview (spec 06 §3, §6.16). */
export async function undoChange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const id = Number(formData.get("entryId"));
    if (!Number.isInteger(id) || id <= 0) return { error: "That change can't be found." };
    const result = await undoEntry(id, who);
    revalidatePath("/admin", "layout");
    return result;
  });
}
