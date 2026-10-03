import type { SaveScoreResponse } from "@/app/api/games/scores/route";
import { getPlayerId } from "@/lib/games/player";

/**
 * Browser side of score saving (spec 03 §3.7). Every call fails soft: a network or server error returns null/false
 * and the game falls back to the best kept in this browser.
 */

export type SaveResult = SaveScoreResponse;

export type ScorePayload =
  | { game: "sprint"; correct: number; skipped: number }
  | { game: "fermi"; quotes: Array<{ id: string; low: number; high: number }> };

/** Where sign-in returns to; ?claim=1 tells the games to move this browser's history onto the account. */
export const AFTER_SIGN_IN = "/membership?claim=1#games";
export const SIGN_IN_HREF = `/account/sign-in?redirect_url=${encodeURIComponent(AFTER_SIGN_IN)}`;

async function post(path: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return null;
  }
}

export async function saveScore(payload: ScorePayload): Promise<SaveResult | null> {
  const res = await post("/api/games/scores", { ...payload, playerId: getPlayerId() });
  if (!res?.ok) return null;
  try {
    return (await res.json()) as SaveResult;
  } catch {
    return null;
  }
}

export async function saveContact(scoreId: number, name: string, email: string): Promise<boolean> {
  const res = await post("/api/games/contact", { playerId: getPlayerId(), scoreId, name, email });
  return Boolean(res?.ok);
}

export async function claimHistory(): Promise<boolean> {
  const res = await post("/api/games/claim", { playerId: getPlayerId() });
  return Boolean(res?.ok);
}
