import { beforeEach, describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({ admin: true }));
const db = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/admin", async () => {
  class AdminAccessError extends Error {}
  return {
    AdminAccessError,
    requireAdmin: async () => {
      if (!gate.admin) throw new AdminAccessError("Admins only");
      return { userId: "user_admin" };
    },
  };
});
vi.mock("@/lib/db/client", () => ({ db }));

import { events, members, people, placements, sponsors } from "@/lib/db/schema";
import { searchAdmin } from "@/lib/admin/search";

/** A Drizzle-shaped fake: select().from(table).where().orderBy().limit() resolves to that table's rows. */
function fakeDb(rows: Map<unknown, unknown[] | Error>) {
  return {
    select: () => ({
      from: (table: unknown) => {
        const chain = {
          where: () => chain,
          orderBy: () => chain,
          limit: async () => {
            const r = rows.get(table) ?? [];
            if (r instanceof Error) throw r;
            return r;
          },
        };
        return chain;
      },
    }),
  };
}

beforeEach(() => {
  gate.admin = true;
  db.mockReset();
});

describe("searchAdmin", () => {
  it("returns nothing to non-admins, without touching the database", async () => {
    gate.admin = false;
    await expect(searchAdmin("jane")).resolves.toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });

  it("returns nothing for queries under 2 characters, without touching the database", async () => {
    await expect(searchAdmin("j")).resolves.toEqual([]);
    await expect(searchAdmin("  a  ")).resolves.toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });

  it("maps each kind to its edit page, and one failing kind doesn't sink the rest", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    db.mockReturnValue(
      fakeDb(
        new Map<unknown, unknown[] | Error>([
          [members, [{ id: "m1", name: "", email: "jane@unc.edu" }]],
          [events, [{ id: "e1", title: "Jane Street info session", startsAt: "2026-10-16T19:00", type: "speaker" }]],
          [people, [{ id: "p-uuid", name: "Jane Roe", role: "Co-President" }]],
          [sponsors, new Error("timeout")],
          [placements, [{ id: "pl1", firm: "Jane Street", showOnWall: true }]],
        ]),
      ),
    );
    const results = await searchAdmin(" jane ");
    expect(results).toEqual([
      { kind: "member", id: "m1", label: "jane@unc.edu", sub: "jane@unc.edu", href: "/admin/members/m1" },
      { kind: "event", id: "e1", label: "Jane Street info session", sub: expect.stringContaining("Oct 16"), href: "/admin/events/e1" },
      { kind: "officer", id: "p-uuid", label: "Jane Roe", sub: "Co-President", href: "/admin/officers/p-uuid" },
      { kind: "placement", id: "pl1", label: "Jane Street", sub: expect.any(String), href: "/admin/placements/pl1" },
    ]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
