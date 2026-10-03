import type { ReactNode } from "react";
import { TextLink } from "@/components/TextLink";
import type { Viewer } from "@/lib/auth/viewer";

type AccountBarProps = {
  viewer: Viewer;
  /** Clerk's UserButton, injected by the route (manage account, sign out). */
  account?: ReactNode;
};

/** Under the portal H1: who's signed in, their status, and the way into /admin for admins (spec 09 §4.1). */
export function AccountBar({ viewer, account }: AccountBarProps) {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-3">
      {account ? <div className="flex size-11 items-center justify-center">{account}</div> : null}
      <p className="text-caption text-ink-3">
        Signed in <span aria-hidden="true">·</span> <span className="font-medium text-black">{viewer.isMember ? "Member" : "Not yet a member"}</span>
      </p>
      {viewer.isAdmin ? (
        <p className="text-caption">
          <TextLink href="/admin" arrow>
            Admin
          </TextLink>
        </p>
      ) : null}
    </div>
  );
}
