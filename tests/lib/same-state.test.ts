import { describe, expect, it } from "vitest";
import { sameState } from "@/lib/admin/same-state";

describe("sameState", () => {
  it("ignores key order, as Postgres jsonb returns keys in its own order", () => {
    const written = { name: "Citadel", logo: { src: "/a.png", width: 200, height: 80 }, url: null };
    const readBack = { url: null, logo: { width: 200, height: 80, src: "/a.png" }, name: "Citadel" };
    expect(JSON.stringify(written)).not.toBe(JSON.stringify(readBack));
    expect(sameState(written, readBack)).toBe(true);
  });

  it("still sees real changes, including inside arrays", () => {
    expect(sameState({ tracks: ["trading", "research"] }, { tracks: ["research", "trading"] })).toBe(false);
    expect(sameState({ name: "A" }, { name: "B" })).toBe(false);
  });

  it("treats dates as ISO strings and drops undefined fields", () => {
    expect(sameState({ at: new Date("2026-10-04T12:00:00Z"), x: undefined }, { at: "2026-10-04T12:00:00.000Z" })).toBe(true);
  });
});
