// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const currentUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => auth(), currentUser: () => currentUser() }));

const getMembership = vi.fn();
vi.mock("@/lib/members/resolve", () => ({ getMembership: (user: unknown) => getMembership(user) }));

// next/navigation's redirect throws to stop rendering; mirror that so nothing after it runs.
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

const { PORTAL_SIGN_IN_HREF, getViewer, requireViewer } = await import("@/lib/auth/viewer");

const signedIn = () => ({ userId: "user_1" });
const email = (emailAddress: string, status: string | null) => ({ emailAddress, verification: status ? { status } : null });

beforeEach(() => {
  vi.clearAllMocks();
  currentUser.mockResolvedValue({ firstName: "Ada", emailAddresses: [email("ada@unc.edu", "verified")] });
  getMembership.mockResolvedValue(null);
});

describe("getViewer", () => {
  it("is null for signed-out visitors, without redirecting (the file route answers them itself)", async () => {
    auth.mockResolvedValue({ userId: null });
    expect(await getViewer()).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireViewer", () => {
  it("sends signed-out visitors to sign-in, which returns them to the portal", async () => {
    auth.mockResolvedValue({ userId: null });
    await expect(requireViewer()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/account/sign-in?redirect_url=%2Fportal");
    expect(PORTAL_SIGN_IN_HREF).toBe("/account/sign-in?redirect_url=%2Fportal");
    expect(currentUser).not.toHaveBeenCalled();
  });

  it("asks the roster with the user id and only verified emails", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue({
      firstName: "Ada",
      emailAddresses: [email("ada@unc.edu", "verified"), email("old@gmail.com", "unverified"), email("x@y.z", null)],
    });
    await requireViewer();
    expect(getMembership).toHaveBeenCalledWith({ id: "user_1", verifiedEmails: ["ada@unc.edu"] });
  });

  it("treats a signed-in user who isn't on the roster as not yet a member", async () => {
    auth.mockResolvedValue(signedIn());
    expect(await requireViewer()).toEqual({ userId: "user_1", firstName: "Ada", isMember: false, isAdmin: false });
  });

  it("makes anyone the roster recognises a member", async () => {
    auth.mockResolvedValue(signedIn());
    getMembership.mockResolvedValue({ status: "alumni" });
    expect(await requireViewer()).toMatchObject({ isMember: true, isAdmin: false });
  });

  it("counts admins as members whether or not they're on the roster", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue({ firstName: "Ada", publicMetadata: { role: "admin" }, emailAddresses: [email("ada@unc.edu", "verified")] });
    expect(await requireViewer()).toMatchObject({ isMember: true, isAdmin: true });
  });

  it("never reads membership from Clerk metadata", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue({ firstName: "Ada", publicMetadata: { role: "member" }, emailAddresses: [email("ada@unc.edu", "verified")] });
    expect(await requireViewer()).toMatchObject({ isMember: false, isAdmin: false });
  });

  it("falls back to no name when the account has none", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue({ firstName: "  ", emailAddresses: [] });
    expect((await requireViewer()).firstName).toBeNull();
  });

  it("returns only what the portal needs, never the Clerk user", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue({ firstName: "Ada", privateMetadata: { secret: 1 }, emailAddresses: [email("ada@unc.edu", "verified")] });
    expect(Object.keys(await requireViewer()).sort()).toEqual(["firstName", "isAdmin", "isMember", "userId"]);
  });

  it("sends the visitor back to sign-in when the session has no user behind it", async () => {
    auth.mockResolvedValue(signedIn());
    currentUser.mockResolvedValue(null);
    await expect(requireViewer()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(PORTAL_SIGN_IN_HREF);
  });
});
