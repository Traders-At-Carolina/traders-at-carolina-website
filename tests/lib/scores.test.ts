import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/lib/games/fermi";
import {
  FALLBACK_THRESHOLD,
  MIN_SCORES_FOR_PERCENTILE,
  SPRINT_MAX,
  contactRequest,
  nameThreshold,
  scoreRequest,
  scoreSubmission,
  shouldAskName,
} from "@/lib/games/scores";

const playerId = "3f2c9a0e-8b1d-4c5e-9f6a-7b8c9d0e1f2a";
const [a, b, c] = QUESTIONS;

describe("score requests", () => {
  it("accepts a sprint and caps it at a plausible maximum", () => {
    expect(scoreRequest.safeParse({ game: "sprint", playerId, correct: 43, skipped: 2 }).success).toBe(true);
    expect(scoreRequest.safeParse({ game: "sprint", playerId, correct: SPRINT_MAX + 1, skipped: 0 }).success).toBe(false);
    expect(scoreRequest.safeParse({ game: "sprint", playerId, correct: 4.5, skipped: 0 }).success).toBe(false);
  });

  it("requires a uuid player id and exactly three Fermi quotes", () => {
    expect(scoreRequest.safeParse({ game: "sprint", playerId: "nope", correct: 1, skipped: 0 }).success).toBe(false);
    const quote = { id: a.id, low: 1, high: 2 };
    expect(scoreRequest.safeParse({ game: "fermi", playerId, quotes: [quote, quote] }).success).toBe(false);
    expect(scoreRequest.safeParse({ game: "fermi", playerId, quotes: [{ ...quote, low: -1 }, quote, quote] }).success).toBe(false);
  });
});

describe("scoreSubmission", () => {
  it("keeps a sprint's reported count", () => {
    const req = scoreRequest.parse({ game: "sprint", playerId, correct: 43, skipped: 2 });
    expect(scoreSubmission(req)).toEqual({ ok: true, scored: { game: "sprint", score: 43, detail: { correct: 43, skipped: 2 } } });
  });

  it("recomputes Fermi from the bank, so the client can't send its own total", () => {
    const quotes = [
      { id: a.id, low: a.value, high: a.value }, // exact: 100
      { id: b.id, low: b.value / 2, high: b.value * 5 }, // 10× wide: 75
      { id: c.id, low: 1, high: 2 }, // miss: 0
    ];
    const result = scoreSubmission(scoreRequest.parse({ game: "fermi", playerId, quotes, score: 300 }));
    expect(result).toMatchObject({ ok: true, scored: { game: "fermi", score: 175 } });
  });

  it("rejects unknown and repeated Fermi questions, and inverted spreads", () => {
    const ok = { id: a.id, low: 1, high: 2 };
    const run = (quotes: unknown[]) => scoreSubmission(scoreRequest.parse({ game: "fermi", playerId, quotes }));
    expect(run([{ ...ok, id: "made-up" }, { ...ok, id: b.id }, { ...ok, id: c.id }])).toMatchObject({ ok: false });
    expect(run([ok, ok, { ...ok, id: c.id }])).toMatchObject({ ok: false });
    expect(run([{ id: a.id, low: 5, high: 2 }, { ...ok, id: b.id }, { ...ok, id: c.id }])).toMatchObject({ ok: false });
  });
});

describe("asking for a name", () => {
  it("uses a fixed bar until there's enough history, then the 90th percentile", () => {
    expect(nameThreshold("sprint", MIN_SCORES_FOR_PERCENTILE - 1, 12)).toBe(FALLBACK_THRESHOLD.sprint);
    expect(nameThreshold("fermi", MIN_SCORES_FOR_PERCENTILE, 182.5)).toBe(182.5);
    expect(nameThreshold("fermi", 500, null)).toBe(FALLBACK_THRESHOLD.fermi);
  });

  it("asks only signed-out visitors with a top score and no name on file", () => {
    const base = { signedIn: false, score: 45, threshold: 40, hasContact: false };
    expect(shouldAskName(base)).toBe(true);
    expect(shouldAskName({ ...base, signedIn: true })).toBe(false);
    expect(shouldAskName({ ...base, hasContact: true })).toBe(false);
    expect(shouldAskName({ ...base, score: 39 })).toBe(false);
    expect(shouldAskName({ ...base, score: 0, threshold: 0 })).toBe(false);
  });

  it("validates contact details: a short name, and an email only if given", () => {
    const base = { playerId, scoreId: 7, name: "Alex" };
    expect(contactRequest.safeParse(base).success).toBe(true);
    expect(contactRequest.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(contactRequest.safeParse({ ...base, email: "alex@unc.edu" }).success).toBe(true);
    expect(contactRequest.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(contactRequest.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(contactRequest.safeParse({ ...base, name: "x".repeat(61) }).success).toBe(false);
  });
});
