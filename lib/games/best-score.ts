/** Per-browser best scores for the membership games. Storage can be missing or blocked, so every access is guarded. */

export type BestScore = { best: number; isNew: boolean };

const PREFIX = "tac:games:";

/** Stores `score` if it beats the saved best; returns the best after this round. */
export function recordBest(game: string, score: number): BestScore {
  let previous: number | null = null;
  try {
    const raw = window.localStorage.getItem(PREFIX + game);
    const parsed = raw === null ? NaN : Number(raw);
    previous = Number.isFinite(parsed) ? parsed : null;
  } catch {
    return { best: score, isNew: false };
  }
  if (previous !== null && previous >= score) return { best: previous, isNew: false };
  try {
    window.localStorage.setItem(PREFIX + game, String(score));
  } catch {
    // Blocked storage: the score still shows for this round.
  }
  // A first-ever round isn't a "new best": there was nothing to beat.
  return { best: score, isNew: previous !== null };
}
