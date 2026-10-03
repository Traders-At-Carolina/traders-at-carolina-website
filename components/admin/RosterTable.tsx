"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ActionState } from "@/lib/admin/action";

export type RosterRow = {
  id: string;
  name: string;
  email: string;
  status: "active" | "alumni" | "inactive";
  track: string | null;
  classYear: number | null;
  cohort: string | null;
  signedUp: boolean;
};

const STATUS = { active: "Active", alumni: "Alumni", inactive: "Inactive" } as const;
const TRACK: Record<string, string> = { trading: "Trading", research: "Research", development: "Development" };
const ctl = "min-h-11 border border-rule bg-white px-2 text-body focus:border-navy focus:outline-none";

/** Roster rows with selection and bulk actions (spec 06 §6.2): set status, track or cohort, remove, Mark alumni. */
export function RosterTable({ rows, action, classYear }: { rows: RosterRow[]; action: (p: ActionState, f: FormData) => Promise<ActionState>; classYear?: number }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [op, setOp] = useState("status");
  const all = rows.length > 0 && selected.size === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const removing = submitter?.value === "remove" || op === "remove";
        if (removing && !window.confirm(`Remove ${selected.size} from the roster? They lose member access on their next page load; their accounts stay.`)) e.preventDefault();
      }}
    >
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <div className="flex flex-wrap items-end gap-3 border-y border-rule py-3" role="group" aria-label="Bulk actions">
        <p className="min-h-11 content-center text-caption text-ink-2" aria-live="polite">
          {selected.size ? `${selected.size} selected` : "Select members for bulk actions"}
        </p>
        <label className="text-caption font-medium text-ink-2">
          Action
          <select name="op" value={op} onChange={(e) => setOp(e.target.value)} className={`${ctl} ml-2`}>
            <option value="status">Set status</option>
            <option value="track">Set track</option>
            <option value="cohort">Set cohort</option>
            <option value="remove">Remove</option>
          </select>
        </label>
        {op === "status" ? (
          <select name="value" aria-label="New status" className={ctl} defaultValue="alumni">
            {Object.entries(STATUS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ) : op === "track" ? (
          <select name="value" aria-label="New track" className={ctl}>
            <option value="">No track</option>
            {Object.entries(TRACK).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ) : op === "cohort" ? (
          <input name="value" aria-label="New cohort" placeholder="e.g. Fall 2026" className={ctl} />
        ) : null}
        <button type="submit" disabled={pending || selected.size === 0} className="min-h-11 px-3 font-semibold text-navy underline underline-offset-4 disabled:opacity-50">
          {pending ? "Working…" : "Apply"}
        </button>
        {classYear ? (
          <button
            type="submit"
            name="markAlumni"
            value="1"
            disabled={pending || selected.size === 0}
            className="min-h-11 px-3 font-semibold text-navy underline underline-offset-4 disabled:opacity-50"
          >
            Mark alumni
          </button>
        ) : null}
      </div>
      {state.error ? (
        <p role="alert" className="mt-3 text-body text-black">
          {state.error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 text-ink-3">No members match.</p>
      ) : (
        <table className="mt-2 w-full text-left text-body">
          <thead className="sr-only md:not-sr-only">
            <tr className="text-caption text-ink-3">
              <th className="w-10 py-2">
                <input
                  type="checkbox"
                  aria-label={all ? "Clear selection" : `Select all ${rows.length}`}
                  checked={all}
                  onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
                  className="size-5"
                />
              </th>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Track</th>
              <th className="py-2 font-medium">Class</th>
              <th className="py-2 font-medium">Cohort</th>
              <th className="py-2 font-medium">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map((r) => (
              <tr key={r.id} className="grid grid-cols-[2.5rem_1fr] gap-x-2 py-3 md:table-row md:py-0">
                <td className="row-span-3 md:py-3">
                  <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="size-5" />
                </td>
                <td className="md:py-3">
                  <Link href={`/admin/members/${r.id}`} className="text-black hover:underline">
                    {r.name}
                  </Link>
                  <span className="block text-caption text-ink-3">{r.email}</span>
                </td>
                <td className="text-caption md:py-3 md:text-body">
                  {STATUS[r.status]}
                  <span className="md:hidden">
                    {r.track ? ` · ${TRACK[r.track]}` : ""}
                    {r.classYear ? ` · '${String(r.classYear).slice(2)}` : ""}
                    {r.signedUp ? " · Signed up" : " · Not signed up yet"}
                  </span>
                </td>
                <td className="hidden md:table-cell md:py-3">{r.track ? TRACK[r.track] : "—"}</td>
                <td className="hidden tabular md:table-cell md:py-3">{r.classYear ?? "—"}</td>
                <td className="hidden md:table-cell md:py-3">{r.cohort ?? "—"}</td>
                <td className="hidden text-caption text-ink-2 md:table-cell md:py-3">{r.signedUp ? "Signed up" : "Not signed up yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <SaveToast state={state} />
    </form>
  );
}
