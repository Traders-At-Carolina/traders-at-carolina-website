"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/lib/admin/action";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

/**
 * The editor form loop shared by every admin screen (spec 06 §6.0): action state, an unsaved-changes guard that
 * clears on a successful save, and navigation when the action asks for it (after a create or delete).
 */
export function useSaveForm(action: (p: ActionState, f: FormData) => Promise<ActionState>) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setDirty(false);
  }
  useUnsavedChanges(dirty && !pending);
  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
  }, [state.redirectTo, router]);
  return { state, formAction, pending, dirty, markDirty: () => setDirty(true), err: state.fieldErrors ?? {} };
}
