// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ admin: true }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "admin_1" }),
  currentUser: async () =>
    session.admin
      ? { publicMetadata: { role: "admin" }, emailAddresses: [], primaryEmailAddress: { emailAddress: "officer@unc.edu" } }
      : { publicMetadata: {}, emailAddresses: [], primaryEmailAddress: { emailAddress: "member@unc.edu" } },
}));
const recordAudit = vi.hoisted(() => vi.fn(async () => 7));
vi.mock("@/lib/admin/audit", () => ({ recordAudit }));
const dbm = vi.hoisted(() => ({
  insertResource: vi.fn(async (v: Record<string, unknown>) => ({ id: "r1", sortOrder: 1, ...v })),
  updateResource: vi.fn(async (id: string, v: Record<string, unknown>) => ({ before: { id, title: "Old" }, after: { id, sortOrder: 1, ...v } })),
  deleteResource: vi.fn(async (id: string) => ({ id, title: "Deck" })),
  getResource: vi.fn(),
  sectionOrder: vi.fn(),
  setResourceOrders: vi.fn(),
  insertAnnouncement: vi.fn(async (v: Record<string, unknown>) => ({ id: "a1", ...v })),
  updateAnnouncement: vi.fn(async (id: string, v: Record<string, unknown>) => ({ before: { id, title: "Old" }, after: { id, ...v } })),
  deleteAnnouncement: vi.fn(async (id: string) => ({ id, title: "Kickoff" })),
  insertPortalLink: vi.fn(async (v: Record<string, unknown>) => ({ id: "l1", sortOrder: 1, ...v })),
  updatePortalLink: vi.fn(async (id: string, v: Record<string, unknown>) => ({ before: { id, label: "Old" }, after: { id, ...v } })),
  deletePortalLink: vi.fn(async (id: string) => ({ id, label: "Slack" })),
  linkOrder: vi.fn(),
  setLinkOrders: vi.fn(),
}));
vi.mock("@/lib/admin/portal-db", async (orig) => ({ ...(await orig<object>()), ...dbm }));
const settingsDb = vi.hoisted(() => ({ setSetting: vi.fn(async (_k: string, v: unknown) => ({ before: null, after: v })) }));
vi.mock("@/lib/admin/settings-db", () => settingsDb);
const readPortalSetting = vi.hoisted(() => vi.fn(async () => ({ alumniAccess: true, acceptRequests: true })));
vi.mock("@/lib/members/settings", async (orig) => ({ ...(await orig<object>()), readPortalSetting }));

const resources = await import("@/app/admin/(console)/resources/actions");
const announcements = await import("@/app/admin/(console)/announcements/actions");
const portal = await import("@/app/admin/(console)/portal/actions");

const form = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
  return f;
};
const resourceForm = { title: "Options deck", kind: "slides", section: "learning", tracks: ["trading"], source: "link", url: "https://drive.google.com/x", audience: "members" };
const pdf = JSON.stringify({ pathname: "resources/deck.pdf", size: 10, contentType: "application/pdf" });

beforeEach(() => {
  vi.clearAllMocks();
  session.admin = true;
});
afterEach(() => vi.unstubAllEnvs());

describe("every portal action refuses non-admins", () => {
  it("writes nothing for a signed-in non-admin", async () => {
    session.admin = false;
    const results = await Promise.all([
      resources.createResource({}, form(resourceForm)),
      resources.deleteResourceAction("r1"),
      announcements.createAnnouncement({}, form({ title: "x", body: "y", audience: "members" })),
      portal.savePortalSettings({}, form({})),
      portal.createPortalLink({}, form({ label: "x", url: "https://x.com", audience: "members" })),
      portal.movePortalLink({}, form({ id: "l1", dir: "up" })),
    ]);
    for (const r of results) expect(r.error).toBe("Only admins can do that.");
    for (const fn of Object.values(dbm)) expect(fn).not.toHaveBeenCalled();
    expect(settingsDb.setSetting).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe("resources", () => {
  it("creates a link resource, audited for undo, and points the toast at the portal", async () => {
    const state = await resources.createResource({}, form(resourceForm));
    expect(dbm.insertResource).toHaveBeenCalledWith(expect.objectContaining({ title: "Options deck", tracks: ["trading"], url: "https://drive.google.com/x", file: null, pinned: false, hidden: false }));
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "resource", entityId: "r1", before: null, after: expect.objectContaining({ id: "r1" }) }));
    expect(state).toMatchObject({ undoId: 7, viewHref: "/portal", redirectTo: "/admin/resources?saved=7" });
  });

  it("rejects file resources without the private store, and accepts them with it", async () => {
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "");
    const refused = await resources.createResource({}, form({ ...resourceForm, source: "file", file: pdf }));
    expect(refused.fieldErrors?.source).toMatch(/private file store/);
    expect(dbm.insertResource).not.toHaveBeenCalled();

    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "vercel_blob_rw_test");
    await resources.createResource({}, form({ ...resourceForm, source: "file", file: pdf }));
    expect(dbm.insertResource).toHaveBeenCalledWith(expect.objectContaining({ url: null, file: { pathname: "resources/deck.pdf", size: 10, contentType: "application/pdf" } }));
  });

  it("audits updates and deletes with before and after", async () => {
    await resources.updateResourceAction("r1", {}, form({ ...resourceForm, hidden: "on" }));
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "update", entity: "resource", before: { id: "r1", title: "Old" }, after: expect.objectContaining({ hidden: true }) }));
    const state = await resources.deleteResourceAction("r1");
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "delete", entity: "resource", before: { id: "r1", title: "Deck" }, after: null }));
    expect(state.redirectTo).toBe("/admin/resources?saved=7");
  });

  it("reorders within the section's pinned or unpinned group, as one undoable change", async () => {
    dbm.getResource.mockResolvedValue({ id: "r2", section: "learning", pinned: false });
    dbm.sectionOrder.mockResolvedValue([
      { id: "r1", sortOrder: 1 },
      { id: "r2", sortOrder: 2 },
    ]);
    await resources.moveResource({}, form({ id: "r2", dir: "up" }));
    expect(dbm.sectionOrder).toHaveBeenCalledWith("learning", false);
    const after = [
      { id: "r2", sortOrder: 1 },
      { id: "r1", sortOrder: 2 },
    ];
    expect(dbm.setResourceOrders).toHaveBeenCalledWith(after);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "reorder", entity: "resource-order", entityId: "learning:rest", after: { rows: after } }));
    // The mocked order still has r2 last, so it can't go further down.
    expect((await resources.moveResource({}, form({ id: "r2", dir: "down" }))).error).toMatch(/can't move/);
  });
});

