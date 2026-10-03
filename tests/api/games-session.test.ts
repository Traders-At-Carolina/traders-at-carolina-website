// @vitest-environment node
import { createSign, generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Clerk's real verifyToken runs here (networkless, via CLERK_JWT_KEY); only the session lookup and auth() are faked.
// Mocking verifyToken itself hid a wrong assumption about its contract (it returns the claims and throws on failure).
const auth = vi.fn();
const getSession = vi.fn();
vi.mock("@clerk/nextjs/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@clerk/nextjs/server")>()),
  auth: () => auth(),
  clerkClient: async () => ({ sessions: { getSession } }),
}));

const clerkKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.CLERK_JWT_KEY = clerkKeys.publicKey.export({ type: "spki", format: "pem" }).toString();

const { sessionUserId } = await import("@/lib/games/session");

const MINUTE = 60;
const DAY = 24 * 60 * MINUTE;
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** A session token as Clerk issues them: 60 seconds long, here issued `ageSeconds` ago. */
function token({ sub = "user_1", sid = "sess_1", ageSeconds = 0, keys = clerkKeys } = {}) {
  const iat = Math.floor(Date.now() / 1000) - ageSeconds;
  const unsigned = `${b64({ alg: "RS256", typ: "JWT", kid: "ins_test" })}.${b64({ sub, sid, iat, nbf: iat - 10, exp: iat + MINUTE, iss: "https://clerk.test", v: 2 })}`;
  return `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(keys.privateKey).toString("base64url")}`;
}

const request = (cookie?: string) => new Request("http://localhost/api/games/scores", { method: "POST", headers: cookie ? { cookie } : {} });

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: null });
  getSession.mockResolvedValue({ status: "active", userId: "user_1" });
});

describe("sessionUserId", () => {
  it("takes Clerk's answer when the token is fresh", async () => {
    auth.mockResolvedValue({ userId: "user_9" });
    expect(await sessionUserId(request(`__session=${token()}`))).toBe("user_9");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("stays anonymous without a session cookie", async () => {
    expect(await sessionUserId(request())).toBeNull();
    expect(await sessionUserId(request("tac=1; __client_uat=0"))).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("accepts an expired token Clerk signed when its session is still active", async () => {
    expect(await sessionUserId(request(`__client_uat=1; __session=${token({ ageSeconds: 10 * MINUTE })}`))).toBe("user_1");
    expect(getSession).toHaveBeenCalledWith("sess_1");
  });

  it("stops trusting a token once it's older than a session can be", async () => {
    expect(await sessionUserId(request(`__session=${token({ ageSeconds: 8 * DAY })}`))).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("stays anonymous when Clerk didn't sign the token", async () => {
    expect(await sessionUserId(request(`__session=${token({ keys: otherKeys })}`))).toBeNull();
    expect(await sessionUserId(request("__session=not-a-jwt"))).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("reads Clerk's suffixed cookie first, and skips one it can't verify", async () => {
    const mine = token({ sub: "user_1", sid: "sess_1", ageSeconds: 5 * MINUTE });
    const leftover = token({ sub: "user_2", sid: "sess_2", ageSeconds: 5 * MINUTE });
    expect(await sessionUserId(request(`__session=${leftover}; __session_abc123=${mine}`))).toBe("user_1");
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getSession).toHaveBeenCalledWith("sess_1");

    expect(await sessionUserId(request(`__session_abc123=${token({ keys: otherKeys })}; __session=${mine}`))).toBe("user_1");
  });

  it("stays anonymous when the session has ended or belongs to someone else", async () => {
    const cookie = `__session=${token({ ageSeconds: 5 * MINUTE })}`;
    getSession.mockResolvedValueOnce({ status: "ended", userId: "user_1" });
    expect(await sessionUserId(request(cookie))).toBeNull();
    getSession.mockResolvedValueOnce({ status: "revoked", userId: "user_1" });
    expect(await sessionUserId(request(cookie))).toBeNull();
    getSession.mockResolvedValueOnce({ status: "active", userId: "user_2" });
    expect(await sessionUserId(request(cookie))).toBeNull();
  });

  it("fails soft when Clerk can't be reached", async () => {
    getSession.mockRejectedValueOnce(new Error("Not Found"));
    expect(await sessionUserId(request(`__session=${token({ ageSeconds: 5 * MINUTE })}`))).toBeNull();
  });
});
