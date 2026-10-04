"use client";

import { ImageOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardSection } from "@/components/admin/ui/Card";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { Banner } from "@/components/admin/ui/Feedback";
import { Field, Input, Textarea } from "@/components/admin/ui/Field";
import { FormFooter, PreviewPanel } from "@/components/admin/ui/Form";
import type { ImageAsset } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import type { PhotoSnapshot } from "@/lib/admin/photos";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { MIN_PHOTO_WIDTH } from "@/lib/thresholds";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

type PhotoFormProps = {
  photo?: PhotoSnapshot;
  action: Action;
  deleteAction?: () => Promise<ActionState>;
  /** Where the photo is shown, e.g. ["Home slot 1"]; a slotted photo can't be deleted. */
  placements?: string[];
};

const RATIOS = [
  ["3:2", "Landscape (3:2)"],
  ["4:5", "Portrait (4:5)"],
] as const;

/** Add or edit a library photo (spec 06 §6.6) with a live preview cropped to its ratio. */
export function PhotoForm({ photo, action, deleteAction, placements = [] }: PhotoFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [deleteState, deleteFormAction, deleting] = useActionState<ActionState>(deleteAction ?? (async () => ({})), {});
  const [saved, setSaved] = useState({ image: photo?.image ?? null, alt: photo?.alt ?? "", caption: photo?.caption ?? "", ratio: photo?.ratio ?? "3:2" });
  const [image, setImage] = useState<ImageAsset | null>(saved.image);
  const [alt, setAlt] = useState(saved.alt);
  const [caption, setCaption] = useState(saved.caption);
  const [ratio, setRatio] = useState<"3:2" | "4:5">(saved.ratio);
  const dirty = image?.src !== saved.image?.src || alt !== saved.alt || caption !== saved.caption || ratio !== saved.ratio;
  useUnsavedChanges(dirty && !pending);
  const [confirming, setConfirming] = useState(false);
  const deleteForm = useRef<HTMLFormElement>(null);

  // A new successful save becomes the unsaved-changes baseline (adjusting state while rendering, not in an effect).
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setSaved({ image, alt, caption, ratio });
  }
  // Close the confirm dialog once the delete comes back (it redirects on success, or shows its error).
  const [seenDeleteAt, setSeenDeleteAt] = useState(deleteState.at);
  if (deleteState.at !== seenDeleteAt) {
    setSeenDeleteAt(deleteState.at);
    setConfirming(false);
  }
  const redirectTo = state.redirectTo ?? deleteState.redirectTo;
  useEffect(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  const err = state.fieldErrors ?? {};
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form action={formAction} noValidate>
          <Card as="div">
            <CardSection>
              <div className="grid gap-5">
                <ImageUpload name="image" folder="photos" value={image} onChange={setImage} label="Photo" error={err.image} />
                <Field label="Caption" error={err.caption} hint={err.caption ? undefined : "Editorial and short, e.g. “Mock trading night, Spring 2026”."}>
                  <Input name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} />
                </Field>
                <Field
                  label="Alt text"
                  error={err.alt}
                  hint={err.alt ? undefined : "What someone who can't see the photo should know, e.g. “Members at a whiteboard during a mock trading session”."}
                >
                  <Textarea name="alt" rows={3} value={alt} onChange={(e) => setAlt(e.target.value)} />
                </Field>
                <fieldset>
                  <legend className="text-ui-label font-medium text-ui-text">Crop</legend>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {RATIOS.map(([r, l]) => (
                      <label
                        key={r}
                        className="flex h-9 cursor-pointer items-center gap-2 rounded-ui-md border border-ui-border bg-ui-surface px-3 text-ui-base text-ui-text transition-colors duration-150 hover:border-ui-border-strong has-[:checked]:border-ui-accent has-[:checked]:bg-ui-accent-soft"
                      >
                        <input type="radio" name="ratio" value={r} checked={ratio === r} onChange={() => setRatio(r)} className="accent-ui-accent" />
                        {l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </CardSection>
            <FormFooter pending={pending} dirty={dirty} submitLabel={photo ? "Save" : "Add to library"} cancelHref="/admin/photos" error={state.error} />
          </Card>
        </form>

        <PreviewPanel note={image && image.width < MIN_PHOTO_WIDTH ? `This photo is ${image.width}px wide and may look soft on large screens.` : undefined}>
          <figure className="bg-ui-surface p-3">
            <div className={`relative overflow-hidden rounded-ui-md bg-ui-subtle ${ratio === "4:5" ? "aspect-[4/5]" : "aspect-[3/2]"}`}>
              {image ? (
                <Image src={image} alt="" fill sizes="320px" placeholder={image.blurDataURL ? "blur" : "empty"} className="object-cover saturate-[0.88]" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-ui-hint text-ui-text-3">
                  <ImageOff aria-hidden className="size-4" />
                  No photo yet
                </div>
              )}
            </div>
            <figcaption className="mt-2 text-ui-label text-ui-text-2">{caption || "Caption"}</figcaption>
          </figure>
        </PreviewPanel>
      </div>

      {deleteAction ? (
        <form ref={deleteForm} action={deleteFormAction} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-ui-lg border border-ui-danger/25 bg-ui-surface px-6 py-4 shadow-ui-card">
          <div>
            <p className="text-ui-base font-medium text-ui-text">Delete photo</p>
            {placements.length ? null : <p className="mt-0.5 text-ui-label text-ui-text-2">You can undo this right after.</p>}
            {deleteState.error ? <p className="mt-1 text-ui-label font-medium text-ui-danger">{deleteState.error}</p> : null}
          </div>
          {placements.length ? (
            <Banner tone="info" className="w-full">
              On {placements.join(" and ")}. Take it off those slots before deleting it.
            </Banner>
          ) : (
            <Button variant="secondary" icon={Trash2} onClick={() => setConfirming(true)} pending={deleting} className="text-ui-danger">
              {deleting ? "Deleting…" : "Delete photo"}
            </Button>
          )}
          <ConfirmDialog
            open={confirming}
            onClose={() => setConfirming(false)}
            onConfirm={() => deleteForm.current?.requestSubmit()}
            pending={deleting}
            title="Delete photo?"
            description="Delete this photo from the library? You can undo this right after."
            confirmLabel="Delete photo"
          />
        </form>
      ) : null}

      <SaveToast state={state} />
    </>
  );
}
