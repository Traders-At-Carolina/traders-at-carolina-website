import { z } from "zod";
import { QUESTIONS, ROUNDS, scoreSpread } from "@/lib/games/fermi";

/**
 * Score saving (spec 03 §3.7): request shapes, server-side scoring and the "ask for a name" rule. Pure, so the
 * route handlers stay thin and this is tested without a database.
 */

export const GAMES = ["sprint", "fermi"] as const;
export type Game = (typeof GAMES)[number];

/** Well above a world-class Zetamac two minutes; anything higher is not a real play. */
export const SPRINT_MAX = 200;
/** Until a game has this many saved scores, "top 10%" uses a fixed bar instead of the 90th percentile. */
export const MIN_SCORES_FOR_PERCENTILE = 50;
export const FALLBACK_THRESHOLD: Record<Game, number> = { sprint: 40, fermi: 200 };
/** Saves allowed per browser id, and per hashed IP, in a rolling hour. */
export const SAVES_PER_HOUR = 30;

const playerId = z.uuid();
const amount = z.number().positive().finite();

export const scoreRequest = z.discriminatedUnion("game", [
  z.object({ game: z.literal("sprint"), playerId, correct: z.int().min(0).max(SPRINT_MAX), skipped: z.int().min(0).max(10_000) }),
  z.object({
    game: z.literal("fermi"),
    playerId,
    quotes: z.array(z.object({ id: z.string().max(64), low: amount, high: amount })).length(ROUNDS),
  }),
]);
export type ScoreRequest = z.infer<typeof scoreRequest>;

export const contactRequest = z.object({
  playerId,
  scoreId: z.int().positive(),
  name: z.string().trim().min(1).max(60),
  email: z.union([z.literal(""), z.email().max(254)]).optional(),
});
export type ContactRequest = z.infer<typeof contactRequest>;

export const claimRequest = z.object({ playerId });

export type Scored = { game: Game; score: number; detail: Record<string, unknown> };

const bank = new Map(QUESTIONS.map((q) => [q.id, q]));

/**
 * The score to store. Sprint is as reported (within the cap the schema enforces). Fermi is recomputed from the
 * quotes and the question bank, so a tampered total can't be saved; unknown or repeated questions are rejected.
 */
export function scoreSubmission(req: ScoreRequest): { ok: true; scored: Scored } | { ok: false; error: string } {
  if (req.game === "sprint") {
    return { ok: true, scored: { game: "sprint", score: req.correct, detail: { correct: req.correct, skipped: req.skipped } } };
  }
  const ids = req.quotes.map((q) => q.id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: "Each question can be quoted once." };
  let score = 0;
  for (const quote of req.quotes) {
    const question = bank.get(quote.id);
    if (!question) return { ok: false, error: `Unknown question: ${quote.id}` };
    if (quote.low > quote.high) return { ok: false, error: "Low must be at or below high." };
    score += scoreSpread(quote.low, quote.high, question.value);
  }
  return { ok: true, scored: { game: "fermi", score, detail: { quotes: req.quotes } } };
}

/** The 90th percentile once there's enough history, a fixed bar before that. */
export function nameThreshold(game: Game, count: number, p90: number | null): number {
  return count < MIN_SCORES_FOR_PERCENTILE || p90 === null ? FALLBACK_THRESHOLD[game] : p90;
}

/** Ask for a name only from signed-out visitors with a top score who haven't left one already. */
export function shouldAskName({ signedIn, score, threshold, hasContact }: { signedIn: boolean; score: number; threshold: number; hasContact: boolean }): boolean {
  return !signedIn && !hasContact && score > 0 && score >= threshold;
}
