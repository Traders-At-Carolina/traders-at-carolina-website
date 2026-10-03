// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { fakeDb } from "../helpers/fake-db";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const fake = fakeDb();
vi.mock("@/lib/db/client", () => ({ db: () => fake.db() }));
process.env.DATABASE_URL = "postgres://test";

const { getSeason, missingTable } = await import("@/lib/data/public");

describe("getSeason", () => {
  it("reads the academic year from the season setting", async () => {
    fake.queue([{ value: { academicYear: " 2026–27 " } }]);
    expect(await getSeason()).toEqual({ academicYear: "2026–27" });
  });

  it("treats a not-yet-migrated settings table as no academic year, so preview builds still pass", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fake.queue(Object.assign(new Error("Failed query"), { cause: { code: "42P01" } }));
    expect(await getSeason()).toEqual({});
  });

  it("still fails loudly on any other database error", async () => {
    fake.queue(Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }));
    await expect(getSeason()).rejects.toThrow("connection refused");
  });
});

describe("missingTable", () => {
  it("recognises Postgres undefined_table directly or as a cause", () => {
    expect(missingTable({ code: "42P01" })).toBe(true);
    expect(missingTable({ cause: { code: "42P01" } })).toBe(true);
    expect(missingTable(new Error("x"))).toBe(false);
  });
});
