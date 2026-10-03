"use client";

import { useActionState, useState } from "react";
import { buttonClasses } from "@/components/Button";
import { PersonCard } from "@/components/PersonCard";
import { SponsorMark } from "@/components/SponsorMark";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ImageAsset, Person } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;
const ctl = (bad?: boolean) => `mt-2 min-h-11 w-full border bg-white px-2 text-body focus:border-navy focus:outline-none ${bad ? "border-black" : "border-rule"}`;
const label = "text-caption font-medium text-ink-2";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-caption text-black">{message}</p> : null;
}

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button type="submit" disabled={pending} className={buttonClasses({ className: "disabled:opacity-60" })}>
      {pending ? "Saving…" : children}
    </button>
  );
}

function FormError({ state }: { state: ActionState }) {
  return state.error ? (
    <p role="alert" className="text-body text-black">
      {state.error}
    </p>
  ) : null;
}

/** Delete with a confirmation that says what else changes (spec 06 §6.0). */
export function DeleteButton({ action, confirm: question, label: text }: { action: () => Promise<ActionState>; confirm: string; label: string }) {
  const { state, formAction, pending } = useSaveForm(action as unknown as Action);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
      className="mt-10 border-t border-rule pt-6"
    >
      <button type="submit" disabled={pending} className="min-h-11 text-caption font-medium text-navy hover:underline disabled:opacity-60">
        {pending ? "Removing…" : text}
      </button>
      {state.error ? <p className="mt-2 text-caption text-black">{state.error}</p> : null}
    </form>
  );
}

/** Up/down reorder buttons that work by keyboard (spec 06 §6.0). */
export function MoveButtons({ action, fields, name, first, last }: { action: Action; fields: Record<string, string>; name: string; first: boolean; last: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex items-center gap-1">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" name="dir" value="up" disabled={first || pending} aria-label={`Move ${name} up`} className="min-h-11 min-w-11 text-navy disabled:opacity-30">
        ↑
      </button>
      <button type="submit" name="dir" value="down" disabled={last || pending} aria-label={`Move ${name} down`} className="min-h-11 min-w-11 text-navy disabled:opacity-30">
        ↓
      </button>
      <SaveToast state={state} />
    </form>
  );
}

// ── Sponsors ──

export type SponsorValues = { name: string; relationship: string | null; url: string | null; logo: ImageAsset | null };

