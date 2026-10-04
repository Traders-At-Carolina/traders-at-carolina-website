"use client";

import { Check } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { Select } from "@/components/admin/ui/Field";
import { cx } from "@/components/admin/ui/cx";
import type { ActionState } from "@/lib/admin/action";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

function Result({ state }: { state: ActionState }) {
  return (
    <p role="status" className={cx("text-ui-hint empty:hidden", state.error ? "font-medium text-ui-danger" : "text-ui-text-2")}>
      {state.error ?? state.ok ?? ""}
    </p>
  );
}

/** Approve (with an optional track) or decline one access request (spec 06 §6.2 Requests). */
export function RequestActions({ id, name, approve, decline }: { id: string; name: string; approve: Action; decline: Action }) {
  const [a, approveAction, approving] = useActionState(approve, {});
  const [d, declineAction, declining] = useActionState(decline, {});
  const [confirming, setConfirming] = useState(false);
  const declineForm = useRef<HTMLFormElement>(null);
  const result = (a.at ?? 0) > (d.at ?? 0) ? a : d;
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approveAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <span className="w-36">
            <Select name="track" aria-label={`Track for ${name}`} defaultValue="">
              <option value="">No track</option>
              <option value="trading">Trading</option>
              <option value="research">Research</option>
              <option value="development">Development</option>
            </Select>
          </span>
          <Button type="submit" variant="primary" size="sm" icon={Check} pending={approving} aria-label={`Approve ${name}`}>
            {approving ? "Approving…" : "Approve"}
          </Button>
        </form>
        <form ref={declineForm} action={declineAction}>
          <input type="hidden" name="id" value={id} />
          <Button size="sm" pending={declining} aria-label={`Decline ${name}`} onClick={() => setConfirming(true)}>
            {declining ? "Declining…" : "Decline"}
          </Button>
          <ConfirmDialog
            open={confirming}
            onClose={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              declineForm.current?.requestSubmit();
            }}
            title={`Decline ${name}'s request?`}
            description="The portal tells them it wasn't approved."
            confirmLabel="Decline"
          />
        </form>
      </div>
      <Result state={result} />
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
  const [confirming, setConfirming] = useState(false);
  const adminForm = useRef<HTMLFormElement>(null);
  const result = (m.at ?? 0) > (ad.at ?? 0) ? m : ad;
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex gap-2">
        {isMember ? null : (
          <form action={memberAction}>
            <input type="hidden" name="userId" value={userId} />
            <Button type="submit" size="sm" pending={addingMember} aria-label={`Make ${name} a member`}>
              {addingMember ? "Adding…" : "Make member"}
            </Button>
          </form>
        )}
        {isAdmin || !email ? null : (
          <form ref={adminForm} action={adminAction}>
            <input type="hidden" name="email" value={email} />
            <Button size="sm" variant="ghost" pending={addingAdmin} aria-label={`Make ${name} an admin`} onClick={() => setConfirming(true)}>
              {addingAdmin ? "Granting…" : "Make admin"}
            </Button>
            <ConfirmDialog
              open={confirming}
              onClose={() => setConfirming(false)}
              onConfirm={() => {
                setConfirming(false);
                adminForm.current?.requestSubmit();
              }}
              title={`Make ${name} an admin?`}
              description="They will be able to edit the site and manage members."
              confirmLabel="Make admin"
              tone="primary"
            />
          </form>
        )}
      </div>
      <Result state={result} />
    </div>
  );
}
