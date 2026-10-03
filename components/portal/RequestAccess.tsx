"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/Button";
import type { PortalContent } from "@/content/types";
import type { AccessRequest } from "@/lib/data/portal";
import type { RequestResult } from "@/lib/members/requests";

type RequestAccessProps = {
  copy: PortalContent["requestAccess"];
  /** The viewer's latest request (spec 06 §8 myRequest). */
  request: AccessRequest | null;
  /** The requestMembership server action, injected by the route. */
  action: (input: { note?: string }) => Promise<RequestResult>;
};

const REFUSALS: Record<Extract<RequestResult, { ok: false }>["reason"], string> = {
  "already-member": "You're already a member. Reload the page to see your resources.",
  "already-pending": "You've already asked. An officer will review your request soon.",
  "requests-closed": "Requests aren't open right now.",
};

/**
 * "Request access" for signed-in non-members while requests are open (spec 09 §4.1, spec 06 §9). A pending request
 * shows its status instead of the form; a declined one says so and offers to ask again.
 */
export function RequestAccess({ copy, request, action }: RequestAccessProps) {
  const [result, submit, sending] = useActionState(
    async (_previous: RequestResult | null, form: FormData) => action({ note: String(form.get("note") ?? "") }),
    null,
  );

  if (result?.ok || request?.status === "pending") {
    return (
      <p role="status" className="max-w-prose text-body">
        {copy.pending}
      </p>
    );
  }

  return (
    <form action={submit} className="flex max-w-prose flex-col gap-3">
      <p className="text-body text-ink-2">{request?.status === "declined" ? copy.declined : copy.prompt}</p>
      <label htmlFor="request-note" className="sr-only">
        Note for the officers (optional)
      </label>
      <textarea
        id="request-note"
        name="note"
        rows={2}
        maxLength={500}
        placeholder={copy.notePlaceholder}
        className="w-full surface-graphite border border-rule-strong p-3 text-body placeholder:text-ink-3"
      />
      <div>
        <button type="submit" disabled={sending} className={buttonClasses({ variant: "secondary", className: "disabled:opacity-60" })}>
          {copy.button}
        </button>
      </div>
      {result && !result.ok ? (
        <p role="alert" className="text-caption text-ink-2">
          {REFUSALS[result.reason]}
        </p>
      ) : null}
    </form>
  );
}
