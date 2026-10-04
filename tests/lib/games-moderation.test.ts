// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../helpers/fake-db";

const session = vi.hoisted(() => ({ admin: true }));
const updateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ updateTag, revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: session.admin ? "admin_1" : null }),
  currentUser: async () => (session.admin ? { publicMetadata: { role: "admin" }, emailAddresses: [], primaryEmailAddress: { emailAddress: "officer@unc.edu" } } : null),
}));
const recordAudit = vi.hoisted(() => vi.fn(async () => 77));
vi.mock("@/lib/admin/audit", () => ({ recordAudit }));
const fake = fakeDb();
vi.mock("@/lib/db/client", () => ({ db: () => fake.db() }));

const { deleteGameContact, deleteGameScore } = await import("@/app/admin/(console)/games/actions");
const { GAME_UNDO_HANDLERS, GAMES_TAG } = await import("@/lib/admin/games-undo");
const { canUndoEntity } = await import("@/lib/admin/undo");

const created = new Date("2026-09-30T12:00:00.000Z");
const scoreRow = { id: 12, game: "sprint", score: 41, detail: { correct: 41, skipped: 2 }, playerId: "8f1c2f0e-5b8a-4c1e-9e57-0f4f1d1f2a10", userId: null, ipHash: "abc", createdAt: created };
const contactRow = { id: 5, playerId: scoreRow.playerId, userId: null, name: "Ada Lovelace", email: "ada@unc.edu", scoreId: 12, createdAt: created };
const contactSnap = { ...contactRow, createdAt: created.toISOString() };
const scoreSnap = { ...scoreRow, createdAt: created.toISOString(), contact: contactSnap };

const form = (id: string) => {
  const fd = new FormData();
  fd.set("id", id);
  return fd;
};
const batchArgs = () => (fake.db().batch.mock.calls.at(-1) as unknown as [unknown[]])[0];

beforeEach(() => {
  vi.clearAllMocks();
  session.admin = true;
  fake.calls.length = 0;
});

describe("deleting a game score", () => {
  it("refuses non-admins without touching the database", async () => {
    session.admin = false;
    expect(await deleteGameScore({}, form("12"))).toMatchObject({ error: "Only admins can do that." });
    expect(fake.calls).toHaveLength(0);
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it("rejects ids that aren't row ids", async () => {
    for (const bad of ["abc", "-1", "1.5", ""]) {
      expect((await deleteGameScore({}, form(bad))).error).toBe("Check the highlighted fields.");
    }
    expect(fake.calls).toHaveLength(0);
  });

  it("deletes the score with its linked contact in one batch, audits both, and expires the games tag", async () => {
    fake.queue([scoreRow], [contactRow]);
    const state = await deleteGameScore({}, form("12"));

    expect(fake.db().batch).toHaveBeenCalledTimes(1);
    expect(batchArgs()).toHaveLength(2);
    // Two reads (score, contact), then the two deletes: contact first, then score.
    expect(fake.methods(2)).toEqual(["where"]);
    expect(recordAudit).toHaveBeenCalledWith({
      actorId: "admin_1",
      actorEmail: "officer@unc.edu",
      action: "delete",
      entity: "game-score",
      entityId: "12",
      entityLabel: "Mental math sprint score 41",
      before: scoreSnap,
      after: null,
    });
    expect(updateTag).toHaveBeenCalledWith(GAMES_TAG);
    expect(state).toMatchObject({ ok: "Mental math sprint score 41 deleted.", undoId: 77, redirectTo: "/admin/games?saved=77" });
  });

  it("records a null contact when the score had none", async () => {
    fake.queue([scoreRow], []);
    await deleteGameScore({}, form("12"));
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ before: { ...scoreSnap, contact: null } }));
  });

  it("says so when the score is already gone", async () => {
    fake.queue([]);
    expect(await deleteGameScore({}, form("12"))).toMatchObject({ error: "That score is already gone." });
    expect(fake.db().batch).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe("deleting a game contact", () => {
  it("refuses non-admins", async () => {
    session.admin = false;
    expect(await deleteGameContact({}, form("5"))).toMatchObject({ error: "Only admins can do that." });
    expect(fake.calls).toHaveLength(0);
  });

  it("deletes only the contact, audits its snapshot and expires the games tag", async () => {
    fake.queue([contactRow], []);
    const state = await deleteGameContact({}, form("5"));
    expect(fake.calls).toHaveLength(2);
    expect(fake.methods(1)).toEqual(["where"]);
    expect(fake.db().batch).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "delete", entity: "game-contact", entityId: "5", entityLabel: "Ada Lovelace", before: contactSnap, after: null }));
    expect(updateTag).toHaveBeenCalledWith(GAMES_TAG);
    expect(state).toMatchObject({ undoId: 77, redirectTo: "/admin/games?saved=77" });
  });
});

describe("undoing game deletes", () => {
  const entry = (entity: string, before: unknown) => ({ id: 77, entity, entityId: "12", before, after: null }) as never;

  it("is offered for both entities", () => {
    expect(canUndoEntity("game-score")).toBe(true);
    expect(canUndoEntity("game-contact")).toBe(true);
  });

  it("recreates the score, then its contact, with their original ids and values", async () => {
    const { after } = await GAME_UNDO_HANDLERS["game-score"].recreate!(scoreSnap, entry("game-score", scoreSnap));
    expect(after).toEqual(scoreSnap);
    expect(fake.db().batch).toHaveBeenCalledTimes(1);
    expect(batchArgs()).toHaveLength(2);
    const [scoreInsert, contactInsert] = fake.calls.map((c) => c.find((s) => s.method === "values")?.args[0]);
    expect(scoreInsert).toEqual({ ...scoreRow });
    expect(contactInsert).toEqual({ ...contactRow });
  });

  it("recreates just the score when it had no contact", async () => {
    await GAME_UNDO_HANDLERS["game-score"].recreate!({ ...scoreSnap, contact: null }, entry("game-score", null));
    expect(batchArgs()).toHaveLength(1);
  });

  it("recreates a contact while its score still exists", async () => {
    fake.queue([{ id: 12 }], []);
    await GAME_UNDO_HANDLERS["game-contact"].recreate!(contactSnap, entry("game-contact", contactSnap));
    expect(fake.calls[1].find((s) => s.method === "values")?.args[0]).toEqual({ ...contactRow });
  });

  it("refuses to recreate a contact whose score was deleted since", async () => {
    fake.queue([]);
    await expect(GAME_UNDO_HANDLERS["game-contact"].recreate!(contactSnap, entry("game-contact", contactSnap))).rejects.toThrow(/Undo that first/);
  });

  it("undoing the undo deletes the recreated score and contact again", async () => {
    fake.queue([scoreRow], [contactRow]);
    const { before } = await GAME_UNDO_HANDLERS["game-score"].remove!("12", entry("game-score", null));
    expect(before).toEqual(scoreSnap);
    expect(batchArgs()).toHaveLength(2);
  });
});
