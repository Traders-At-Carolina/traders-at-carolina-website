// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => auth() }));

const dbMock = {
  hashIp: vi.fn(() => "hash"),
  savesInLastHour: vi.fn(async () => 0),
  claimPlayer: vi.fn(async () => {}),
  personalBest: vi.fn(async (): Promise<number | null> => null),
  insertScore: vi.fn(async () => 11),
  scoreStats: vi.fn(async () => ({ count: 0, p90: null as number | null })),
  hasContact: vi.fn(async () => false),
  scoreBelongsTo: vi.fn(async () => true),
  insertContact: vi.fn(async () => {}),
};
vi.mock("@/lib/games/scores-db", () => dbMock);

const { POST: saveScore } = await import("@/app/api/games/scores/route");
const { POST: saveContact } = await import("@/app/api/games/contact/route");
const { POST: claim } = await import("@/app/api/games/claim/route");

const playerId = "3f2c9a0e-8b1d-4c5e-9f6a-7b8c9d0e1f2a";
const post = (body: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": "1.2.3.4" } });

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: null });
});

describe("POST /api/games/scores", () => {
  it("saves an anonymous play and asks for a name above the bar", async () => {
    const res = await saveScore(post({ game: "sprint", playerId, correct: 45, skipped: 0 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scoreId: 11, score: 45, best: 45, newBest: false, signedIn: false, askName: true });
    expect(dbMock.insertScore).toHaveBeenCalledWith({ game: "sprint", score: 45, detail: { correct: 45, skipped: 0 } }, playerId, null, "hash");
    expect(dbMock.claimPlayer).not.toHaveBeenCalled();
  });

  it("doesn't ask below the bar, or when a name is already on file", async () => {
    expect((await (await saveScore(post({ game: "sprint", playerId, correct: 12, skipped: 0 }))).json()).askName).toBe(false);
    dbMock.hasContact.mockResolvedValueOnce(true);
    expect((await (await saveScore(post({ game: "sprint", playerId, correct: 45, skipped: 0 }))).json()).askName).toBe(false);
  });

  it("puts a signed-in play on the account, claims the browser's history and never asks for a name", async () => {
    auth.mockResolvedValue({ userId: "user_1" });
    dbMock.personalBest.mockResolvedValueOnce(30);
    const body = await (await saveScore(post({ game: "sprint", playerId, correct: 45, skipped: 0 }))).json();
    expect(dbMock.claimPlayer).toHaveBeenCalledWith(playerId, "user_1");
    expect(dbMock.personalBest).toHaveBeenCalledWith("sprint", { userId: "user_1" });
    expect(dbMock.insertScore).toHaveBeenCalledWith(expect.anything(), playerId, "user_1", "hash");
    expect(body).toMatchObject({ signedIn: true, askName: false, best: 45, newBest: true });
  });

  it("rejects bad input and rate-limits", async () => {
    expect((await saveScore(post({ game: "sprint", playerId, correct: 9999, skipped: 0 }))).status).toBe(400);
    expect((await saveScore(post({ game: "fermi", playerId, quotes: [{ id: "x", low: 1, high: 2 }, { id: "y", low: 1, high: 2 }, { id: "z", low: 1, high: 2 }] }))).status).toBe(400);
    dbMock.savesInLastHour.mockResolvedValueOnce(30);
    expect((await saveScore(post({ game: "sprint", playerId, correct: 5, skipped: 0 }))).status).toBe(429);
    expect(dbMock.insertScore).not.toHaveBeenCalled();
  });
});

describe("POST /api/games/contact", () => {
  it("stores a name for this browser's score", async () => {
    const res = await saveContact(post({ playerId, scoreId: 11, name: " Alex ", email: "" }));
    expect(res.status).toBe(200);
    expect(dbMock.insertContact).toHaveBeenCalledWith({ playerId, scoreId: 11, name: "Alex", email: null });
  });

  it("refuses someone else's score and signed-in visitors", async () => {
    dbMock.scoreBelongsTo.mockResolvedValueOnce(false);
    expect((await saveContact(post({ playerId, scoreId: 11, name: "Alex" }))).status).toBe(404);
    auth.mockResolvedValue({ userId: "user_1" });
    expect((await saveContact(post({ playerId, scoreId: 11, name: "Alex" }))).status).toBe(409);
    expect(dbMock.insertContact).not.toHaveBeenCalled();
  });
});

describe("POST /api/games/claim", () => {
  it("needs a session, then moves the browser's history onto it", async () => {
    expect((await claim(post({ playerId }))).status).toBe(401);
    auth.mockResolvedValue({ userId: "user_1" });
    expect((await claim(post({ playerId }))).status).toBe(200);
    expect(dbMock.claimPlayer).toHaveBeenCalledWith(playerId, "user_1");
  });
});