/** Sponsor form with the logo previewed through SponsorMark, exactly as About shows it (spec 06 §6.7). */
export function SponsorForm({ sponsor, action }: { sponsor?: SponsorValues; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const [logo, setLogo] = useState<ImageAsset | null>(sponsor?.logo ?? null);
  const [opaque, setOpaque] = useState(false);
  return (
    <form action={formAction} onChange={markDirty} className="grid max-w-3xl gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]" noValidate>
      <div className="flex flex-col gap-5">
        <label className={label}>
          Name
          <input name="name" defaultValue={sponsor?.name} aria-invalid={Boolean(err.name)} className={ctl(Boolean(err.name))} />
          <FieldError message={err.name} />
        </label>
        <label className={label}>
          Relationship <span className="font-normal text-ink-3">(e.g. “Sponsor since 2024”)</span>
          <input name="relationship" defaultValue={sponsor?.relationship ?? ""} className={ctl()} />
        </label>
        <label className={label}>
          Website
          <input name="url" type="url" defaultValue={sponsor?.url ?? ""} placeholder="https://" aria-invalid={Boolean(err.url)} className={ctl(Boolean(err.url))} />
          <FieldError message={err.url} />
        </label>
        <ImageUpload
          name="logo"
          folder="logos"
          kind="logo"
          value={logo}
          onChange={(v) => {
            setLogo(v);
            markDirty();
          }}
          onAnalyze={({ opaque: o }) => setOpaque(o)}
          label="Logo (transparent background)"
          error={err.logo}
        />
        <FormError state={state} />
        <div>
          <Submit pending={pending}>{sponsor ? "Save" : "Add sponsor"}</Submit>
        </div>
      </div>
      <aside aria-label="Preview" className="flex flex-col gap-3">
        <p className={label}>Preview</p>
        <div className="on-dark surface-graphite flex min-h-24 items-center gap-4 px-4 py-6 text-bone">
          {logo ? <SponsorMark logo={logo} /> : null}
          <span className="text-h3">{sponsor?.name ?? "Sponsor"}</span>
        </div>
        {opaque ? <p className="text-caption text-black">This logo has a solid background, so it will show as a solid block. Use a version with a transparent background.</p> : null}
      </aside>
      <SaveToast state={state} />
    </form>
  );
}

// ── Placements ──

export type PlacementValues = { firm: string; logo: ImageAsset | null; logoOnDark: ImageAsset | null; showOnWall: boolean };

export function PlacementForm({ placement, action }: { placement?: PlacementValues; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const [logo, setLogo] = useState<ImageAsset | null>(placement?.logo ?? null);
  const [dark, setDark] = useState<ImageAsset | null>(placement?.logoOnDark ?? null);
  return (
    <form action={formAction} onChange={markDirty} className="flex max-w-2xl flex-col gap-5" noValidate>
      <label className={label}>
        Firm
        <input name="firm" defaultValue={placement?.firm} aria-invalid={Boolean(err.firm)} className={ctl(Boolean(err.firm))} />
        <FieldError message={err.firm} />
      </label>
      <ImageUpload name="logo" folder="logos" kind="logo" value={logo} onChange={(v) => (setLogo(v), markDirty())} label="Logo for light backgrounds" error={err.logo} />
      <ImageUpload name="logoOnDark" folder="logos" kind="logo" value={dark} onChange={(v) => (setDark(v), markDirty())} label="Logo for dark backgrounds (optional; used on officers' headshot badges)" />
      <label className="flex min-h-11 items-center gap-3 text-body">
        <input type="checkbox" name="showOnWall" defaultChecked={placement?.showOnWall ?? true} className="size-5" />
        Show on the placement wall (Team header and footer)
      </label>
      <FormError state={state} />
      <div>
        <Submit pending={pending}>{placement ? "Save" : "Add firm"}</Submit>
      </div>
      <SaveToast state={state} />
    </form>
  );
}

// ── Officers ──

export type OfficerValues = {
  name: string;
  role: string;
  group: Person["group"];
  track: Person["track"] | null;
  classYear: number | null;
  major: string | null;
  headshot: ImageAsset | null;
  alt: string | null;
  placementNote: string | null;
  companyId: string | null;
  linkedin: string | null;
  visible: boolean;
};

const TIERS: Array<[Person["group"], string]> = [
  ["exec", "Executive board"],
  ["co-president", "Co-Presidents"],
  ["director", "Directors"],
  ["track-lead", "Track leads (linked from Membership, not shown on Team)"],
];

/** Officer form with a live PersonCard preview (spec 06 §6.3). */
export function OfficerForm({ officer, companies, action }: { officer?: OfficerValues; companies: Array<{ id: string; firm: string; logo: ImageAsset | null }>; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const [v, setV] = useState(() => ({
    name: officer?.name ?? "",
    role: officer?.role ?? "",
    group: officer?.group ?? ("director" as Person["group"]),
    classYear: officer?.classYear ? String(officer.classYear) : "",
    major: officer?.major ?? "",
    placementNote: officer?.placementNote ?? "",
    companyId: officer?.companyId ?? "",
    linkedin: officer?.linkedin ?? "",
  }));
  const [headshot, setHeadshot] = useState<ImageAsset | null>(officer?.headshot ?? null);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const company = companies.find((c) => c.id === v.companyId);
  const preview: Person = {
    slug: "preview",
    name: v.name || "Name",
    role: v.role || "Role",
    group: v.group,
    order: 1,
    ...(v.classYear && /^\d{4}$/.test(v.classYear) ? { classYear: Number(v.classYear) } : {}),
    ...(v.major ? { major: v.major } : {}),
    ...(headshot ? { headshot, alt: "" } : {}),
    ...(v.placementNote ? { placement: v.placementNote } : {}),
    ...(company?.logo ? { company: { name: company.firm, logo: company.logo } } : {}),
    ...(v.linkedin.startsWith("https://") ? { linkedin: v.linkedin } : {}),
  };
  return (
    <form action={formAction} onChange={markDirty} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Name
          <input name="name" value={v.name} onChange={set("name")} aria-invalid={Boolean(err.name)} className={ctl(Boolean(err.name))} />
          <FieldError message={err.name} />
        </label>
        <label className={label}>
          Role
          <input name="role" value={v.role} onChange={set("role")} placeholder="President" aria-invalid={Boolean(err.role)} className={ctl(Boolean(err.role))} />
          <FieldError message={err.role} />
        </label>
        <label className={label}>
          Tier
          <select name="group" value={v.group} onChange={set("group")} className={ctl()}>
            {TIERS.map(([g, l]) => (
              <option key={g} value={g}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Track <span className="font-normal text-ink-3">(required for track leads)</span>
          <select name="track" defaultValue={officer?.track ?? ""} aria-invalid={Boolean(err.track)} className={ctl(Boolean(err.track))}>
            <option value="">None</option>
            <option value="trading">Trading</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
          </select>
          <FieldError message={err.track} />
        </label>
        <label className={label}>
          Class year
          <input name="classYear" inputMode="numeric" value={v.classYear} onChange={set("classYear")} aria-invalid={Boolean(err.classYear)} className={ctl(Boolean(err.classYear))} />
          <FieldError message={err.classYear} />
        </label>
        <label className={label}>
          Major
          <input name="major" value={v.major} onChange={set("major")} className={ctl()} />
        </label>
        <div className="sm:col-span-2">
          <ImageUpload name="headshot" folder="headshots" value={headshot} onChange={(h) => (setHeadshot(h), markDirty())} label="Headshot" error={err.headshot} />
          {headshot && headshot.width < 600 ? <p className="text-caption text-ink-2">This headshot is {headshot.width}px wide and will look soft on sharp screens; 600px or more is best.</p> : null}
        </div>
        <label className={`${label} sm:col-span-2`}>
          Headshot alt text
          <input name="alt" defaultValue={officer?.alt ?? ""} placeholder="Portrait of Jane Doe" aria-invalid={Boolean(err.alt)} className={ctl(Boolean(err.alt))} />
          <FieldError message={err.alt} />
        </label>
        <label className={label}>
          Placement line <span className="font-normal text-ink-3">(with their consent)</span>
          <input name="placementNote" value={v.placementNote} onChange={set("placementNote")} placeholder="Previously at Citadel" className={ctl()} />
        </label>
        <label className={label}>
          Company badge
          <select name="companyId" value={v.companyId} onChange={set("companyId")} className={ctl()}>
            <option value="">None</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firm}
              </option>
            ))}
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>
          LinkedIn
          <input name="linkedin" type="url" value={v.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/in/…" aria-invalid={Boolean(err.linkedin)} className={ctl(Boolean(err.linkedin))} />
          <FieldError message={err.linkedin} />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-body sm:col-span-2">
          <input type="checkbox" name="visible" defaultChecked={officer?.visible ?? true} className="size-5" />
          Show on Team page <span className="text-caption text-ink-3">(turn off to enter next year&apos;s board in advance; only visible officers can lead a track)</span>
        </label>
        <div className="sm:col-span-2">
          <FormError state={state} />
          <div className="mt-2">
            <Submit pending={pending}>{officer ? "Save" : "Add officer"}</Submit>
          </div>
        </div>
      </div>
      <aside aria-label="Preview">
        <p className={`${label} mb-3`}>Preview</p>
        <PersonCard person={preview} sizes="224px" />
      </aside>
      <SaveToast state={state} />
    </form>
  );
}

export function AcademicYearForm({ value, action }: { value?: string; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  return (
    <form action={formAction} onChange={markDirty} className="flex flex-wrap items-end gap-3" noValidate>
      <label className={label}>
        Academic year <span className="font-normal text-ink-3">(titles the Team page, e.g. “Leadership, 2026–27”)</span>
        <input name="academicYear" defaultValue={value ?? ""} placeholder="2026–27" aria-invalid={Boolean(err.academicYear)} className={`${ctl(Boolean(err.academicYear))} max-w-40`} />
        <FieldError message={err.academicYear} />
      </label>
      <button type="submit" disabled={pending} className={buttonClasses({ variant: "secondary", className: "disabled:opacity-60" })}>
        {pending ? "Saving…" : "Save year"}
      </button>
      <FormError state={state} />
      <SaveToast state={state} />
    </form>
  );
}

// ── Tracks ──

export type TrackValues = {
  id: string;
  roleLabel: string;
  name: string;
  description: string;
  goodFit: string | null;
  sampleProblem: string | null;
  recommendedBackground: string[];
  leadSlug: string | null;
};

/** One of the three fixed tracks (spec 06 §6.9). The lead is picked from visible officers. */
export function TrackForm({ track, leads, action }: { track: TrackValues; leads: Array<{ slug: string; name: string }>; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  const id = (k: string) => `${track.id}-${k}`;
  return (
    <form action={formAction} onChange={markDirty} aria-labelledby={id("title")} className="grid gap-5 border-t border-rule pt-6 sm:grid-cols-2" noValidate>
      <h2 id={id("title")} className="text-h3 sm:col-span-2">
        {track.name}
      </h2>
      <label className={label}>
        Role label
        <input name="roleLabel" defaultValue={track.roleLabel} aria-invalid={Boolean(err.roleLabel)} className={ctl(Boolean(err.roleLabel))} />
        <FieldError message={err.roleLabel} />
      </label>
      <label className={label}>
        Name
        <input name="name" defaultValue={track.name} aria-invalid={Boolean(err.name)} className={ctl(Boolean(err.name))} />
        <FieldError message={err.name} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Description
        <textarea name="description" rows={3} defaultValue={track.description} aria-invalid={Boolean(err.description)} className={`${ctl(Boolean(err.description))} py-2`} />
        <FieldError message={err.description} />
      </label>
      <label className={label}>
        Good fit if you…
        <input name="goodFit" defaultValue={track.goodFit ?? ""} className={ctl()} />
      </label>
      <label className={label}>
        Sample problem
        <input name="sampleProblem" defaultValue={track.sampleProblem ?? ""} className={ctl()} />
      </label>
      <label className={label}>
        Recommended background <span className="font-normal text-ink-3">(2–4 lines; recommended, never “required”)</span>
        <textarea
          name="recommendedBackground"
          rows={4}
          defaultValue={track.recommendedBackground.join("\n")}
          aria-invalid={Boolean(err.recommendedBackground)}
          className={`${ctl(Boolean(err.recommendedBackground))} py-2`}
        />
        <FieldError message={err.recommendedBackground} />
      </label>
      <label className={label}>
        Lead
        <select name="leadSlug" defaultValue={track.leadSlug ?? ""} className={ctl()}>
          <option value="">Lead to be announced</option>
          {leads.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <FormError state={state} />
        <div className="mt-2">
          <Submit pending={pending}>{`Save ${track.name}`}</Submit>
        </div>
      </div>
      <SaveToast state={state} />
    </form>
  );
}
