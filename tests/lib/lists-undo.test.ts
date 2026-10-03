// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const dbm = vi.hoisted(() => ({
  getSponsor: vi.fn(),
  sponsorSnapshot: (r: Record<string, unknown>) => r,
  updateSponsor: vi.fn(async (_id: string, s: Record<string, unknown>) => ({ before: {}, after: s })),
  deleteSponsor: vi.fn(),
  insertSponsor: vi.fn(),
}));
vi.mock("@/lib/admin/lists-db", async (orig) => ({ ...(await orig<object>()), ...dbm }));

const { LIST_UNDO_HANDLERS } = await import("@/lib/admin/lists-undo");
const entry = (after: unknown) => ({ id: 3, entity: "sponsor", entityId: "s1", before: { id: "s1", name: "Old" }, after }) as never;

describe("list undo", () => {
  it("restores a sponsor that still looks as the change left it", async () => {
    dbm.getSponsor.mockResolvedValue({ id: "s1", name: "New" });
    await LIST_UNDO_HANDLERS.sponsor.restore("s1", { id: "s1", name: "Old" }, entry({ id: "s1", name: "New" }));
    expect(dbm.updateSponsor).toHaveBeenCalledWith("s1", { name: "Old" });
  });

  it("refuses when someone edited it since", async () => {
    dbm.getSponsor.mockResolvedValue({ id: "s1", name: "Newer" });
    await expect(LIST_UNDO_HANDLERS.sponsor.restore("s1", { id: "s1", name: "Old" }, entry({ id: "s1", name: "New" }))).rejects.toThrow(/changed since/);
  });
});
