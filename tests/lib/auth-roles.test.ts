import { describe, expect, it } from "vitest";
import { adminEmails, isAdminAccount } from "@/lib/auth/roles";

const email = (emailAddress: string, status = "verified") => ({ emailAddress, verification: { status } });

describe("adminEmails", () => {
  it("splits, trims and lowercases the env value", () => {
    expect(adminEmails(" A@unc.edu, b@UNC.edu ,,")).toEqual(["a@unc.edu", "b@unc.edu"]);
    expect(adminEmails(undefined)).toEqual([]);
  });
});

describe("isAdminAccount", () => {
  it("accepts the admin role in public metadata", () => {
    expect(isAdminAccount({ publicMetadata: { role: "admin" }, emailAddresses: [] }, [])).toBe(true);
  });

  it("accepts a verified email on the allowlist, ignoring case", () => {
    expect(isAdminAccount({ publicMetadata: {}, emailAddresses: [email("Me@UNC.edu")] }, ["me@unc.edu"])).toBe(true);
  });

  it("rejects unverified allowlisted emails, other roles and strangers", () => {
    expect(isAdminAccount({ publicMetadata: {}, emailAddresses: [email("me@unc.edu", "unverified")] }, ["me@unc.edu"])).toBe(false);
    expect(isAdminAccount({ publicMetadata: { role: "member" }, emailAddresses: [email("x@unc.edu")] }, ["me@unc.edu"])).toBe(false);
    expect(isAdminAccount({ publicMetadata: null, emailAddresses: [] }, [])).toBe(false);
  });
});
