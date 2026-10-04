import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ userId: null as string | null, user: null as unknown }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }), currentUser: async () => session.user }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));

import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";
import { canRemoveAdmin, isAdminUser, parseInviteEmail } from "@/lib/admin/admins";
import { uploadTokenOptions } from "@/lib/admin/upload-policy";

describe("requireAdmin", () => {
  beforeEach(() => {
    session.userId = null;
    session.user = null;
  });

  it("rejects signed-out callers and signed-in non-admins", async () => {
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    session.userId = "user_1";
    session.user = { publicMetadata: {}, emailAddresses: [] };
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
  });

  it("returns the admin's user id", async () => {
    session.userId = "user_1";
    session.user = { publicMetadata: { role: "admin" }, emailAddresses: [] };
    await expect(requireAdmin()).resolves.toEqual({ userId: "user_1" });
  });
});

describe("admin helpers", () => {
  it("recognises admins by public metadata", () => {
    expect(isAdminUser({ role: "admin" })).toBe(true);
    expect(isAdminUser({ role: "member" })).toBe(false);
    expect(isAdminUser({})).toBe(false);
  });

  it("normalises an invite email and rejects anything that isn't one", () => {
    expect(parseInviteEmail("  Jane.Doe@UNC.edu ")).toEqual({ ok: true, email: "jane.doe@unc.edu" });
    expect(parseInviteEmail("not-an-email")).toEqual({ ok: false, error: "Enter a valid email address." });
    expect(parseInviteEmail(null)).toEqual({ ok: false, error: "Enter a valid email address." });
  });

  it("never lets an admin remove themselves or the last admin", () => {
    expect(canRemoveAdmin({ targetId: "a", selfId: "a", adminCount: 3 })).toBe("You can't remove yourself.");
    expect(canRemoveAdmin({ targetId: "b", selfId: "a", adminCount: 1 })).toBe("The site needs at least one admin.");
    expect(canRemoveAdmin({ targetId: "b", selfId: "a", adminCount: 2 })).toBeNull();
  });
});

describe("uploadTokenOptions", () => {
  it("allows only images, up to 10 MB, under uploads/ with a random suffix", () => {
    expect(uploadTokenOptions("uploads/headshot.jpg")).toEqual({
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
    });
  });

  it("refuses paths outside uploads/", () => {
    expect(() => uploadTokenOptions("content/images/team/x.jpg")).toThrow(/uploads\//);
    expect(() => uploadTokenOptions("uploads/../content/x.jpg")).toThrow(/uploads\//);
  });
});
