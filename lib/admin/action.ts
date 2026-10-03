import { currentUser } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import type { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";

/**
 * What every admin form gets back (spec 06 §6.0). `undoId` + `viewHref` drive the save toast; `fieldErrors` sit under
 * their inputs; `redirectTo` lets a form move on (e.g. back to the library after a delete).
 */
export type ActionState = {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  undoId?: number | null;
  viewHref?: string;
  redirectTo?: string;
  /** Changes on every save, so a toast reappears even when the message text repeats. */
  at?: number;
};

export type Actor = { actorId: string; actorEmail: string | null };

/** A user-facing rejection: a whole-form message and/or per-field messages. Nothing has been written. */
export class FormError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "FormError";
  }
}

export async function currentActor(): Promise<Actor> {
  const { userId } = await requireAdmin();
  const me = await currentUser();
  return { actorId: userId, actorEmail: me?.primaryEmailAddress?.emailAddress ?? null };
}

/**
 * The one write path for admin saves (spec 06 §3): checks the admin session, runs the change, and turns failures into
 * form state. `run` parses with zod (parseForm), applies the collection's rules, writes, audits and publishes.
 */
export async function adminAction(run: (who: Actor) => Promise<ActionState>): Promise<ActionState> {
  try {
    const who = await currentActor();
    return { ...(await run(who)), at: Date.now() };
  } catch (error) {
    if (error instanceof AdminAccessError) return { error: "Only admins can do that.", at: Date.now() };
    if (error instanceof FormError) return { error: error.message, fieldErrors: error.fieldErrors, at: Date.now() };
    console.error("admin action failed", error);
    return { error: "Something went wrong, and nothing was saved. Try again.", at: Date.now() };
  }
}

/** Parses form input, mapping zod issues to the first message per field. */
export function parseForm<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  throw new FormError("Check the highlighted fields.", fieldErrors);
}

/** Expires the public pages that read these collections (spec 06 §3). Server Actions only. */
export function publish(...tags: string[]): void {
  for (const tag of tags) updateTag(tag);
}

export const SAVED = "Saved · live in a few seconds";
