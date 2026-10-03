// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../helpers/fake-db";

const fake = fakeDb();
vi.mock("@/lib/db/client", () => ({ db: () => fake.db() }));

const { getMembership } = await import("@/lib/members/resolve");

const row = (over: Record<string, unknown> = {}) => ({ id: "m1", email: "ada@unc.edu", status: "active", track: "research", userId: null, ...over });

beforeEach(() => {
  fake.calls.length = 0;
});

describe("getMembership", () => {
  it("finds a linked row by user id", async () => {
    fake.queue([row({ userId: "user_1" })]);
    expect(await getMembership({ id: "user_1", verifiedEmails: [] })).toEqual({ status: "active", track: "research" });
  });

  it("falls back to a verified email, then links the row to the account", async () => {
    fake.queue([], [row()], []);
    expect(await getMembership({ id: "user_1", verifiedEmails: ["ADA@unc.edu"] })).toEqual({ status: "active", track: "research" });
    expect(fake.methods(2)).toContain("set");
    expect(fake.calls[2].find((s) => s.method === "set")?.args[0]).toMatchObject({ userId: "user_1" });
  });

  it("is null with no row, for inactive rows, and for a row already linked to someone else", async () => {
    fake.queue([], []);
    expect(await getMembership({ id: "user_1", verifiedEmails: ["x@unc.edu"] })).toBeNull();
    fake.queue([row({ userId: "user_1", status: "inactive" })]);
    expect(await getMembership({ id: "user_1", verifiedEmails: [] })).toBeNull();
    fake.queue([], [row({ userId: "user_2" })]);
    expect(await getMembership({ id: "user_1", verifiedEmails: ["ada@unc.edu"] })).toBeNull();
  });

  it("skips the email lookup when the account has no verified email", async () => {
    fake.queue([]);
    expect(await getMembership({ id: "user_1", verifiedEmails: [] })).toBeNull();
    expect(fake.calls).toHaveLength(1);
  });
});
