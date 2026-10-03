"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, adminAction, FormError, parseForm, publish, SAVED } from "@/lib/admin/action";
import { recordAudit } from "@/lib/admin/audit";
import { SLOT_LABEL, type SlotPage } from "@/lib/admin/photos";
import { deletePhoto, insertPhoto, setSlots, updatePhoto, type Slots } from "@/lib/admin/photos-db";
import { TAGS } from "@/lib/data/public";

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/** An uploaded image: on the club's Blob store, measured, with an optional small blur (spec 06 §5.3). */
const imageSchema = z.object({
  src: z.url().refine((u) => BLOB_HOST.test(new URL(u).hostname), "Upload the image here rather than linking to it."),
  width: z.int().positive(),
  height: z.int().positive(),
  blurDataURL: z.string().startsWith("data:image/").max(4096).optional(),
});

const photoSchema = z.object({
  image: z
    .string({ error: "Add a photo." })
    .min(1, "Add a photo.")
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Add a photo." });
        return z.NEVER;
      }
    })
    .pipe(imageSchema),
  alt: z.string().trim().min(1, "Describe the photo for people using screen readers.").max(300),
  caption: z.string().trim().min(1, "Add a short caption.").max(120, "Keep the caption under 120 characters."),
  ratio: z.enum(["3:2", "4:5"], { error: "Pick a crop." }),
});

const fields = (formData: FormData) => ({
  image: formData.get("image"),
  alt: formData.get("alt"),
  caption: formData.get("caption"),
  ratio: formData.get("ratio"),
});

function done(message: string, undoId: number | null, viewHref = "/"): ActionState {
  revalidatePath("/admin", "layout");
  return { ok: message, undoId, viewHref };
}

export async function createPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = parseForm(photoSchema, fields(formData));
    const after = await insertPhoto(input);
    const undoId = await recordAudit({ ...who, action: "create", entity: "photo", entityId: after.id, entityLabel: after.caption, before: null, after });
    // A new photo isn't on any page yet, so nothing public changes until it is slotted.
    revalidatePath("/admin", "layout");
    return { ok: "Added to the library. Put it on a page below.", undoId, redirectTo: `/admin/photos?saved=${undoId ?? ""}` };
  });
}

export async function updatePhotoAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const input = parseForm(photoSchema, fields(formData));
    const { before, after } = await updatePhoto(id, input);
    const undoId = await recordAudit({ ...who, action: "update", entity: "photo", entityId: id, entityLabel: after.caption, before, after });
    publish(TAGS.photos);
    return done(SAVED, undoId);
  });
}

export async function deletePhotoAction(id: string): Promise<ActionState> {
  return adminAction(async (who) => {
    const before = await deletePhoto(id);
    const undoId = await recordAudit({ ...who, action: "delete", entity: "photo", entityId: id, entityLabel: before.caption, before, after: null });
    revalidatePath("/admin", "layout");
    return { ok: "Photo deleted.", undoId, redirectTo: `/admin/photos?saved=${undoId ?? ""}` };
  });
}

const slotsSchema = z.object({ page: z.enum(["home", "membership"]) });

/** Saves one page's three slots as a single, undoable change (spec 06 §6.6). */
export async function saveSlots(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (who) => {
    const { page } = parseForm(slotsSchema, { page: formData.get("page") });
    const next = [1, 2, 3].map((n) => String(formData.get(`slot${n}`) ?? "") || null) as Slots;
    if (next.every((id) => id === null) && formData.get("confirmEmpty") !== "yes") {
      // Clearing every slot hides the section; the form asks first and resends with confirmEmpty.
      throw new FormError(`This hides the ${SLOT_LABEL[page]} photos. Save again to confirm.`);
    }
    const { before, after } = await setSlots(page as SlotPage, next);
    const undoId = await recordAudit({
      ...who,
      action: "reorder",
      entity: "photo-slots",
      entityId: page,
      entityLabel: `${SLOT_LABEL[page]} photos`,
      before: { slots: before },
      after: { slots: after },
    });
    publish(TAGS.photos);
    return done(SAVED, undoId, page === "membership" ? "/membership" : "/");
  });
}
