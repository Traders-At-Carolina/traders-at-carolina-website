// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/viewer", () => ({ getViewer: () => getViewer() }));
const portalFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/data/portal", () => ({ portalFile: (id: string, viewer: string) => portalFile(id, viewer) }));
const get = vi.hoisted(() => vi.fn());
vi.mock("@vercel/blob", () => ({ get: (pathname: string, options: unknown) => get(pathname, options) }));

const { GET } = await import("@/app/(site)/portal/files/[id]/route");

const ID = "11111111-1111-4111-8111-111111111111";
const call = (id = ID) => GET(new Request(`https://tac.test/portal/files/${id}`), { params: Promise.resolve({ id }) });
const member = { userId: "user_1", firstName: "Ada", isMember: true, isAdmin: false };
const file = { pathname: "resources/deck-abc123.pdf", size: 5, contentType: "application/pdf" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "vercel_blob_rw_private");
  getViewer.mockResolvedValue(member);
  portalFile.mockResolvedValue({ title: "Week 3: Options", file });
  get.mockResolvedValue({ statusCode: 200, stream: new Blob(["%PDF-"]).stream(), headers: new Headers(), blob: { size: 5, contentType: "application/pdf" } });
});
afterEach(() => vi.unstubAllEnvs());

describe("/portal/files/[id] (spec 06 §8 Files)", () => {
  it("streams an allowed file from the private store, inline and uncached", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("%PDF-");
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(`inline; filename="Week 3 Options.pdf"; filename*=UTF-8''Week%203%20Options.pdf`);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(portalFile).toHaveBeenCalledWith(ID, "member");
    expect(get).toHaveBeenCalledWith(file.pathname, expect.objectContaining({ access: "private", token: "vercel_blob_rw_private" }));
  });

  it("checks non-members as signed-in viewers", async () => {
    getViewer.mockResolvedValue({ ...member, isMember: false });
    await call();
    expect(portalFile).toHaveBeenCalledWith(ID, "signed_in");
  });

  it("answers missing, hidden, link-only and not-allowed resources with the same 404", async () => {
    portalFile.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not found");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(get).not.toHaveBeenCalled();
  });

  it("404s a malformed id, a missing blob, or no private store, without revealing anything", async () => {
    expect((await call("not-a-uuid")).status).toBe(404);
    expect(getViewer).not.toHaveBeenCalled();

    get.mockResolvedValue(null);
    expect((await call()).status).toBe(404);

    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "");
    expect((await call()).status).toBe(404);
  });

  it("sends signed-out visitors to sign-in and back, the same for every id", async () => {
    getViewer.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`https://tac.test/account/sign-in?redirect_url=${encodeURIComponent(`/portal/files/${ID}`)}`);
    expect(portalFile).not.toHaveBeenCalled();
  });
});
