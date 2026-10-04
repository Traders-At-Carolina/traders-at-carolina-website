import { ChevronRight, History, Search } from "lucide-react";
import { UndoButton } from "@/components/admin/UndoButton";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { Field, Input, Select } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { historyFacets, latestIdsFor, listHistory } from "@/lib/admin/audit";
import { changedFields } from "@/lib/admin/diff";
import { LIST_AREAS } from "@/lib/admin/lists-undo";
import { MEMBER_AREAS } from "@/lib/admin/members-undo";
import { canUndoEntity } from "@/lib/admin/undo";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "History" };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const AREA: Record<string, string> = { photo: "Photos", "photo-slots": "Photo slots", admin: "Admins", ...MEMBER_AREAS, ...LIST_AREAS };

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
      <PageHeader title="History" description="Every change to the site and to admin access. Undo works on the latest change to each item." />

      <Card>
        <form aria-label="Filter history" className="grid gap-3 border-b border-ui-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <Field label="Person">
            <Select name="actor" defaultValue={filter.actor ?? ""}>
              <option value="">Everyone</option>
              {facets.actors.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Area">
            <Select name="area" defaultValue={filter.entity ?? ""}>
              <option value="">All areas</option>
              {facets.entities.map((e) => (
                <option key={e} value={e}>
                  {AREA[e] ?? e}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" name="from" defaultValue={from ?? ""} className="tabular-nums" />
          </Field>
          <Field label="To">
            <Input type="date" name="to" defaultValue={to ?? ""} className="tabular-nums" />
          </Field>
          <Button type="submit" icon={Search}>
            Apply filters
          </Button>
        </form>

        {rows.length === 0 ? (
          <EmptyState icon={History} title="No changes match" description="Try a wider date range or clear a filter." />
        ) : (
          <ul className="divide-y divide-ui-border">
            {rows.map((r) => {
              const changes = changedFields(r.before as Record<string, unknown> | null, r.after as Record<string, unknown> | null);
              const undoable = canUndoEntity(r.entity) && Boolean(r.entityId) && latest.has(r.id) && (r.before != null || r.after != null);
              const who = r.actorEmail ?? r.actorId;
              return (
                <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                  <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-ui-full bg-ui-subtle text-ui-hint font-semibold text-ui-text-2 uppercase">
                    {(who ?? "?").charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ui-base text-ui-text">
                      <Badge className="mr-2 align-middle">{r.action}</Badge>
                      <span className="font-medium">{r.entityLabel}</span>
                      <span className="text-ui-text-3"> · {AREA[r.entity] ?? r.entity}</span>
                    </p>
                    <p className="mt-0.5 text-ui-hint text-ui-text-3">
                      {who} ·{" "}
                      <time dateTime={r.at.toISOString()} className="tabular-nums">
                        {when.format(r.at)}
                      </time>
                    </p>
                    {changes.length ? (
                      <details className="group mt-2">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-ui-sm text-ui-label font-medium text-ui-accent hover:text-ui-accent-hover [&::-webkit-details-marker]:hidden">
                          <ChevronRight aria-hidden className="size-3.5 transition-transform duration-150 group-open:rotate-90" />
                          What changed <span className="font-normal text-ui-text-3 tabular-nums">({changes.length})</span>
                        </summary>
                        <div className="mt-2 overflow-x-auto rounded-ui-md border border-ui-border">
                          <table className="w-full min-w-[28rem] table-fixed text-left text-ui-label">
                            <thead className="bg-ui-subtle text-ui-text-2">
                              <tr>
                                <th scope="col" className="w-1/5 px-3 py-1.5 font-medium">
                                  Field
                                </th>
                                <th scope="col" className="px-3 py-1.5 font-medium">
                                  Before
                                </th>
                                <th scope="col" className="px-3 py-1.5 font-medium">
                                  After
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border">
                              {changes.map((c) => (
                                <tr key={c.field} className="align-top">
                                  <td className="px-3 py-1.5 font-medium text-ui-text-2">{c.field}</td>
                                  <td className="px-3 py-1.5 break-words text-ui-danger line-through decoration-ui-danger/60">{show(c.before)}</td>
                                  <td className="px-3 py-1.5 break-words text-ui-success">{show(c.after)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    ) : null}
                  </div>
                  {undoable ? <UndoButton entryId={r.id} label={`${r.action} ${r.entityLabel}`} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
