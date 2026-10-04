"use client";

import { useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import { SponsorMark } from "@/components/SponsorMark";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { Banner } from "@/components/admin/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { FormError, FormFooter, PreviewPanel } from "@/components/admin/ui/Form";
import { Switch } from "@/components/admin/ui/Switch";
import type { ImageAsset, Person } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";

// DeleteButton and MoveButtons moved into the console kit; re-exported so existing imports keep working.
export { DeleteButton, MoveButtons } from "@/components/admin/ui/Form";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

// ── Sponsors ──

export type SponsorValues = { name: string; relationship: string | null; url: string | null; logo: ImageAsset | null };

/** Sponsor form with the logo previewed through SponsorMark, exactly as About shows it (spec 06 §6.7). */
export function SponsorForm({ sponsor, action }: { sponsor?: SponsorValues; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [logo, setLogo] = useState<ImageAsset | null>(sponsor?.logo ?? null);
  const [opaque, setOpaque] = useState(false);
  return (
    <form action={formAction} onChange={markDirty} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card as="div">
        <CardSection>
          <div className="grid gap-5">
            <Field label="Name" error={err.name}>
              <Input name="name" defaultValue={sponsor?.name} />
            </Field>
            <Field label="Relationship" hint="For example “Sponsor since 2024”." optional>
              <Input name="relationship" defaultValue={sponsor?.relationship ?? ""} />
            </Field>
            <Field label="Website" error={err.url} optional>
              <Input name="url" type="url" defaultValue={sponsor?.url ?? ""} placeholder="https://" />
            </Field>
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
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={sponsor ? "Save" : "Add sponsor"} cancelHref="/admin/sponsors" error={state.error} />
      </Card>
      <PreviewPanel note={opaque ? "This logo has a solid background, so it will show as a solid block. Use a version with a transparent background." : undefined}>
        <div className="on-dark surface-graphite flex min-h-24 items-center gap-4 px-4 py-6 text-bone">
          {logo ? <SponsorMark logo={logo} /> : null}
          <span className="text-h3">{sponsor?.name ?? "Sponsor"}</span>
        </div>
      </PreviewPanel>
      <SaveToast state={state} />
    </form>
  );
}

// ── Placements ──

export type PlacementValues = { firm: string; logo: ImageAsset | null; logoOnDark: ImageAsset | null; showOnWall: boolean };

export function PlacementForm({ placement, action }: { placement?: PlacementValues; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [logo, setLogo] = useState<ImageAsset | null>(placement?.logo ?? null);
  const [dark, setDark] = useState<ImageAsset | null>(placement?.logoOnDark ?? null);
  return (
    <form action={formAction} onChange={markDirty} noValidate className="max-w-2xl">
      <Card as="div">
        <CardSection>
          <div className="grid gap-5">
            <Field label="Firm" error={err.firm}>
              <Input name="firm" defaultValue={placement?.firm} />
            </Field>
            <ImageUpload name="logo" folder="logos" kind="logo" value={logo} onChange={(v) => (setLogo(v), markDirty())} label="Logo for light backgrounds" error={err.logo} />
            <ImageUpload name="logoOnDark" folder="logos" kind="logo" value={dark} onChange={(v) => (setDark(v), markDirty())} label="Logo for dark backgrounds (optional; used on officers' headshot badges)" />
          </div>
        </CardSection>
        <CardSection>
          <Switch name="showOnWall" label="Show on the placement wall" hint="The logo wall in the Team header and the footer." defaultChecked={placement?.showOnWall ?? true} onCheckedChange={markDirty} />
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={placement ? "Save" : "Add firm"} cancelHref="/admin/placements" error={state.error} />
      </Card>
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
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
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
    <form action={formAction} onChange={markDirty} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card as="div">
        <CardSection title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" error={err.name}>
              <Input name="name" value={v.name} onChange={set("name")} />
            </Field>
            <Field label="Role" error={err.role}>
              <Input name="role" value={v.role} onChange={set("role")} placeholder="President" />
            </Field>
            <Field label="Tier">
              <Select name="group" value={v.group} onChange={set("group")}>
                {TIERS.map(([g, l]) => (
                  <option key={g} value={g}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Track" hint="Required for track leads." error={err.track}>
              <Select name="track" defaultValue={officer?.track ?? ""}>
                <option value="">None</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
                <option value="development">Development</option>
              </Select>
            </Field>
            <Field label="Class year" error={err.classYear}>
              <Input name="classYear" inputMode="numeric" value={v.classYear} onChange={set("classYear")} className="tabular-nums" />
            </Field>
            <Field label="Major">
              <Input name="major" value={v.major} onChange={set("major")} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Photo">
          <div className="grid gap-5">
            <ImageUpload name="headshot" folder="headshots" value={headshot} onChange={(h) => (setHeadshot(h), markDirty())} label="Headshot" error={err.headshot} />
            {headshot && headshot.width < 600 ? <Banner tone="warning">This headshot is {headshot.width}px wide and will look soft on sharp screens; 600px or more is best.</Banner> : null}
            <Field label="Headshot alt text" error={err.alt}>
              <Input name="alt" defaultValue={officer?.alt ?? ""} placeholder="Portrait of Jane Doe" />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Links & placement">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Placement line" hint="Only with their consent.">
              <Input name="placementNote" value={v.placementNote} onChange={set("placementNote")} placeholder="Previously at Citadel" />
            </Field>
            <Field label="Company badge">
              <Select name="companyId" value={v.companyId} onChange={set("companyId")}>
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firm}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="LinkedIn" error={err.linkedin} className="sm:col-span-2">
              <Input name="linkedin" type="url" value={v.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/in/…" />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Visibility">
          <Switch
            name="visible"
            label="Show on Team page"
            hint="Turn off to enter next year's board in advance. Only visible officers can lead a track."
            defaultChecked={officer?.visible ?? true}
            onCheckedChange={markDirty}
          />
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={officer ? "Save" : "Add officer"} cancelHref="/admin/officers" error={state.error} />
      </Card>
      <PreviewPanel className="lg:self-start">
        <div className="bg-bone p-4">
          <PersonCard person={preview} sizes="256px" />
        </div>
      </PreviewPanel>
      <SaveToast state={state} />
    </form>
  );
}

export function AcademicYearForm({ value, action }: { value?: string; action: Action }) {
  const { state, formAction, pending, markDirty, err } = useSaveForm(action);
  return (
    <form action={formAction} onChange={markDirty} noValidate className="flex flex-wrap items-start gap-3">
      <Field label="Academic year" hint="Titles the Team page, e.g. “Leadership, 2026–27”." error={err.academicYear} className="w-full sm:w-80">
        <Input name="academicYear" defaultValue={value ?? ""} placeholder="2026–27" className="max-w-40" />
      </Field>
      <Button type="submit" variant="secondary" pending={pending} className="sm:mt-6">
        {pending ? "Saving…" : "Save year"}
      </Button>
      {state.error ? (
        <div className="basis-full">
          <FormError state={state} />
        </div>
      ) : null}
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
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const id = (k: string) => `${track.id}-${k}`;
  return (
    <form action={formAction} onChange={markDirty} aria-labelledby={id("title")} noValidate>
      <Card as="div">
        <CardHeader id={id("title")} title={track.name} />
        <CardSection>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Role label" error={err.roleLabel}>
              <Input name="roleLabel" defaultValue={track.roleLabel} />
            </Field>
            <Field label="Name" error={err.name}>
              <Input name="name" defaultValue={track.name} />
            </Field>
            <Field label="Description" error={err.description} className="sm:col-span-2">
              <Textarea name="description" rows={3} defaultValue={track.description} />
            </Field>
            <Field label="Good fit if you…">
              <Input name="goodFit" defaultValue={track.goodFit ?? ""} />
            </Field>
            <Field label="Sample problem">
              <Input name="sampleProblem" defaultValue={track.sampleProblem ?? ""} />
            </Field>
            <Field label="Recommended background" hint="2–4 lines, one per line; recommended, never “required”." error={err.recommendedBackground}>
              <Textarea name="recommendedBackground" rows={4} defaultValue={track.recommendedBackground.join("\n")} />
            </Field>
            <Field label="Lead" hint="Picked from officers shown on the Team page.">
              <Select name="leadSlug" defaultValue={track.leadSlug ?? ""}>
                <option value="">Lead to be announced</option>
                {leads.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={`Save ${track.name}`} error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}
