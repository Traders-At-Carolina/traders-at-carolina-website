"use client";

import { Copy, CopyPlus } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { DateTimeInput, Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { FormFooter } from "@/components/admin/ui/Form";
import { Menu } from "@/components/admin/ui/Menu";
import { Switch } from "@/components/admin/ui/Switch";
import type { ClubEvent, Recruiting } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

/** A radio choice styled as a selectable row; the kit has no radio group yet. */
function RadioOption({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-9 cursor-pointer flex-wrap items-center gap-2.5 rounded-ui-md border border-ui-border bg-ui-surface px-3 py-2 text-ui-base text-ui-text transition-colors duration-150 hover:border-ui-border-strong has-[:checked]:border-ui-accent has-[:checked]:bg-ui-accent-soft">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="size-4 shrink-0 accent-ui-accent" />
      {children}
    </label>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return <legend className="text-ui-label font-medium text-ui-text">{children}</legend>;
}

/** Recruiting fields (spec 06 §6.5). Dates and times are Eastern, as the inputs show them. */
export function RecruitingForm({ recruiting, action }: { recruiting: Recruiting; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const initial = recruiting.mode ?? (recruiting.applicationsOpen ? "open" : "closed");
  const [mode, setMode] = useState(initial);
  const dt = (v?: string) => (v && v.length === 10 ? `${v}T23:59` : (v ?? ""));
  return (
    <form action={formAction} onChange={markDirty} noValidate>
      <Card as="div">
        <CardHeader title="Applications" description="Open or close applications, link the Google Forms and set the cycle's dates." />
        <CardSection>
          <fieldset>
            <Legend>Applications are</Legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["open", "Open"],
                  ["closed", "Closed"],
                  ["scheduled", "Scheduled (opens automatically at the next-open time)"],
                ] as const
              ).map(([v, l]) => (
                <RadioOption key={v} name="mode" value={v} checked={mode === v} onChange={() => setMode(v)}>
                  {l}
                </RadioOption>
              ))}
            </div>
          </fieldset>
        </CardSection>
        <CardSection title="Forms">
          <div className="grid gap-5">
            <Field label="Apply form URL" hint="Google Forms" error={err.applyUrl}>
              <Input name="applyUrl" type="url" defaultValue={recruiting.applyUrl} placeholder="https://forms.gle/…" />
            </Field>
            <Field label="“Keep me posted” form URL" hint="Google Forms" optional error={err.interestFormUrl}>
              <Input name="interestFormUrl" type="url" defaultValue={recruiting.interestFormUrl ?? ""} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Cycle and dates" description="All times are Eastern.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Cycle label">
              <Input name="cycleLabel" defaultValue={recruiting.cycleLabel ?? ""} placeholder="Fall 2026" />
            </Field>
            <Field label="Application length (minutes)" error={err.applicationMinutes}>
              <Input name="applicationMinutes" inputMode="numeric" defaultValue={recruiting.applicationMinutes ?? ""} className="tabular-nums" />
            </Field>
            <Field label="Deadline" hint="Eastern time. At the deadline, also close the Google Form." error={err.applyDeadline}>
              <DateTimeInput name="applyDeadline" defaultValue={dt(recruiting.applyDeadline)} />
            </Field>
            <Field label="Next-open date and time" hint="Eastern time" error={err.nextApplicationOpenDate}>
              <DateTimeInput name="nextApplicationOpenDate" defaultValue={dt(recruiting.nextApplicationOpenDate)} />
            </Field>
            <Field label="Interviews start">
              <Input name="interviewStart" type="date" defaultValue={recruiting.interviewWindow?.start ?? ""} />
            </Field>
            <Field label="Interviews end" error={err.interviewEnd}>
              <Input name="interviewEnd" type="date" defaultValue={recruiting.interviewWindow?.end ?? ""} />
            </Field>
            <Field label="Decision date" error={err.decisionDate}>
              <Input name="decisionDate" type="date" defaultValue={recruiting.decisionDate ?? ""} />
            </Field>
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel="Save recruiting" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

/** "Active members on Home" (spec 06 §6.5 Season card). */
export function MemberCountForm({ mode, value, activeCount, action }: { mode: "auto" | "manual" | "hidden"; value?: number; activeCount: number; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [m, setM] = useState(mode);
  return (
    <form action={formAction} onChange={markDirty} noValidate>
      <Card as="div">
        <CardHeader title="Season" description="The member count Home shows." />
        <CardSection>
          <fieldset>
            <Legend>Active members on Home</Legend>
            <div className="mt-1.5 flex flex-col gap-2">
              <RadioOption name="mode" value="auto" checked={m === "auto"} onChange={() => setM("auto")}>
                <span>
                  Auto: the Active roster count (<span className="tabular-nums">{activeCount}</span> now)
                </span>
              </RadioOption>
              <RadioOption name="mode" value="manual" checked={m === "manual"} onChange={() => setM("manual")}>
                Manual:
                <Input name="value" inputMode="numeric" defaultValue={value ?? ""} aria-label="Number of members" aria-invalid={Boolean(err.value) || undefined} disabled={m !== "manual"} className="w-24 tabular-nums" />
              </RadioOption>
              <RadioOption name="mode" value="hidden" checked={m === "hidden"} onChange={() => setM("hidden")}>
                Hide the number
              </RadioOption>
            </div>
            {err.value ? <p className="mt-1.5 text-ui-hint font-medium text-ui-danger">{err.value}</p> : null}
          </fieldset>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel="Save" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

const TYPES: Array<[ClubEvent["type"], string]> = [
  ["general-meeting", "General meeting"],
  ["workshop", "Workshop"],
  ["speaker", "Speaker"],
  ["competition", "Competition"],
  ["social", "Social"],
  ["recruiting", "Recruiting"],
  ["other", "Other"],
];

export type EventValues = Omit<ClubEvent, "endsAt" | "location" | "description" | "url"> & { endsAt: string | null; location: string | null; description: string | null; url: string | null };

/** Event form (spec 06 §6.10). Only website events can be featured on Home. */
export function EventForm({ event, action }: { event?: EventValues; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [audience, setAudience] = useState<ClubEvent["audience"]>(event?.audience ?? "public");
  return (
    <form action={formAction} onChange={markDirty} noValidate className="max-w-3xl">
      <Card as="div">
        <CardSection title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" error={err.title} className="sm:col-span-2">
              <Input name="title" defaultValue={event?.title} />
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue={event?.type ?? "general-meeting"}>
                {TYPES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Link (RSVP or details)" error={err.url} optional>
              <Input name="url" type="url" defaultValue={event?.url ?? ""} placeholder="https://" />
            </Field>
            <Field label="Short description" optional className="sm:col-span-2">
              <Textarea name="description" rows={2} defaultValue={event?.description ?? ""} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="When and where">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Starts" hint="Eastern time" error={err.startsAt}>
              <DateTimeInput name="startsAt" defaultValue={event?.startsAt} />
            </Field>
            <Field label="Ends" hint="Eastern time" error={err.endsAt} optional>
              <DateTimeInput name="endsAt" defaultValue={event?.endsAt ?? ""} />
            </Field>
            <Field label="Location" optional className="sm:col-span-2">
              <Input name="location" defaultValue={event?.location ?? ""} placeholder="Gardner Hall 105" />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Visibility">
          <div className="grid gap-5">
            <fieldset>
              <Legend>Audience</Legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["public", "Website and portal"],
                    ["signed_in", "Portal, anyone signed in"],
                    ["members", "Portal, members only"],
                  ] as const
                ).map(([v, l]) => (
                  <RadioOption key={v} name="audience" value={v} checked={audience === v} onChange={() => setAudience(v)}>
                    {l}
                  </RadioOption>
                ))}
              </div>
            </fieldset>
            <div>
              <Switch
                name="featured"
                label="Feature on Home"
                hint="Home shows the next featured website event, and hides it once it ends."
                defaultChecked={event?.featured}
                disabled={audience !== "public"}
                onCheckedChange={markDirty}
              />
              {err.featured ? <p className="mt-1.5 text-ui-hint font-medium text-ui-danger">{err.featured}</p> : null}
            </div>
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={event ? "Save" : "Add event"} cancelHref="/admin/events" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

/** Duplicate and Duplicate +1 week (spec 06 §6.10). */
export function DuplicateButtons({ id, action }: { id: string; action: Action }) {
  const { state, formAction, pending } = useSaveForm(action);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" icon={Copy} disabled={pending}>
        Duplicate
      </Button>
      <Button type="submit" size="sm" icon={CopyPlus} name="plusWeek" value="1" disabled={pending}>
        Duplicate +1 week
      </Button>
      {state.error ? <p className="w-full text-ui-hint font-medium text-ui-danger">{state.error}</p> : null}
    </form>
  );
}

/**
 * The row menu on the Events list: Edit, Duplicate, Duplicate +1 week and Delete. Duplicate posts the same form as
 * DuplicateButtons; Delete asks first, as the edit page does.
 */
export function EventRowActions({ id, title, duplicateAction, deleteAction }: { id: string; title: string; duplicateAction: Action; deleteAction: () => Promise<ActionState> }) {
  const dup = useSaveForm(duplicateAction);
  const del = useSaveForm(deleteAction as unknown as Action);
  const dupForm = useRef<HTMLFormElement>(null);
  const plusWeek = useRef<HTMLInputElement>(null);
  const delForm = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [seenAt, setSeenAt] = useState(del.state.at);
  if (del.state.at !== seenAt) {
    setSeenAt(del.state.at);
    setConfirming(false);
  }
  const duplicate = (week: boolean) => {
    if (plusWeek.current) plusWeek.current.value = week ? "1" : "";
    dupForm.current?.requestSubmit();
  };
  const error = dup.state.error ? dup.state : del.state.error ? del.state : {};
  return (
    <>
      <Menu
        label={`Actions for ${title}`}
        items={[
          { label: "Edit", href: `/admin/events/${id}` },
          { label: "Duplicate", onSelect: () => duplicate(false), disabled: dup.pending },
          { label: "Duplicate +1 week", onSelect: () => duplicate(true), disabled: dup.pending },
          { label: "Delete", onSelect: () => setConfirming(true), danger: true, disabled: del.pending },
        ]}
      />
      <form ref={dupForm} action={dup.formAction} hidden>
        <input type="hidden" name="id" value={id} />
        <input ref={plusWeek} type="hidden" name="plusWeek" defaultValue="" />
      </form>
      <form ref={delForm} action={del.formAction} hidden />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => delForm.current?.requestSubmit()}
        pending={del.pending}
        title="Delete event?"
        description={`Delete “${title}”? You can undo this right after.`}
        confirmLabel="Delete event"
      />
      <SaveToast state={error} />
    </>
  );
}