describe("announcements", () => {
  const a = { title: "Kickoff", body: "Bring a *friend*.", audience: "signed_in", pinned: "on", showFrom: "2026-10-05T09:00", showUntil: "2026-10-12T17:00" };

  it("creates with Eastern dates converted to instants", async () => {
    const state = await announcements.createAnnouncement({}, form(a));
    expect(dbm.insertAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ title: "Kickoff", pinned: true, showFrom: new Date("2026-10-05T13:00:00Z"), showUntil: new Date("2026-10-12T21:00:00Z") }));
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "announcement", entityId: "a1" }));
    expect(state).toMatchObject({ viewHref: "/portal", redirectTo: "/admin/announcements?saved=7" });
  });

  it("refuses dates out of order without writing", async () => {
    const state = await announcements.createAnnouncement({}, form({ ...a, showUntil: "2026-10-01T09:00" }));
    expect(state.fieldErrors?.showUntil).toBeTruthy();
    expect(dbm.insertAnnouncement).not.toHaveBeenCalled();
  });

  it("audits updates and deletes", async () => {
    await announcements.updateAnnouncementAction("a1", {}, form(a));
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "update", entity: "announcement", entityId: "a1" }));
    await announcements.deleteAnnouncementAction("a1");
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "delete", entity: "announcement", after: null }));
  });
});

describe("portal settings and links", () => {
  it("saves the portal setting, recording the effective value before so the first save can be undone", async () => {
    await portal.savePortalSettings({}, form({ welcomeMember: " Welcome back. ", welcomeVisitor: "", acceptRequests: "on" }));
    const next = { alumniAccess: false, acceptRequests: true, welcomeMember: "Welcome back." };
    expect(settingsDb.setSetting).toHaveBeenCalledWith("portal", next);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ entity: "portal-settings", entityId: "portal", before: { alumniAccess: true, acceptRequests: true }, after: next }));
  });

  it("creates, edits and removes links, each audited", async () => {
    await portal.createPortalLink({}, form({ label: "Tracker", url: "https://docs.google.com/x", audience: "members" }));
    expect(dbm.insertPortalLink).toHaveBeenCalledWith({ label: "Tracker", url: "https://docs.google.com/x", description: null, audience: "members" });
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "create", entity: "portal-link", entityId: "l1" }));
    expect((await portal.createPortalLink({}, form({ label: "Tracker", url: "http://x.com", audience: "members" }))).fieldErrors?.url).toBeTruthy();
    await portal.updatePortalLinkAction("l1", {}, form({ label: "Slack", url: "https://slack.com", audience: "signed_in" }));
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "update", entity: "portal-link" }));
    await portal.deletePortalLinkAction("l1");
    expect(recordAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "delete", entity: "portal-link", after: null }));
  });

  it("reorders links as one undoable change", async () => {
    dbm.linkOrder.mockResolvedValue([
      { id: "l1", sortOrder: 1 },
      { id: "l2", sortOrder: 2 },
    ]);
    await portal.movePortalLink({}, form({ id: "l1", dir: "down" }));
    expect(dbm.setLinkOrders).toHaveBeenCalledWith([
      { id: "l2", sortOrder: 1 },
      { id: "l1", sortOrder: 2 },
    ]);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "reorder", entity: "portal-link-order", entityId: "links" }));
  });
});
