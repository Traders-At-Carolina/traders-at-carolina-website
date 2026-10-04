// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
const dbm = vi.hoisted(() => ({
  getResource: vi.fn(),
  insertResource: vi.fn(async (s: Record<string, unknown>) => s),
  updateResource: vi.fn(async (id: string, s: Record<string, unknown>) => ({ before: { id }, after: { id, ...s } })),
  deleteResource: vi.fn(async (id: string) => ({ id })),
  getAnnouncement: vi.fn(),
  insertAnnouncement: vi.fn(async (s: Record<string, unknown>) => s),
  updateAnnouncement: vi.fn(async (id: string, s: Record<string, unknown>) => ({ before: { id }, after: { id, ...s } })),
  deleteAnnouncement: vi.fn(),
  getPortalLink: vi.fn(),
  insertPortalLink: vi.fn(async (s: Record<string, unknown>) => s),
  updatePortalLink: vi.fn(),
  deletePortalLink: vi.fn(async (id: string) => ({ id })),
  sectionOrder: vi.fn(),
  setResourceOrders: vi.fn(),
  linkOrder: vi.fn(),
  setLinkOrders: vi.fn(),
}));
vi.mock("@/lib/admin/portal-db", async (orig) => ({ ...(await orig<object>()), ...dbm }));
const setSetting = vi.hoisted(() => vi.fn(async (_k: string, v: unknown) => ({ before: {}, after: v })));
vi.mock("@/lib/admin/settings-db", async (orig) => ({ ...(await orig<object>()), setSetting }));
const readPortalSetting = vi.hoisted(() => vi.fn());
vi.mock("@/lib/members/settings", async (orig) => ({ ...(await orig<object>()), readPortalSetting }));

const { PORTAL_AREAS, PORTAL_UNDO_HANDLERS, parseOrderGroup } = await import("@/lib/admin/portal-undo");
const { UNDO_HANDLERS } = await import("@/lib/admin/undo");

const at = new Date("2026-10-01T12:00:00Z");
const resourceRow = { id: "r1", title: "Deck", kind: "slides", section: "learning", tracks: ["trading"], description: null, file: { pathname: "resources/a.pdf", size: 3, contentType: "application/pdf" }, url: null, audience: "members", pinned: false, sortOrder: 1, hidden: false, createdAt: at, updatedAt: at };
const { createdAt: _c, updatedAt: _u, ...resourceState } = resourceRow;
void _c;
void _u;
const entry = (entity: string, before: unknown, after: unknown, entityId = "r1") => ({ id: 5, entity, entityId, before, after }) as never;

beforeEach(() => vi.clearAllMocks());

