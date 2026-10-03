// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ admin: true }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
const invitations = vi.hoisted(() => ({ createInvitation: vi.fn(async () => ({ id: "inv_1" })) }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => (session.admin ? { userId: "admin_1", sessionClaims: { metadata: { role: "admin" } } } : { userId: null, sessionClaims: null }),
  currentUser: async () => ({ primaryEmailAddress: { emailAddress: "officer@unc.edu" } }),
  clerkClient: async () => ({ invitations }),
}));

const dbm = vi.hoisted(() => ({
  rosterEmails: vi.fn(async () => new Set<string>(["old@unc.edu"])),
  insertMembers: vi.fn(async (rows: Array<Record<string, unknown>>) => rows.map((r, i) => ({ id: `m${i}`, userId: null, notes: null, ...r }))),
  bulkUpdate: vi.fn(async (ids: string[], patch: Record<string, unknown>) => ({
    before: ids.map((id) => ({ id, status: "active" })),
    after: ids.map((id) => ({ id, ...patch })),
  })),
  removeMembers: vi.fn(),
  updateMember: vi.fn(),
  getRequest: vi.fn(),
  setRequestStatus: vi.fn(),
}));
vi.mock("@/lib/admin/members-db", () => dbm);
const recordAudit = vi.hoisted(() => vi.fn(async () => 77));
vi.mock("@/lib/admin/audit", () => ({ recordAudit }));
const emailsWithAccounts = vi.hoisted(() => vi.fn(async () => new Set<string>(["has-account@unc.edu"])));
vi.mock("@/lib/admin/clerk-admins", () => ({ emailsWithAccounts }));

const actions = await import("@/app/admin/(console)/members/actions");

const form = (entries: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  session.admin = true;
});

describe("adding members", () => {
  it("previews new, existing and invalid rows without saving", async () => {
    const state = await actions.previewMembers({}, form({ list: "new@unc.edu\nold@unc.edu\nnope" }));
    expect(state.preview?.add.map((r) => r.email)).toEqual(["new@unc.edu"]);
    expect(state.preview?.existing.map((r) => r.email)).toEqual(["old@unc.edu"]);
    expect(state.preview?.invalid.map((r) => r.line)).toEqual([3]);
    expect(dbm.insertMembers).not.toHaveBeenCalled();
  });

  it("adds only new rows with the batch defaults, as one undoable change", async () => {
    const state = await actions.addMembers({}, form({ list: "Ada, ada@unc.edu\nold@unc.edu", status: "active", track: "research", classYear: "2029", cohort: "Fall 2026" }));
    expect(dbm.insertMembers).toHaveBeenCalledWith([{ email: "ada@unc.edu", name: "Ada", status: "active", track: "research", classYear: 2029, cohort: "Fall 2026" }]);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "add-members", entity: "member-batch", before: null }));
    expect(state).toMatchObject({ undoId: 77, redirectTo: "/admin/members?saved=77" });
  });

  it("emails sign-up links only to people without an account", async () => {
    dbm.rosterEmails.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());
    const state = await actions.addMembers({}, form({ list: "a@unc.edu\nhas-account@unc.edu", invite: "on" }));
    expect(invitations.createInvitation).toHaveBeenCalledTimes(1);
    expect(invitations.createInvitation).toHaveBeenCalledWith(expect.objectContaining({ emailAddress: "a@unc.edu", redirectUrl: "http://localhost:3000/account/sign-up" }));
    expect(state.ok).toMatch(/Sign-up links sent to 1\. 1 already had an account/);
  });

  it("refuses non-admins", async () => {
    session.admin = false;
    expect(await actions.addMembers({}, form({ list: "a@unc.edu" }))).toMatchObject({ error: "Only admins can do that." });
    expect(dbm.insertMembers).not.toHaveBeenCalled();
  });
});

describe("bulk actions", () => {
  it("marks the selected members alumni in one change", async () => {
    const ids = ["0f8fad5b-d9cb-469f-a165-70867728950e", "7c9e6679-7425-40de-944b-e07fc1f90ae7"];
    await actions.bulkMembers({}, form({ markAlumni: "1", op: "track", ids }));
    expect(dbm.bulkUpdate).toHaveBeenCalledWith(ids, { status: "alumni" });
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "update-members", entity: "member-batch" }));
  });

  it("needs a selection", async () => {
    expect(await actions.bulkMembers({}, form({ op: "status", value: "alumni" }))).toMatchObject({ error: "Check the highlighted fields." });
  });
});

describe("requests", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";

  it("approving adds the person to the roster, linked to their account", async () => {
    dbm.getRequest.mockResolvedValue({ id, status: "pending", email: "Ada@unc.edu", name: "Ada", userId: "user_9" });
    dbm.rosterEmails.mockResolvedValue(new Set());
    const state = await actions.approveRequest({}, form({ id, track: "trading" }));
    expect(dbm.insertMembers).toHaveBeenCalledWith([expect.objectContaining({ email: "ada@unc.edu", userId: "user_9", track: "trading", status: "active" })]);
    expect(dbm.setRequestStatus).toHaveBeenCalledWith(id, "approved", "admin_1");
    expect(state.ok).toBe("Ada is now a member.");
  });

  it("won't handle a request twice", async () => {
    dbm.getRequest.mockResolvedValue({ id, status: "declined" });
    expect(await actions.declineRequest({}, form({ id }))).toMatchObject({ error: "That request has already been handled." });
  });
});
