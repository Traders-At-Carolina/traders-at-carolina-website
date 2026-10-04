"use client";

import { upload } from "@vercel/blob/client";
import { FileUp, LoaderCircle, Pencil, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { Legend, RadioOption } from "@/components/admin/SeasonForms";
import { Button, buttonClasses } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/admin/ui/Dialog";
import { Banner } from "@/components/admin/ui/Feedback";
import { Checkbox, DateTimeInput, Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { FormError, FormFooter } from "@/components/admin/ui/Form";
import { Menu } from "@/components/admin/ui/Menu";
import { Switch } from "@/components/admin/ui/Switch";
import type { TrackId } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { KIND_LABELS, SECTION_LABELS, TRACK_LABELS } from "@/lib/admin/portal-labels";
import { MAX_PRIVATE_UPLOAD_BYTES, resourceContentType, resourcePathname } from "@/lib/admin/upload-policy";
import { useSaveForm } from "@/lib/admin/use-save-form";
import type { StoredFile } from "@/lib/db/schema";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;
type PortalAudience = "signed_in" | "members";

const AUDIENCES: Array<[PortalAudience, string]> = [
  ["signed_in", "Anyone signed in"],
  ["members", "Members only"],
];

function AudienceField({ value, onChange, error }: { value: PortalAudience; onChange: (v: PortalAudience) => void; error?: string }) {
  return (
    <fieldset>
      <Legend>Who can see it</Legend>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {AUDIENCES.map(([v, l]) => (
          <RadioOption key={v} name="audience" value={v} checked={value === v} onChange={() => onChange(v)}>
            {l}
          </RadioOption>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-ui-hint font-medium text-ui-danger">{error}</p> : null}
    </fieldset>
  );
}

// ── Announcements (spec 06 §6.12) ──

export type AnnouncementValues = { title: string; body: string; audience: PortalAudience; pinned: boolean; showFrom: string; showUntil: string };

export function AnnouncementForm({ announcement, action }: { announcement?: AnnouncementValues; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [audience, setAudience] = useState<PortalAudience>(announcement?.audience ?? "signed_in");
  return (
    <form action={formAction} onChange={markDirty} noValidate className="max-w-3xl">
      <Card as="div">
        <CardSection title="Announcement">
          <div className="grid gap-5">
            <Field label="Title" error={err.title}>
              <Input name="title" defaultValue={announcement?.title} />
            </Field>
            <Field label="Body" hint="A sentence or two. Links like [the tracker](https://…) and *emphasis* work, as in the FAQ." error={err.body}>
              <Textarea name="body" rows={4} defaultValue={announcement?.body} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="When" description="Leave both blank to show it until you delete it. All times are Eastern.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Show from" hint="Eastern time" error={err.showFrom} optional>
              <DateTimeInput name="showFrom" defaultValue={announcement?.showFrom ?? ""} />
            </Field>
            <Field label="Show until" hint="Eastern time" error={err.showUntil} optional>
              <DateTimeInput name="showUntil" defaultValue={announcement?.showUntil ?? ""} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Visibility">
          <div className="grid gap-5">
            <AudienceField value={audience} onChange={setAudience} error={err.audience} />
            <Switch name="pinned" label="Pin to the top" hint="Pinned announcements show before the rest." defaultChecked={announcement?.pinned} onCheckedChange={markDirty} />
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={announcement ? "Save" : "Post announcement"} cancelHref="/admin/announcements" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

// ── Resources (spec 06 §6.11) ──


export type ResourceValues = {
  title: string;
  kind: keyof typeof KIND_LABELS;
  section: keyof typeof SECTION_LABELS;
  tracks: TrackId[];
  description: string | null;
  url: string | null;
  file: StoredFile | null;
  audience: PortalAudience;
  pinned: boolean;
  hidden: boolean;
};

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Drop or pick a document; it uploads straight to the private Blob store through /api/admin/blob-private. */
function FileUpload({ value, onChange, error, fileName }: { value: StoredFile | null; onChange: (file: StoredFile) => void; error?: string; fileName?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ busy: boolean; message?: string }>({ busy: false });
  const [over, setOver] = useState(false);
  const [name, setName] = useState(fileName);

  async function handle(file: File | undefined) {
    if (!file) return;
    const contentType = resourceContentType(file);
    if (!contentType) {
      setStatus({ busy: false, message: "Use a PDF, PowerPoint, Word, Excel, text, zip or image file." });
      return;
    }
    if (file.size > MAX_PRIVATE_UPLOAD_BYTES) {
      setStatus({ busy: false, message: "Files can be up to 50 MB. For bigger files, paste a Google Drive link instead." });
      return;
    }
    setStatus({ busy: true, message: "Uploading…" });
    try {
      const blob = await upload(resourcePathname(file.name), file, {
        access: "private",
        handleUploadUrl: "/api/admin/blob-private",
        contentType,
        multipart: file.size > 8 * 1024 * 1024,
      });
      onChange({ pathname: blob.pathname, size: file.size, contentType });
      setName(file.name);
      setStatus({ busy: false, message: "Uploaded." });
    } catch (e) {
      setStatus({ busy: false, message: `Upload failed: ${(e as Error).message}. Try again.` });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-ui-label font-medium text-ui-text">
        File
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-ui-lg border border-dashed px-4 py-6 text-center transition-colors duration-150 ${
          over ? "border-ui-accent bg-ui-accent-soft" : error ? "border-ui-danger bg-ui-surface" : "border-ui-border-strong bg-ui-surface hover:bg-ui-accent-soft"
        }`}
      >
        <FileUp aria-hidden className="size-5 text-ui-text-3" />
        {value ? (
          <p className="text-ui-base text-ui-text">
            <span className="font-medium">{name ?? "Uploaded file"}</span> <span className="text-ui-text-3 tabular-nums">· {formatSize(value.size)}</span>
          </p>
        ) : null}
        <p className="text-ui-base text-ui-text-2">{value ? "Drop a new file to replace it, or" : "Drop a file here, or"}</p>
        <button type="button" onClick={() => input.current?.click()} disabled={status.busy} aria-describedby={`${id}-status`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          {status.busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
          {status.busy ? "Uploading…" : "Choose a file"}
        </button>
        <p className="text-ui-hint text-ui-text-3">PDF, PowerPoint, Word, Excel, text, zip or images, up to 50 MB. Only people who may see the resource can open it.</p>
        <input ref={input} type="file" hidden aria-labelledby={`${id}-label`} onChange={(e) => void handle(e.target.files?.[0])} />
      </div>
      <p id={`${id}-status`} role="status" className="text-ui-hint text-ui-text-3">
        {status.message}
      </p>
      {error ? <p className="text-ui-hint font-medium text-ui-danger">{error}</p> : null}
      <input type="hidden" name="file" value={value ? JSON.stringify(value) : ""} />
    </div>
  );
}

export function ResourceForm({ resource, action, uploadsEnabled, fileName }: { resource?: ResourceValues; action: Action; uploadsEnabled: boolean; fileName?: string }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  const [source, setSource] = useState<"file" | "link">(resource?.file && uploadsEnabled ? "file" : resource?.url || !uploadsEnabled ? "link" : "file");
  const [file, setFile] = useState<StoredFile | null>(resource?.file ?? null);
  const [audience, setAudience] = useState<PortalAudience>(resource?.audience ?? "members");
  return (
    <form action={formAction} onChange={markDirty} noValidate className="max-w-3xl">
      <Card as="div">
        <CardSection title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" error={err.title} className="sm:col-span-2">
              <Input name="title" defaultValue={resource?.title} />
            </Field>
            <Field label="Kind" error={err.kind}>
              <Select name="kind" defaultValue={resource?.kind ?? "slides"}>
                {Object.entries(KIND_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section" hint="Where it shows in the portal." error={err.section}>
              <Select name="section" defaultValue={resource?.section ?? "learning"}>
                {Object.entries(SECTION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset className="sm:col-span-2">
              <Legend>Tracks</Legend>
              <p className="mt-0.5 text-ui-hint text-ui-text-3">Leave all unticked for every track.</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {(Object.keys(TRACK_LABELS) as TrackId[]).map((t) => (
                  <Checkbox key={t} name="tracks" value={t} label={TRACK_LABELS[t]} defaultChecked={resource?.tracks.includes(t)} />
                ))}
              </div>
              {err.tracks ? <p className="mt-1.5 text-ui-hint font-medium text-ui-danger">{err.tracks}</p> : null}
            </fieldset>
            <Field label="Description" optional error={err.description} className="sm:col-span-2">
              <Textarea name="description" rows={2} defaultValue={resource?.description ?? ""} />
            </Field>
          </div>
        </CardSection>
        <CardSection title="Source">
          <div className="grid gap-5">
            {!uploadsEnabled ? <Banner tone="warning">File uploads need the private file store; paste a link for now.</Banner> : null}
            <fieldset>
              <Legend>The resource is</Legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex min-h-9 flex-wrap items-center gap-2.5 rounded-ui-md border border-ui-border bg-ui-surface px-3 py-2 text-ui-base transition-colors duration-150 has-[:checked]:border-ui-accent has-[:checked]:bg-ui-accent-soft ${
                    uploadsEnabled ? "cursor-pointer text-ui-text hover:border-ui-border-strong" : "cursor-not-allowed text-ui-text-3"
                  }`}
                >
                  <input type="radio" name="source" value="file" checked={source === "file"} disabled={!uploadsEnabled} onChange={() => setSource("file")} className="size-4 shrink-0 accent-ui-accent" />
                  Upload a file
                </label>
                <RadioOption name="source" value="link" checked={source === "link"} onChange={() => setSource("link")}>
                  Paste a link
                </RadioOption>
              </div>
              {err.source ? <p className="mt-1.5 text-ui-hint font-medium text-ui-danger">{err.source}</p> : null}
            </fieldset>
            {source === "file" && uploadsEnabled ? (
              <FileUpload
                value={file}
                fileName={fileName}
                error={err.file}
                onChange={(f) => {
                  setFile(f);
                  markDirty();
                }}
              />
            ) : (
              <Field label="Link" hint="For example a Google Drive or YouTube link." error={err.url}>
                <Input name="url" type="url" defaultValue={resource?.url ?? ""} placeholder="https://" />
              </Field>
            )}
          </div>
        </CardSection>
        <CardSection title="Visibility">
          <div className="grid gap-5">
            <AudienceField value={audience} onChange={setAudience} error={err.audience} />
            <Switch name="pinned" label="Pinned" hint="Pinned resources show first in their section." defaultChecked={resource?.pinned} onCheckedChange={markDirty} />
            <Switch name="hidden" label="Hidden" hint="Keeps the resource here without showing it in the portal." defaultChecked={resource?.hidden} onCheckedChange={markDirty} />
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel={resource ? "Save" : "Add resource"} cancelHref="/admin/resources" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

// ── Portal settings (spec 06 §6.13) ──

export type PortalSettingsValues = { welcomeMember?: string; welcomeVisitor?: string; alumniAccess: boolean; acceptRequests: boolean };

export function PortalSettingsForm({ settings, action }: { settings: PortalSettingsValues; action: Action }) {
  const { state, formAction, pending, dirty, markDirty, err } = useSaveForm(action);
  return (
    <form action={formAction} onChange={markDirty} noValidate className="flex flex-col gap-6">
      <Card as="div">
        <CardHeader title="Welcome lines" description="The lead under “Welcome, {name}.” at the top of the portal. Blank uses the standard line." />
        <CardSection>
          <div className="grid gap-5">
            <Field label="For members" optional error={err.welcomeMember}>
              <Textarea name="welcomeMember" rows={2} defaultValue={settings.welcomeMember ?? ""} />
            </Field>
            <Field label="For signed-in visitors who aren't members yet" optional error={err.welcomeVisitor}>
              <Textarea name="welcomeVisitor" rows={2} defaultValue={settings.welcomeVisitor ?? ""} />
            </Field>
          </div>
        </CardSection>
      </Card>
      <Card as="div">
        <CardHeader title="Access" description="Takes effect on each person's next page load." />
        <CardSection>
          <div className="grid gap-5">
            <Switch name="alumniAccess" label="Alumni keep member access" hint="Off: roster rows marked Alumni see the portal as visitors." defaultChecked={settings.alumniAccess} onCheckedChange={markDirty} />
            <Switch name="acceptRequests" label="Accept access requests" hint="Off: the portal hides Request access, and new requests are refused." defaultChecked={settings.acceptRequests} onCheckedChange={markDirty} />
          </div>
        </CardSection>
        <FormFooter pending={pending} dirty={dirty} submitLabel="Save settings" error={state.error} />
      </Card>
      <SaveToast state={state} />
    </form>
  );
}

// ── Member links (spec 06 §6.13) ──

export type PortalLinkValues = { label: string; url: string; description: string | null; audience: PortalAudience };

/** Add or edit one member link in a dialog. Closes itself after a successful save. */
export function PortalLinkDialog({ link, action, trigger }: { link?: PortalLinkValues; action: Action; trigger: "add" | "edit" }) {
  const { state, formAction, pending, err } = useSaveForm(action);
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<PortalAudience>(link?.audience ?? "members");
  const [seenAt, setSeenAt] = useState(state.at);
  const form = useRef<HTMLFormElement>(null);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setOpen(false);
  }
  return (
    <>
      {trigger === "add" ? (
        <Button size="sm" variant="primary" icon={Plus} onClick={() => setOpen(true)}>
          Add link
        </Button>
      ) : (
        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setOpen(true)} aria-label={`Edit ${link?.label ?? "link"}`}>
          Edit
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={link ? "Edit link" : "Add link"}
        description="Shown as a card under Member tools, in this order."
        footer={
          <>
            <Button onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" pending={pending} onClick={() => form.current?.requestSubmit()}>
              {link ? "Save" : "Add link"}
            </Button>
          </>
        }
      >
        <form ref={form} action={formAction} noValidate className="grid gap-5">
          <Field label="Label" error={err.label}>
            <Input name="label" defaultValue={link?.label} placeholder="Internship tracker" />
          </Field>
          <Field label="URL" error={err.url}>
            <Input name="url" type="url" defaultValue={link?.url} placeholder="https://" />
          </Field>
          <Field label="Short description" optional error={err.description}>
            <Textarea name="description" rows={2} defaultValue={link?.description ?? ""} />
          </Field>
          <AudienceField value={audience} onChange={setAudience} error={err.audience} />
          <FormError state={state.error && !state.fieldErrors ? state : {}} />
        </form>
      </Dialog>
      <SaveToast state={state.ok ? state : {}} />
    </>
  );
}

/** Delete one member link, after a confirmation. */
export function PortalLinkDelete({ label, action }: { label: string; action: () => Promise<ActionState> }) {
  const del = useSaveForm(action as unknown as Action);
  const form = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [seenAt, setSeenAt] = useState(del.state.at);
  if (del.state.at !== seenAt) {
    setSeenAt(del.state.at);
    setConfirming(false);
  }
  return (
    <>
      <Menu label={`More actions for ${label}`} items={[{ label: "Delete", onSelect: () => setConfirming(true), danger: true, disabled: del.pending }]} />
      <form ref={form} action={del.formAction} hidden />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => form.current?.requestSubmit()}
        pending={del.pending}
        title="Remove link?"
        description={`Remove “${label}” from Member tools? You can undo this right after.`}
        confirmLabel="Remove link"
      />
      <SaveToast state={del.state} />
    </>
  );
}
