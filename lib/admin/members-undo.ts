import { FormError } from "@/lib/admin/action";
import {
  deleteMembersById,
  getMember,
  getMembersByIds,
  getRequest,
  memberSnapshot,
  type MemberSnapshot,
  restoreMembers,
  setRequestStatus,
} from "@/lib/admin/members-db";
import type { Handler } from "@/lib/admin/undo";
import { batchUnchanged } from "@/lib/members/roster";

/**
 * Undo for the roster (spec 06 §3). Members change both one at a time and in bulk, so every handler first checks that
 * the rows still look exactly as the change left them; otherwise it refuses rather than overwrite a later edit.
 */
const CHANGED = "Someone has changed these members since. Undo the newer change first.";

async function assertUnchanged(recorded: MemberSnapshot[]): Promise<void> {
  const now = (await getMembersByIds(recorded.map((r) => r.id))).map(memberSnapshot);
  if (!batchUnchanged(recorded, now)) throw new FormError(CHANGED);
}

const rowsOf = (state: unknown): MemberSnapshot[] => ((state as { rows?: MemberSnapshot[] } | null)?.rows ?? []);

/** One roster row (edit page, Make member, Approve's linked row). */
const member: Handler = {
  label: "Member",
  tags: [],
  viewHref: () => "/admin/members",
  remove: async (id, entry) => {
    const recorded = entry.after as MemberSnapshot;
    await assertUnchanged([recorded]);
    await deleteMembersById([id]);
    return { before: recorded };
  },
  recreate: async (state) => {
    const row = state as MemberSnapshot;
    await restoreMembers([row]);
    return { after: row };
  },
  restore: async (id, state, entry) => {
    await assertUnchanged([entry.after as MemberSnapshot]);
    const current = await getMember(id);
    await restoreMembers([state as MemberSnapshot]);
    return { before: current ? memberSnapshot(current) : null, after: state };
  },
};

/** A bulk add, bulk update or bulk removal, recorded as one entry with every row. */
const memberBatch: Handler = {
  label: "Members",
  tags: [],
  viewHref: () => "/admin/members",
  remove: async (_id, entry) => {
    const added = rowsOf(entry.after);
    await assertUnchanged(added);
    await deleteMembersById(added.map((r) => r.id));
    return { before: { rows: added } };
  },
  recreate: async (state) => {
    await restoreMembers(rowsOf(state));
    return { after: state };
  },
  restore: async (_id, state, entry) => {
    await assertUnchanged(rowsOf(entry.after));
    await restoreMembers(rowsOf(state));
    return { before: entry.after, after: state };
  },
};

type RequestState = { status: "pending" | "approved" | "declined"; member?: MemberSnapshot | null };

/** Approve or decline: undo puts the request back in the queue, and removes the member an approval added. */
const request: Handler = {
  label: "Request",
  tags: [],
  viewHref: () => "/admin/members?tab=requests",
  restore: async (id, state, entry) => {
    const req = await getRequest(id);
    if (!req) throw new FormError("That request no longer exists.");
    const after = entry.after as RequestState;
    if (req.status !== after.status) throw new FormError("This request has changed since.");
    if (after.member) {
      await assertUnchanged([after.member]);
      await deleteMembersById([after.member.id]);
    }
    const before = state as RequestState;
    await setRequestStatus(id, before.status, null);
    return { before: after, after: before };
  },
};

export const MEMBER_UNDO_HANDLERS: Record<string, Handler> = { member, "member-batch": memberBatch, "membership-request": request };

/** Entities these handlers cover, for History labels. */
export const MEMBER_AREAS: Record<string, string> = { member: "Members", "member-batch": "Members", "membership-request": "Requests" };