describe("portal undo handlers (spec 06 §3)", () => {
  it("are all registered, with History area names", () => {
    for (const key of ["resource", "announcement", "portal-link", "resource-order", "portal-link-order", "portal-settings"]) {
      expect(UNDO_HANDLERS[key]).toBe(PORTAL_UNDO_HANDLERS[key]);
      expect(PORTAL_AREAS[key]).toBeTruthy();
    }
  });

  it("restores a resource that still matches, even with jsonb's reordered keys", async () => {
    dbm.getResource.mockResolvedValue(resourceRow);
    // jsonb returns keys in its own order; the audit copy must still count as unchanged.
    const stored = JSON.parse(JSON.stringify({ ...resourceState, file: { contentType: "application/pdf", size: 3, pathname: "resources/a.pdf" } }));
    await PORTAL_UNDO_HANDLERS.resource.restore("r1", { ...resourceState, title: "Old" }, entry("resource", { ...resourceState, title: "Old" }, stored));
    expect(dbm.updateResource).toHaveBeenCalledWith("r1", expect.objectContaining({ title: "Old" }));
    expect(dbm.updateResource.mock.calls[0][1]).not.toHaveProperty("id");
  });

  it("refuses when the resource was edited since", async () => {
    dbm.getResource.mockResolvedValue({ ...resourceRow, title: "Newer" });
    await expect(PORTAL_UNDO_HANDLERS.resource.restore("r1", resourceState, entry("resource", resourceState, resourceState))).rejects.toThrow(/changed since/);
    expect(dbm.updateResource).not.toHaveBeenCalled();
  });

  it("undoes a create by deleting, and a delete by recreating with the same id", async () => {
    dbm.getResource.mockResolvedValue(resourceRow);
    await PORTAL_UNDO_HANDLERS.resource.remove!("r1", entry("resource", null, resourceState));
    expect(dbm.deleteResource).toHaveBeenCalledWith("r1");
    await PORTAL_UNDO_HANDLERS.resource.recreate!(resourceState, entry("resource", resourceState, null));
    expect(dbm.insertResource).toHaveBeenCalledWith(expect.objectContaining({ id: "r1", sortOrder: 1 }));
  });

  it("recreates an announcement with its dates as Dates", async () => {
    const state = { id: "a1", title: "Kickoff", body: "Hi", audience: "signed_in", pinned: false, showFrom: "2026-10-05T13:00:00.000Z", showUntil: null };
    await PORTAL_UNDO_HANDLERS.announcement.recreate!(state, entry("announcement", state, null, "a1"));
    expect(dbm.insertAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ id: "a1", showFrom: new Date("2026-10-05T13:00:00Z"), showUntil: null }));
  });

  it("restores an announcement whose current row matches the audited ISO dates", async () => {
    dbm.getAnnouncement.mockResolvedValue({ id: "a1", title: "New", body: "Hi", audience: "members", pinned: true, showFrom: new Date("2026-10-05T13:00:00Z"), showUntil: null, createdAt: at, updatedAt: at });
    const after = { id: "a1", title: "New", body: "Hi", audience: "members", pinned: true, showFrom: "2026-10-05T13:00:00.000Z", showUntil: null };
    await PORTAL_UNDO_HANDLERS.announcement.restore("a1", { ...after, title: "Old" }, entry("announcement", { ...after, title: "Old" }, after, "a1"));
    expect(dbm.updateAnnouncement).toHaveBeenCalledWith("a1", expect.objectContaining({ title: "Old", showFrom: new Date("2026-10-05T13:00:00Z") }));
  });

  it("undoes a new member link by removing it", async () => {
    const link = { id: "l1", label: "Slack", url: "https://slack.com", description: null, audience: "members", sortOrder: 1 };
    dbm.getPortalLink.mockResolvedValue(link);
    await PORTAL_UNDO_HANDLERS["portal-link"].remove!("l1", entry("portal-link", null, link, "l1"));
    expect(dbm.deletePortalLink).toHaveBeenCalledWith("l1");
  });

  it("restores resource and link order only while nothing has moved since", async () => {
    const before = { rows: [{ id: "r1", sortOrder: 1 }, { id: "r2", sortOrder: 2 }] };
    const after = { rows: [{ id: "r2", sortOrder: 1 }, { id: "r1", sortOrder: 2 }] };
    dbm.sectionOrder.mockResolvedValue(after.rows);
    await PORTAL_UNDO_HANDLERS["resource-order"].restore("learning:pinned", before, entry("resource-order", before, after, "learning:pinned"));
    expect(dbm.sectionOrder).toHaveBeenCalledWith("learning", true);
    expect(dbm.setResourceOrders).toHaveBeenCalledWith(before.rows);

    dbm.linkOrder.mockResolvedValue(before.rows);
    await expect(PORTAL_UNDO_HANDLERS["portal-link-order"].restore("links", before, entry("portal-link-order", before, after, "links"))).rejects.toThrow(/changed since/);
    expect(dbm.setLinkOrders).not.toHaveBeenCalled();
    expect(() => parseOrderGroup("nowhere:pinned")).toThrow();
  });

  it("restores portal settings while they still match the change", async () => {
    readPortalSetting.mockResolvedValue({ alumniAccess: false, acceptRequests: true });
    const before = { alumniAccess: true, acceptRequests: true };
    await PORTAL_UNDO_HANDLERS["portal-settings"].restore("portal", before, entry("portal-settings", before, { acceptRequests: true, alumniAccess: false }, "portal"));
    expect(setSetting).toHaveBeenCalledWith("portal", before);
  });
});
