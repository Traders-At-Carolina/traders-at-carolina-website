/**
 * Mental math sprint (spec 03 §3.7), on Zetamac's default rules so scores compare with the test trading firms use:
 * 120 seconds; + is (2–100) + (2–100); × is (2–12) × (2–100); − and ÷ are those two run backwards,
 * so every answer is a whole, non-negative number.
 */

export type Question = { prompt: string; answer: number };

export const SPRINT_MS = 120_000;

export const RANGES = {
  add: [2, 100],
  multiplyBy: [2, 12],
  multiply: [2, 100],
} as const;

const int = (rand: () => number, [min, max]: readonly [number, number]) => min + Math.floor(rand() * (max - min + 1));

export function makeQuestion(rand: () => number): Question {
  const op = Math.floor(rand() * 4);
  if (op < 2) {
    const a = int(rand, RANGES.add);
    const b = int(rand, RANGES.add);
    return op === 0 ? { prompt: `${a} + ${b}`, answer: a + b } : { prompt: `${a + b} − ${a}`, answer: b };
  }
  const a = int(rand, RANGES.multiplyBy);
  const b = int(rand, RANGES.multiply);
  return op === 2 ? { prompt: `${a} × ${b}`, answer: a * b } : { prompt: `${a * b} ÷ ${a}`, answer: b };
}

/** True when the typed text is exactly the answer (ignores surrounding spaces). */
export function isCorrect(typed: string, question: Question): boolean {
  const trimmed = typed.trim();
  return /^-?\d+$/.test(trimmed) && Number(trimmed) === question.answer;
}
