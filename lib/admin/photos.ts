import type { ImageAsset } from "@/content/types";

export type SlotPage = "home" | "membership";

/** A photo's own content, as stored in the audit log. Slots are audited separately (entity "photo-slots"). */
export type PhotoSnapshot = { id: string; image: ImageAsset; alt: string; caption: string; ratio: "3:2" | "4:5" };

export function photoSnapshot(row: PhotoSnapshot & Record<string, unknown>): PhotoSnapshot {
  return { id: row.id, image: row.image, alt: row.alt, caption: row.caption, ratio: row.ratio };
}

/**
 * Why a page's slot assignment can't be saved, or null. Home "Inside the club" takes 0 or 2–3 photos (01 §6);
 * Membership takes 0, the wide band alone, or the wide band plus the pair after Activities (03).
 */
export function slotProblem(page: SlotPage, ids: string[]): string | null {
  if (new Set(ids).size !== ids.length) return "Each photo can appear once per page.";
  if (page === "home" && ids.length === 1) return "Inside the club needs at least 2 photos. Add another, or clear the slot to hide the section.";
  if (page === "membership" && ids.length === 2) return "Add a third photo or clear one: the pair after Activities needs both slots 2 and 3.";
  return null;
}

export const SLOT_LABEL: Record<SlotPage, string> = { home: "Home", membership: "Membership" };
