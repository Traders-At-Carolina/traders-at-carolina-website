import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";
import { type ActionState, type Actor, FormError, publish } from "@/lib/admin/action";
import { type AuditRow, getEntry, latestEntryId, recordAudit } from "@/lib/admin/audit";
import { MEMBER_UNDO_HANDLERS } from "@/lib/admin/members-undo";
import { photoSnapshot, type PhotoSnapshot, type SlotPage } from "@/lib/admin/photos";
import { getPhoto, setSlots, type Slots } from "@/lib/admin/photos-db";
import { planUndo } from "@/lib/admin/undo-plan";
import { TAGS } from "@/lib/data/public";

/**
 * How each audited entity is undone (spec 06 §3). Each returns the item's state before and after the undo, which is
 * itself audited (action "undo"), so an undo can be undone too. New editors register here.
 */
export type Handler = {
  label: string;
  tags: string[];
  viewHref: (entityId: string) => string;
  remove?: (entityId: string, entry: AuditRow) => Promise<{ before: unknown }>;
  recreate?: (state: Record<string, unknown>, entry: AuditRow) => Promise<{ after: unknown }>;
  restore: (entityId: string, state: Record<string, unknown>, entry: AuditRow) => Promise<{ before: unknown; after: unknown }>;
};

const photoHandler: Handler = {
  label: "Photo",
  tags: [TAGS.photos],
  viewHref: () => "/",
  remove: async (id) => {
    const row = await getPhoto(id);
    if (!row) throw new FormError("That photo is already gone.");
    if (row.homeOrder != null || row.membershipOrder != null) throw new FormError("Take this photo off Home and Membership first.");
    await db().delete(photos).where(eq(photos.id, id));
    return { before: photoSnapshot(row) };
  },
  recreate: async (state) => {
    const s = state as PhotoSnapshot;
    const [row] = await db().insert(photos).values({ id: s.id, image: s.image, alt: s.alt, caption: s.caption, ratio: s.ratio }).returning();
    return { after: photoSnapshot(row) };
  },
  restore: async (id, state) => {
    const current = await getPhoto(id);
    if (!current) throw new FormError("That photo no longer exists.");
    const s = state as PhotoSnapshot;
    const [row] = await db()
      .update(photos)
      .set({ image: s.image, alt: s.alt, caption: s.caption, ratio: s.ratio, updatedAt: new Date() })
      .where(eq(photos.id, id))
      .returning();
    return { before: photoSnapshot(current), after: photoSnapshot(row) };
  },
};

const slotsHandler: Handler = {
  label: "Photo slots",
  tags: [TAGS.photos],
  viewHref: (page) => (page === "membership" ? "/membership" : "/"),
  restore: async (page, state) => {
    if (page !== "home" && page !== "membership") throw new FormError("Unknown page.");
    const { before, after } = await setSlots(page as SlotPage, (state as { slots: Slots }).slots);
    return { before: { slots: before }, after: { slots: after } };
  },
};

export const UNDO_HANDLERS: Record<string, Handler> = { photo: photoHandler, "photo-slots": slotsHandler, ...MEMBER_UNDO_HANDLERS };

export function canUndoEntity(entity: string): boolean {
  return entity in UNDO_HANDLERS;
}

/** Undoes one audit entry, if it is still the latest change to its item. */
export async function undoEntry(entryId: number, who: Actor): Promise<ActionState> {
  const entry = await getEntry(entryId);
  if (!entry) throw new FormError("That change no longer exists.");
  const handler = UNDO_HANDLERS[entry.entity];
  if (!handler || !entry.entityId) throw new FormError("This change can't be undone.");
  const plan = planUndo(entry, (await latestEntryId(entry.entity, entry.entityId)) ?? entry.id);

  let before: unknown = null;
  let after: unknown = null;
  if (plan.kind === "refuse") throw new FormError(plan.reason);
  if (plan.kind === "remove") {
    if (!handler.remove) throw new FormError("This change can't be undone.");
    ({ before } = await handler.remove(entry.entityId, entry));
  } else if (plan.kind === "recreate") {
    if (!handler.recreate) throw new FormError("This change can't be undone.");
    ({ after } = await handler.recreate(plan.state, entry));
  } else {
    ({ before, after } = await handler.restore(entry.entityId, plan.state, entry));
  }

  const undoId = await recordAudit({
    ...who,
    action: "undo",
    entity: entry.entity,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    before,
    after,
  });
  publish(...handler.tags);
  return { ok: `Undone · ${handler.label.toLowerCase()} restored`, undoId, viewHref: handler.viewHref(entry.entityId) };
}

