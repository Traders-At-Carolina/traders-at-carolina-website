import { UndoButton } from "@/components/admin/UndoButton";
import { historyFacets, latestIdsFor, listHistory } from "@/lib/admin/audit";
import { changedFields } from "@/lib/admin/diff";
import { MEMBER_AREAS } from "@/lib/admin/members-undo";
import { canUndoEntity } from "@/lib/admin/undo";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "History" };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const AREA: Record<string, string> = { photo: "Photos", "photo-slots": "Photo slots", admin: "Admins", ...MEMBER_AREAS };

const show = (v: unknown) => (v === undefined || v === null ? "—" : typeof v === "string" ? v : JSON.stringify(v));

/** Every change, newest first, with filters, a field-by-field diff and Undo (spec 06 §6.16). */
export default async function HistoryPage({ searchParams }: PageProps<"/admin/history">) {
  await requirePage();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
  const from = one(q.from);
  const to = one(q.to);
  const filter = {
    actor: one(q.actor),
    entity: one(q.area),
    from: from ? new Date(`${from}T00:00:00-04:00`) : undefined,
    to: to ? new Date(`${to}T23:59:59-04:00`) : undefined,
  };
  const [rows, facets] = await Promise.all([listHistory(filter), historyFacets()]);
  const latest = await latestIdsFor(rows);

  return (
    <>
      <h1 className="text-h1">History</h1>
      <p className="mt-4 max-w-prose text-body text-ink-2">Every change to the site and to admin access. Undo works on the latest change to each item.</p>

      <form className="mt-8 grid gap-4 sm:grid-cols-4" aria-label="Filter history">
        <label className="text-caption font-medium text-ink-2">
          Person
          <select name="actor" defaultValue={filter.actor ?? ""} className="mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body">
            <option value="">Everyone</option>
            {facets.actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          Area
          <select name="area" defaultValue={filter.entity ?? ""} className="mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body">
            <option value="">All areas</option>
            {facets.entities.map((e) => (
              <option key={e} value={e}>
                {AREA[e] ?? e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          From
          <input type="date" name="from" defaultValue={from ?? ""} className="mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body" />
        </label>
        <label className="text-caption font-medium text-ink-2">
          To
          <input type="date" name="to" defaultValue={to ?? ""} className="mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body" />
        </label>
        <div className="sm:col-span-4">
          <button type="submit" className="min-h-11 text-caption font-medium text-navy underline underline-offset-4">
            Apply filters
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 text-ink-3">No changes match.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {rows.map((r) => {
            const changes = changedFields(r.before as Record<string, unknown> | null, r.after as Record<string, unknown> | null);
            const undoable = canUndoEntity(r.entity) && Boolean(r.entityId) && latest.has(r.id) && (r.before != null || r.after != null);
            return (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-body text-black">
                    {r.entityLabel} <span className="text-ink-3">· {AREA[r.entity] ?? r.entity}</span>
                  </p>
                  <p className="text-caption text-ink-3">
                    {r.actorEmail ?? r.actorId} · {r.action} · <time dateTime={r.at.toISOString()}>{when.format(r.at)}</time>
                  </p>
                  {changes.length ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-caption text-navy">What changed</summary>
                      <table className="mt-2 w-full table-fixed text-left text-caption">
                        <thead>
                          <tr className="text-ink-3">
                            <th className="w-1/5 py-1 font-medium">Field</th>
                            <th className="py-1 font-medium">Before</th>
                            <th className="py-1 font-medium">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changes.map((c) => (
                            <tr key={c.field} className="border-t border-rule align-top">
                              <td className="py-1 pr-2">{c.field}</td>
                              <td className="break-words py-1 pr-2 text-ink-2">{show(c.before)}</td>
                              <td className="break-words py-1 text-black">{show(c.after)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  ) : null}
                </div>
                {undoable ? <UndoButton entryId={r.id} label={`${r.action} ${r.entityLabel}`} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
