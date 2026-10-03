import { describe, expect, it } from "vitest";
import { isAdminClaims } from "@/lib/auth/roles";

describe("isAdminClaims", () => {
  it("accepts a session whose public metadata carries the admin role", () => {
    expect(isAdminClaims({ metadata: { role: "admin" } })).toBe(true);
  });

  it("rejects missing claims, missing metadata and other roles", () => {
    expect(isAdminClaims(null)).toBe(false);
    expect(isAdminClaims(undefined)).toBe(false);
    expect(isAdminClaims({})).toBe(false);
    expect(isAdminClaims({ metadata: {} })).toBe(false);
    expect(isAdminClaims({ metadata: { role: "member" } })).toBe(false);
    expect(isAdminClaims({ metadata: "admin" })).toBe(false);
  });
});
