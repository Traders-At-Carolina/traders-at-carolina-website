"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { buttonClasses } from "@/components/Button";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ImageAsset } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import type { PhotoSnapshot } from "@/lib/admin/photos";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

type PhotoFormProps = {
  photo?: PhotoSnapshot;
  action: Action;
  deleteAction?: () => Promise<ActionState>;
  /** Where the photo is shown, e.g. ["Home slot 1"]; a slotted photo can't be deleted. */
  placements?: string[];
};

const inputClass = (invalid?: boolean) =>
  `mt-2 w-full border bg-white px-3 py-2 text-body focus:border-navy focus:outline-none ${invalid ? "border-black" : "border-rule"}`;

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

  // A new successful save becomes the unsaved-changes baseline (adjusting state while rendering, not in an effect).
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setSaved({ image, alt, caption, ratio });
  }
  const redirectTo = state.redirectTo ?? deleteState.redirectTo;
  useEffect(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  const err = state.fieldErrors ?? {};
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form action={formAction} className="flex flex-col gap-6" noValidate>
        <ImageUpload name="image" folder="photos" value={image} onChange={setImage} label="Photo" error={err.image} />

        <div>
          <label htmlFor="caption" className="text-caption font-medium text-ink-2">
            Caption
          </label>
          <input
            id="caption"
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={120}
            aria-invalid={Boolean(err.caption)}
            aria-describedby={err.caption ? "caption-error" : "caption-hint"}
            className={inputClass(Boolean(err.caption))}
          />
          <p id={err.caption ? "caption-error" : "caption-hint"} className={`mt-1 text-caption ${err.caption ? "text-black" : "text-ink-3"}`}>
            {err.caption ?? "Editorial and short, e.g. “Mock trading night, Spring 2026”."}
          </p>
        </div>

        <div>
          <label htmlFor="alt" className="text-caption font-medium text-ink-2">
            Alt text
          </label>
          <textarea
            id="alt"
            name="alt"
            rows={3}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            aria-invalid={Boolean(err.alt)}
            aria-describedby={err.alt ? "alt-error" : "alt-hint"}
            className={inputClass(Boolean(err.alt))}
          />
          <p id={err.alt ? "alt-error" : "alt-hint"} className={`mt-1 text-caption ${err.alt ? "text-black" : "text-ink-3"}`}>
            {err.alt ?? "What someone who can't see the photo should know, e.g. “Members at a whiteboard during a mock trading session”."}
          </p>
        </div>

        <fieldset>
          <legend className="text-caption font-medium text-ink-2">Crop</legend>
          <div className="mt-2 flex gap-6">
            {(["3:2", "4:5"] as const).map((r) => (
              <label key={r} className="flex min-h-11 items-center gap-2 text-body">
                <input type="radio" name="ratio" value={r} checked={ratio === r} onChange={() => setRatio(r)} />
                {r === "3:2" ? "Landscape (3:2)" : "Portrait (4:5)"}
              </label>
            ))}
          </div>
        </fieldset>

        {state.error ? (
          <p role="alert" className="text-body text-black">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={pending} className={buttonClasses({ className: "disabled:opacity-60" })}>
            {pending ? "Saving…" : photo ? "Save" : "Add to library"}
          </button>
          {dirty ? <span className="text-caption text-ink-3">Unsaved changes</span> : null}
        </div>
      </form>

      <aside aria-label="Preview" className="flex flex-col gap-3">
        <p className="text-caption font-medium text-ink-2">Preview</p>
        <figure>
          <div className={`relative overflow-hidden bg-wash ${ratio === "4:5" ? "aspect-[4/5]" : "aspect-[3/2]"}`}>
            {image ? (
              <Image src={image} alt="" fill sizes="320px" placeholder={image.blurDataURL ? "blur" : "empty"} className="object-cover saturate-[0.88]" />
            ) : (
              <div className="flex h-full items-center justify-center text-caption text-ink-3">No photo yet</div>
            )}
          </div>
          <figcaption className="mt-3 text-caption text-ink-3">{caption || "Caption"}</figcaption>
        </figure>
        {image && image.width < 1200 ? <p className="text-caption text-ink-2">This photo is {image.width}px wide and may look soft on large screens.</p> : null}

        {deleteAction ? (
          <form
            action={deleteFormAction}
            onSubmit={(e) => {
              if (!window.confirm("Delete this photo from the library? You can undo this right after.")) e.preventDefault();
            }}
            className="mt-6 border-t border-rule pt-6"
          >
            {placements.length ? (
              <p className="text-caption text-ink-2">On {placements.join(" and ")}. Take it off those slots before deleting it.</p>
            ) : (
              <button type="submit" disabled={deleting} className="min-h-11 text-caption font-medium text-navy hover:underline disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete photo"}
              </button>
            )}
            {deleteState.error ? <p className="mt-2 text-caption text-black">{deleteState.error}</p> : null}
          </form>
        ) : null}
      </aside>

      <SaveToast state={state} />
    </div>
  );
}
