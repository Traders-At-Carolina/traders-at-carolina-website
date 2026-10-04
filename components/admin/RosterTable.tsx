"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { StatusPill } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { Input, Select } from "@/components/admin/ui/Field";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { cx } from "@/components/admin/ui/cx";
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
const checkbox = "relative z-10 size-4 accent-ui-accent";

/** Roster rows with selection and bulk actions (spec 06 §6.2): set status, track or cohort, remove, Mark alumni. */
export function RosterTable({ rows, action, classYear }: { rows: RosterRow[]; action: (p: ActionState, f: FormData) => Promise<ActionState>; classYear?: number }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [op, setOp] = useState("status");
  const [confirming, setConfirming] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const submitterRef = useRef<HTMLElement | null>(null);
  const confirmed = useRef(false);
  const all = rows.length > 0 && selected.size === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  return (
    <form
      ref={form}
      action={formAction}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const removing = submitter?.value === "remove" || op === "remove";
        if (!removing) return;
        if (confirmed.current) {
          confirmed.current = false;
          setConfirming(false);
          return;
        }
        e.preventDefault();
        submitterRef.current = submitter;
        setConfirming(true);
      }}
    >
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <div
        role="group"
        aria-label="Bulk actions"
        className={cx("flex flex-wrap items-center gap-2 border-b border-ui-border px-6 py-3 transition-colors duration-150", selected.size ? "bg-ui-accent-soft" : "bg-ui-canvas")}
      >
        <p className={cx("mr-auto text-ui-label", selected.size ? "font-medium text-ui-accent" : "text-ui-text-2")} aria-live="polite">
          {selected.size ? `${selected.size} selected` : "Select members for bulk actions"}
        </p>
        <label className="flex items-center gap-2 text-ui-label font-medium text-ui-text-2">
          Action
          <span className="w-36">
            <Select name="op" value={op} onChange={(e) => setOp(e.target.value)}>
              <option value="status">Set status</option>
              <option value="track">Set track</option>
              <option value="cohort">Set cohort</option>
              <option value="remove">Remove</option>
            </Select>
          </span>
        </label>
        {op === "status" ? (
          <span className="w-32">
            <Select name="value" aria-label="New status" defaultValue="alumni">
              {Object.entries(STATUS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </span>
        ) : op === "track" ? (
          <span className="w-36">
            <Select name="value" aria-label="New track">
              <option value="">No track</option>
              {Object.entries(TRACK).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </span>
        ) : op === "cohort" ? (
          <span className="w-40">
            <Input name="value" aria-label="New cohort" placeholder="e.g. Fall 2026" />
          </span>
        ) : null}
        <Button type="submit" size="sm" variant={op === "remove" ? "danger" : "primary"} disabled={selected.size === 0} pending={pending}>
          {pending ? "Working…" : "Apply"}
        </Button>
        {classYear ? (
          <Button type="submit" size="sm" name="markAlumni" value="1" disabled={pending || selected.size === 0}>
            Mark alumni
          </Button>
        ) : null}
      </div>
      {state.error ? (
        <p role="alert" className="border-b border-ui-border px-6 py-3 text-ui-base font-medium text-ui-danger">
          {state.error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No members match" description="Try clearing a filter, or add members after recruiting." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH className="w-10">
                <input
                  type="checkbox"
                  aria-label={all ? "Clear selection" : `Select all ${rows.length}`}
                  checked={all}
                  onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
                  className={checkbox}
                />
              </TH>
              <TH>Name</TH>
              <TH>Status</TH>
              <TH>Track</TH>
              <TH>Class</TH>
              <TH>Cohort</TH>
              <TH>Account</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id} className={cx("relative", selected.has(r.id) && "bg-ui-accent-soft/60")}>
                <TD>
                  <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className={checkbox} />
                </TD>
                <TD className="min-w-48">
                  <Link href={`/admin/members/${r.id}`} className="font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                    {r.name}
                  </Link>
                  <span className="block text-ui-hint text-ui-text-3">{r.email}</span>
                </TD>
                <TD>
                  <StatusPill status={r.status}>{STATUS[r.status]}</StatusPill>
                </TD>
                <TD className="text-ui-text-2">{r.track ? TRACK[r.track] : "—"}</TD>
                <TD className="text-ui-text-2 tabular-nums">{r.classYear ?? "—"}</TD>
                <TD className="whitespace-nowrap text-ui-text-2">{r.cohort ?? "—"}</TD>
                <TD className={cx("whitespace-nowrap text-ui-label", r.signedUp ? "text-ui-text-2" : "text-ui-text-3")}>{r.signedUp ? "Signed up" : "Not signed up yet"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          confirmed.current = true;
          const submitter = submitterRef.current;
          if (submitter && form.current?.contains(submitter)) form.current.requestSubmit(submitter);
          else form.current?.requestSubmit();
        }}
        pending={pending}
        title={`Remove ${selected.size} from the roster?`}
        description="They lose member access on their next page load; their accounts stay."
        confirmLabel="Remove"
      />
      <SaveToast state={state} />
    </form>
  );
}
