"use client";

import { ListChecks, Upload, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { AddPreview, AddState } from "@/app/admin/(console)/members/actions";
import { Badge, type Tone } from "@/components/admin/ui/Badge";
import { Button, buttonClasses } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { cx } from "@/components/admin/ui/cx";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

type Action = (prev: AddState, formData: FormData) => Promise<AddState>;

type PreviewRow = { line: number; text: string; detail: string; tone: Tone; label: string };

/** One row per input line, in the order they were pasted, each tagged new, on the roster, repeated or invalid. */
function previewRows(p: AddPreview): PreviewRow[] {
  return [
    ...p.add.map((r) => ({ line: r.line, text: r.email, detail: r.name, tone: "success" as const, label: "New" })),
    ...p.existing.map((r) => ({ line: r.line, text: r.email, detail: "Already on the roster", tone: "neutral" as const, label: "On roster" })),
    ...p.duplicates.map((r) => ({ line: r.line, text: r.email, detail: "Repeated in this list", tone: "warning" as const, label: "Repeated" })),
    ...p.invalid.map((r) => ({ line: r.line, text: r.text, detail: r.reason, tone: "danger" as const, label: "Invalid" })),
  ].sort((a, b) => a.line - b.line);
}

/** Paste or upload, preview, then add (spec 06 §6.2). Nothing is saved until "Add". */
export function AddMembersForm({ preview, add }: { preview: Action; add: Action }) {
  const router = useRouter();
  const [previewState, previewAction, previewing] = useActionState(preview, {});
  const [addState, addAction, adding] = useActionState(add, {});
  const [list, setList] = useState("");
  const [previewedList, setPreviewedList] = useState<string | null>(null);
  useUnsavedChanges(list.trim().length > 0 && !addState.ok);
  useEffect(() => {
    if (addState.redirectTo) router.push(addState.redirectTo);
  }, [addState.redirectTo, router]);

  const shown = previewedList === list ? previewState.preview : undefined;
  const state = addState.at && addState.at > (previewState.at ?? 0) ? addState : previewState;

  return (
    <form className="flex flex-col gap-6">
      <Card as="div">
        <CardHeader title="1. Paste or upload" description="Nothing is saved until you add them." />
        <CardSection>
          <Field label="People to add" hint="One per line: an email, or “Name, email”. Or upload a CSV with name,email columns and optional track,class_year.">
            <Textarea name="list" rows={8} value={list} onChange={(e) => setList(e.target.value)} placeholder={"ada@unc.edu\nGrace Hopper, grace@unc.edu"} className="font-mono" />
          </Field>
          <label className={cx(buttonClasses({ size: "sm", className: "mt-3 cursor-pointer" }), "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ui-accent")}>
            <Upload aria-hidden className="size-4" />
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setList(await file.text());
              }}
            />
          </label>
        </CardSection>
        <CardSection title="Defaults for this batch" description="Applied to everyone in the list unless their CSV row says otherwise.">
          <fieldset className="grid gap-4 sm:grid-cols-4">
            <legend className="sr-only">Defaults for this batch</legend>
            <Field label="Status">
              <Select name="status" defaultValue="active">
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            <Field label="Track">
              <Select name="track" defaultValue="">
                <option value="">None</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
                <option value="development">Development</option>
              </Select>
            </Field>
            <Field label="Class year">
              <Input name="classYear" inputMode="numeric" placeholder="2029" className="tabular-nums" />
            </Field>
            <Field label="Cohort">
              <Input name="cohort" placeholder="Fall 2026" />
            </Field>
          </fieldset>
          <Checkbox name="invite" label="Email them a sign-up link" hint="People who already have an account are skipped." className="mt-5" />
        </CardSection>
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-ui-lg border-t border-ui-border bg-ui-canvas px-6 py-3">
          {state.error ? (
            <p role="alert" className="mr-auto text-ui-base font-medium text-ui-danger">
              {state.error}
            </p>
          ) : null}
          <Button
            type="submit"
            icon={ListChecks}
            formAction={async (fd) => {
              setPreviewedList(list);
              previewAction(fd);
            }}
            pending={previewing}
          >
            {previewing ? "Checking…" : "Preview"}
          </Button>
        </div>
      </Card>

      <Card aria-label="Preview">
        <CardHeader
          title="2. Check and add"
          description={
            shown ? (
              <span className="tabular-nums">
                {shown.add.length} new · {shown.existing.length} already on the roster · {shown.duplicates.length} repeated · {shown.invalid.length} invalid
              </span>
            ) : (
              "Preview the list to see who will be added."
            )
          }
        />
        {shown ? (
          previewRows(shown).length ? (
            <Table>
              <THead>
                <TR>
                  <TH className="w-16">Line</TH>
                  <TH>Entry</TH>
                  <TH>Details</TH>
                  <TH className="w-28">Result</TH>
                </TR>
              </THead>
              <TBody>
                {previewRows(shown).map((r) => (
                  <TR key={`${r.line}-${r.label}`}>
                    <TD className="text-ui-text-3 tabular-nums">{r.line}</TD>
                    <TD className="font-mono text-ui-label break-all">{r.text}</TD>
                    <TD className="text-ui-text-2">{r.detail}</TD>
                    <TD>
                      <Badge tone={r.tone} dot>
                        {r.label}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={ListChecks} title="The list is empty" description="Paste at least one email above." />
          )
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-ui-lg border-t border-ui-border bg-ui-canvas px-6 py-3">
          <Button type="submit" variant="primary" icon={UserPlus} formAction={addAction} pending={adding} disabled={!shown || shown.add.length === 0}>
            {adding ? "Adding…" : shown ? `Add ${shown.add.length}` : "Add"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
