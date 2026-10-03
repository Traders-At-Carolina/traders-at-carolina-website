import { SaveToast } from "@/components/admin/SaveToast";
import { getEntry } from "@/lib/admin/audit";

/** After a create or delete redirects with ?saved=<audit id>, shows the toast with Undo (spec 06 §6.0). */
export async function SavedFromParam({ saved, viewHref }: { saved: string | string[] | undefined; viewHref?: string }) {
  if (typeof saved !== "string" || !/^\d+$/.test(saved)) return null;
  const entry = await getEntry(Number(saved));
  if (!entry) return null;
  const message = entry.action === "delete" ? `${entry.entityLabel} removed.` : `${entry.entityLabel} added · live in a few seconds`;
  return <SaveToast state={{ ok: message, undoId: entry.id, viewHref, at: entry.id }} />;
}
