// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const dbm = vi.hoisted(() => ({
  getMembersByIds: vi.fn(),
  memberSnapshot: (r: Record<string, unknown>) => r,
  restoreMembers: vi.fn(),
  deleteMembersById: vi.fn(),
  getMember: vi.fn(),
  getRequest: vi.fn(),
  setRequestStatus: vi.fn(),
}));
vi.mock("@/lib/admin/members-db", () => dbm);

const { MEMBER_UNDO_HANDLERS } = await import("@/lib/admin/members-undo");

const entry = (after: unknown) => ({ id: 1, entity: "member-batch", entityId: "b1", after, before: null }) as never;

describe("member batch undo", () => {
  it("removes an added batch when every row is untouched", async () => {
    const rows = [{ id: "m1", status: "active" }];
    dbm.getMembersByIds.mockResolvedValue(rows);
    await MEMBER_UNDO_HANDLERS["member-batch"].remove?.("b1", entry({ rows }));
    expect(dbm.deleteMembersById).toHaveBeenCalledWith(["m1"]);
  });

  it("refuses if someone edited one of the rows since", async () => {
    dbm.getMembersByIds.mockResolvedValue([{ id: "m1", status: "alumni" }]);
    await expect(MEMBER_UNDO_HANDLERS["member-batch"].remove?.("b1", entry({ rows: [{ id: "m1", status: "active" }] }))).rejects.toThrow(/changed these members since/);
  });
});
