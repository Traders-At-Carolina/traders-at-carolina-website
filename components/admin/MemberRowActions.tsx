"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/action";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

/** Approve (with an optional track) or decline one access request (spec 06 §6.2 Requests). */
export function RequestActions({ id, name, approve, decline }: { id: string; name: string; approve: Action; decline: Action }) {
  const [a, approveAction, approving] = useActionState(approve, {});
  const [d, declineAction, declining] = useActionState(decline, {});
  const result = (a.at ?? 0) > (d.at ?? 0) ? a : d;
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-3">
        <form action={approveAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <select name="track" aria-label={`Track for ${name}`} defaultValue="" className="min-h-11 border border-rule bg-white px-2 text-caption">
            <option value="">No track</option>
            <option value="trading">Trading</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
          </select>
          <button type="submit" disabled={approving} aria-label={`Approve ${name}`} className="min-h-11 px-2 font-semibold text-navy underline underline-offset-4 disabled:opacity-60">
            {approving ? "Approving…" : "Approve"}
          </button>
        </form>
        <form
          action={declineAction}
          onSubmit={(e) => {
            if (!window.confirm(`Decline ${name}'s request? The portal tells them it wasn't approved.`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button type="submit" disabled={declining} aria-label={`Decline ${name}`} className="min-h-11 px-2 text-caption font-medium text-ink-2 hover:underline disabled:opacity-60">
            {declining ? "Declining…" : "Decline"}
          </button>
        </form>
      </div>
      <p role="status" className="text-caption text-ink-2">
        {result.error ?? result.ok ?? ""}
      </p>
    </div>
  );
}

/** Make member / Make admin for one Clerk account (spec 06 §6.2 All accounts). */
export function AccountActions({
  userId,
  email,
  name,
  isMember,
  isAdmin,
  makeMember,
  makeAdmin,
}: {
  userId: string;
  email?: string;
  name: string;
  isMember: boolean;
  isAdmin: boolean;
  makeMember: Action;
  makeAdmin: Action;
}) {
  const [m, memberAction, addingMember] = useActionState(makeMember, {});
  const [ad, adminAction, addingAdmin] = useActionState(makeAdmin, {});
  const result = (m.at ?? 0) > (ad.at ?? 0) ? m : ad;
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex gap-3">
        {isMember ? null : (
          <form action={memberAction}>
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" disabled={addingMember} aria-label={`Make ${name} a member`} className="min-h-11 px-2 text-caption font-medium text-navy hover:underline disabled:opacity-60">
              {addingMember ? "Adding…" : "Make member"}
            </button>
          </form>
        )}
        {isAdmin || !email ? null : (
          <form
            action={adminAction}
            onSubmit={(e) => {
              if (!window.confirm(`Make ${name} an admin? They will be able to edit the site and manage members.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="email" value={email} />
            <button type="submit" disabled={addingAdmin} aria-label={`Make ${name} an admin`} className="min-h-11 px-2 text-caption font-medium text-navy hover:underline disabled:opacity-60">
              {addingAdmin ? "Granting…" : "Make admin"}
            </button>
          </form>
        )}
      </div>
      <p role="status" className="text-caption text-ink-2">
        {result.error ?? result.ok ?? ""}
      </p>
    </div>
  );
}
