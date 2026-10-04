import { beforeEach, describe, expect, it, vi } from "vitest";
import { filterItems, PALETTE_ACTIONS, readRecent, RECENT_KEY, RECENT_LIMIT, recordRecent } from "@/lib/admin/palette";

const items = [
  { label: "Placements", description: "Where members have landed", keywords: ["firms"] },
  { label: "Members", description: "Roster and requests" },
  { label: "Sponsors", description: "Partner firms" },
];

describe("filterItems", () => {
  it("returns everything for an empty query", () => {
    expect(filterItems(items, "  ")).toEqual(items);
  });

  it("matches label, description and keywords, case-insensitively", () => {
    expect(filterItems(items, "ROSTER").map((i) => i.label)).toEqual(["Members"]);
    expect(filterItems(items, "firms").map((i) => i.label)).toEqual(["Placements", "Sponsors"]);
  });

  it("puts label-prefix matches first", () => {
    // "mem" is inside Placements' description but starts Members' label.
    expect(filterItems(items, "mem").map((i) => i.label)).toEqual(["Members", "Placements"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterItems(items, "zzz")).toEqual([]);
  });
});

describe("PALETTE_ACTIONS", () => {
  it("only navigates inside the console", () => {
    for (const action of PALETTE_ACTIONS) expect(action.href).toMatch(/^\/admin(\/|\?|$)/);
    expect(PALETTE_ACTIONS.find((a) => a.label === "Review requests")?.href).toBe("/admin/members?tab=requests");
  });
});

describe("recent screens", () => {
  beforeEach(() => sessionStorage.clear());

  it("keeps the newest first, without duplicates, up to the limit", () => {
    for (const h of ["/admin/a", "/admin/b", "/admin/a", "/admin/c", "/admin/d", "/admin/e", "/admin/f"]) recordRecent(h);
    expect(readRecent()).toEqual(["/admin/f", "/admin/e", "/admin/d", "/admin/c", "/admin/a"]);
    expect(readRecent()).toHaveLength(RECENT_LIMIT);
  });

  it("treats junk in storage as empty", () => {
    sessionStorage.setItem(RECENT_KEY, "{not json");
    expect(readRecent()).toEqual([]);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify({ a: 1 }));
    expect(readRecent()).toEqual([]);
  });

  it("survives storage that throws", () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readRecent()).toEqual([]);
    expect(() => recordRecent("/admin/x")).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });
});
