"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/Button";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ClubEvent, Recruiting } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;
const ctl = (bad?: boolean) => `mt-2 min-h-11 w-full border bg-white px-2 text-body focus:border-navy focus:outline-none ${bad ? "border-black" : "border-rule"}`;
const label = "text-caption font-medium text-ink-2";
const Err = ({ m }: { m?: string }) => (m ? <p className="mt-1 text-caption text-black">{m}</p> : null);
const Alert = ({ state }: { state: ActionState }) =>
  state.error ? (
    <p role="alert" className="text-body text-black">
      {state.error}
    </p>
  ) : null;

/** Recruiting fields (spec 06 §6.5). Dates and times are Eastern, as the inputs show them. */
export function RecruitingForm({ recruiting, action }: { recruiting: Recruiting; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const initial = recruiting.mode ?? (recruiting.applicationsOpen ? "open" : "closed");
  const [mode, setMode] = useState(initial);
  const dt = (v?: string) => (v && v.length === 10 ? `${v}T23:59` : (v ?? ""));
  return (
    <form action={formAction} onChange={markDirty} className="grid max-w-3xl gap-5 sm:grid-cols-2" noValidate>
      <fieldset className="sm:col-span-2">
        <legend className={label}>Applications</legend>
        <div className="mt-2 flex flex-wrap gap-6">
          {(
            [
              ["open", "Open"],
              ["closed", "Closed"],
              ["scheduled", "Scheduled (opens automatically at the next-open time)"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 text-body">
              <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={`${label} sm:col-span-2`}>
        Apply form URL <span className="font-normal text-ink-3">(Google Forms)</span>
        <input name="applyUrl" type="url" defaultValue={recruiting.applyUrl} placeholder="https://forms.gle/…" aria-invalid={Boolean(err.applyUrl)} className={ctl(Boolean(err.applyUrl))} />
        <Err m={err.applyUrl} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        “Keep me posted” form URL <span className="font-normal text-ink-3">(Google Forms, optional)</span>
        <input name="interestFormUrl" type="url" defaultValue={recruiting.interestFormUrl ?? ""} aria-invalid={Boolean(err.interestFormUrl)} className={ctl(Boolean(err.interestFormUrl))} />
        <Err m={err.interestFormUrl} />
      </label>
      <label className={label}>
        Cycle label
        <input name="cycleLabel" defaultValue={recruiting.cycleLabel ?? ""} placeholder="Fall 2026" className={ctl()} />
      </label>
      <label className={label}>
        Application length (minutes)
        <input name="applicationMinutes" inputMode="numeric" defaultValue={recruiting.applicationMinutes ?? ""} aria-invalid={Boolean(err.applicationMinutes)} className={ctl(Boolean(err.applicationMinutes))} />
        <Err m={err.applicationMinutes} />
      </label>
      <label className={label}>
        Deadline (ET)
        <input name="applyDeadline" type="datetime-local" defaultValue={dt(recruiting.applyDeadline)} aria-invalid={Boolean(err.applyDeadline)} aria-describedby="deadline-reminder" className={ctl(Boolean(err.applyDeadline))} />
        <Err m={err.applyDeadline} />
        <span id="deadline-reminder" className="mt-1 block text-caption font-normal text-ink-3">
          At the deadline, also close the Google Form.
        </span>
      </label>
      <label className={label}>
        Next-open date and time (ET)
        <input
          name="nextApplicationOpenDate"
          type="datetime-local"
          defaultValue={dt(recruiting.nextApplicationOpenDate)}
          aria-invalid={Boolean(err.nextApplicationOpenDate)}
          className={ctl(Boolean(err.nextApplicationOpenDate))}
        />
        <Err m={err.nextApplicationOpenDate} />
      </label>
      <label className={label}>
        Interviews start
        <input name="interviewStart" type="date" defaultValue={recruiting.interviewWindow?.start ?? ""} className={ctl()} />
      </label>
      <label className={label}>
        Interviews end
        <input name="interviewEnd" type="date" defaultValue={recruiting.interviewWindow?.end ?? ""} aria-invalid={Boolean(err.interviewEnd)} className={ctl(Boolean(err.interviewEnd))} />
        <Err m={err.interviewEnd} />
      </label>
      <label className={label}>
        Decision date
        <input name="decisionDate" type="date" defaultValue={recruiting.decisionDate ?? ""} aria-invalid={Boolean(err.decisionDate)} className={ctl(Boolean(err.decisionDate))} />
        <Err m={err.decisionDate} />
      </label>
      <div className="sm:col-span-2">
        <Alert state={state} />
        <button type="submit" disabled={pending} className={buttonClasses({ className: "mt-2 disabled:opacity-60" })}>
          {pending ? "Saving…" : "Save recruiting"}
        </button>
      </div>
      <SaveToast state={state} />
    </form>
  );
}

/** "Active members on Home" (spec 06 §6.5 Season card). */
export function MemberCountForm({ mode, value, activeCount, action }: { mode: "auto" | "manual" | "hidden"; value?: number; activeCount: number; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const [m, setM] = useState(mode);
  return (
    <form action={formAction} onChange={markDirty} className="flex flex-col gap-4" noValidate>
      <fieldset>
        <legend className={label}>Active members on Home</legend>
        <div className="mt-2 flex flex-col gap-1">
          <label className="flex min-h-11 items-center gap-2 text-body">
            <input type="radio" name="mode" value="auto" checked={m === "auto"} onChange={() => setM("auto")} />
            Auto: the Active roster count ({activeCount} now)
          </label>
          <label className="flex min-h-11 flex-wrap items-center gap-2 text-body">
            <input type="radio" name="mode" value="manual" checked={m === "manual"} onChange={() => setM("manual")} />
            Manual:
            <input name="value" inputMode="numeric" defaultValue={value ?? ""} aria-label="Number of members" disabled={m !== "manual"} className="min-h-11 w-24 border border-rule bg-white px-2 disabled:opacity-50" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-body">
            <input type="radio" name="mode" value="hidden" checked={m === "hidden"} onChange={() => setM("hidden")} />
            Hide the number
          </label>
        </div>
        <Err m={err.value} />
      </fieldset>
      <Alert state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonClasses({ variant: "secondary", className: "disabled:opacity-60" })}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
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
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const [audience, setAudience] = useState<ClubEvent["audience"]>(event?.audience ?? "public");
  return (
    <form action={formAction} onChange={markDirty} className="grid max-w-3xl gap-5 sm:grid-cols-2" noValidate>
      <label className={`${label} sm:col-span-2`}>
        Title
        <input name="title" defaultValue={event?.title} aria-invalid={Boolean(err.title)} className={ctl(Boolean(err.title))} />
        <Err m={err.title} />
      </label>
      <label className={label}>
        Type
        <select name="type" defaultValue={event?.type ?? "general-meeting"} className={ctl()}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Location
        <input name="location" defaultValue={event?.location ?? ""} placeholder="Gardner Hall 105" className={ctl()} />
      </label>
      <label className={label}>
        Starts (ET)
        <input name="startsAt" type="datetime-local" defaultValue={event?.startsAt} aria-invalid={Boolean(err.startsAt)} className={ctl(Boolean(err.startsAt))} />
        <Err m={err.startsAt} />
      </label>
      <label className={label}>
        Ends (ET, optional)
        <input name="endsAt" type="datetime-local" defaultValue={event?.endsAt ?? ""} aria-invalid={Boolean(err.endsAt)} className={ctl(Boolean(err.endsAt))} />
        <Err m={err.endsAt} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Short description
        <textarea name="description" rows={2} defaultValue={event?.description ?? ""} className={`${ctl()} py-2`} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Link (RSVP or details)
        <input name="url" type="url" defaultValue={event?.url ?? ""} placeholder="https://" aria-invalid={Boolean(err.url)} className={ctl(Boolean(err.url))} />
        <Err m={err.url} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className={label}>Audience</legend>
        <div className="mt-2 flex flex-col gap-1">
          {(
            [
              ["public", "Website and portal"],
              ["signed_in", "Portal, anyone signed in"],
              ["members", "Portal, members only"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 text-body">
              <input type="radio" name="audience" value={v} checked={audience === v} onChange={() => setAudience(v)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-body sm:col-span-2">
        <input type="checkbox" name="featured" defaultChecked={event?.featured} disabled={audience !== "public"} className="size-5" />
        Feature on Home <span className="text-caption text-ink-3">(Home shows the next featured website event, and hides it once it ends)</span>
      </label>
      <Err m={err.featured} />
      <div className="sm:col-span-2">
        <Alert state={state} />
        <button type="submit" disabled={pending} className={buttonClasses({ className: "mt-2 disabled:opacity-60" })}>
          {pending ? "Saving…" : event ? "Save" : "Add event"}
        </button>
      </div>
      <SaveToast state={state} />
    </form>
  );
}

/** Duplicate and Duplicate +1 week (spec 06 §6.10). */
export function DuplicateButtons({ id, action }: { id: string; action: Action }) {
  const { state, formAction, pending } = useSaveForm(action);
  return (
    <form action={formAction} className="flex flex-wrap gap-4">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="min-h-11 text-caption font-medium text-navy underline underline-offset-4 disabled:opacity-60">
        Duplicate
      </button>
      <button type="submit" name="plusWeek" value="1" disabled={pending} className="min-h-11 text-caption font-medium text-navy underline underline-offset-4 disabled:opacity-60">
        Duplicate +1 week
      </button>
      {state.error ? <p className="text-caption text-black">{state.error}</p> : null}
    </form>
  );
}
