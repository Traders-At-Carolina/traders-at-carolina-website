// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../helpers/fake-db";

const requireViewer = vi.fn();
vi.mock("@/lib/auth/viewer", () => ({ requireViewer: () => requireViewer() }));

const portalSettings = vi.fn();
vi.mock("@/lib/data/portal", () => ({ portalSettings: () => portalSettings() }));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: async () => ({ firstName: "Ada", lastName: "Lovelace", primaryEmailAddress: { emailAddress: "ada@unc.edu" }, emailAddresses: [] }),
}));

const fake = fakeDb();
vi.mock("@/lib/db/client", () => ({ db: () => fake.db() }));

const { requestMembership } = await import("@/lib/members/requests");

const viewer = (isMember: boolean) => ({ userId: "user_1", firstName: "Ada", isMember, isAdmin: false });

beforeEach(() => {
  vi.clearAllMocks();
  fake.calls.length = 0;
  portalSettings.mockResolvedValue({ acceptRequests: true });
});

describe("requestMembership", () => {
  it("checks the session itself, like every server action", async () => {
    requireViewer.mockRejectedValue(new Error("NEXT_REDIRECT /account/sign-in?redirect_url=%2Fportal"));
    await expect(requestMembership({ note: "hi" })).rejects.toThrow("NEXT_REDIRECT");
  });

  it("refuses members", async () => {
    requireViewer.mockResolvedValue(viewer(true));
    expect(await requestMembership({})).toEqual({ ok: false, reason: "already-member" });
  });

  it("refuses while requests are off", async () => {
    requireViewer.mockResolvedValue(viewer(false));
    portalSettings.mockResolvedValue({ acceptRequests: false });
    expect(await requestMembership({ note: "Trading, fall 2026" })).toEqual({ ok: false, reason: "requests-closed" });
  });

  it("records a pending request with the viewer's name, email and trimmed note", async () => {
    requireViewer.mockResolvedValue(viewer(false));
    fake.queue([]);
    expect(await requestMembership({ note: "  Trading, fall 2026  " })).toEqual({ ok: true });
    const values = fake.calls[0].find((s) => s.method === "values")?.args[0];
    expect(values).toEqual({ userId: "user_1", email: "ada@unc.edu", name: "Ada Lovelace", note: "Trading, fall 2026", status: "pending" });
  });

  it("reports an existing pending request instead of creating a second", async () => {
    requireViewer.mockResolvedValue(viewer(false));
    fake.queue(new Error('duplicate key value violates unique constraint "membership_requests_one_pending_idx"'));
    expect(await requestMembership({})).toEqual({ ok: false, reason: "already-pending" });
  });
});
