// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireViewer = vi.fn();
vi.mock("@/lib/auth/viewer", () => ({ requireViewer: () => requireViewer() }));

const portalSettings = vi.fn();
vi.mock("@/lib/data/portal", () => ({ portalSettings: () => portalSettings() }));

const { requestMembership } = await import("@/lib/members/requests");

const viewer = (isMember: boolean) => ({ userId: "user_1", firstName: "Ada", isMember, isAdmin: false });

beforeEach(() => {
  vi.clearAllMocks();
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

  it("still refuses until spec 06 phase 4 has somewhere to keep the request", async () => {
    requireViewer.mockResolvedValue(viewer(false));
    expect(await requestMembership({ note: "Trading, fall 2026" })).toEqual({ ok: false, reason: "requests-closed" });
  });
});
