import { describe, expect, it } from "vitest";
import { RANGES, SPRINT_MS, isCorrect, makeQuestion } from "@/lib/games/mental-math";
import { mulberry32 } from "@/lib/random-walk";

const parse = (prompt: string) => {
  const [, a, op, b] = prompt.match(/^(\d+) ([+−×÷]) (\d+)$/)!;
  return { a: Number(a), op, b: Number(b) };
};
const within = (n: number, [min, max]: readonly [number, number]) => n >= min && n <= max;

describe("mental math sprint (Zetamac defaults)", () => {
  const questions = (() => {
    const rand = mulberry32(7);
    return Array.from({ length: 2000 }, () => makeQuestion(rand));
  })();

  it("runs for 120 seconds", () => {
    expect(SPRINT_MS).toBe(120_000);
  });

  it("asks all four operations", () => {
    expect(new Set(questions.map((q) => parse(q.prompt).op))).toEqual(new Set(["+", "−", "×", "÷"]));
  });

  it("keeps every operand in Zetamac's ranges, with − and ÷ as reversed + and ×", () => {
    for (const { prompt, answer } of questions) {
      const { a, op, b } = parse(prompt);
      if (op === "+") expect(within(a, RANGES.add) && within(b, RANGES.add) && answer === a + b).toBe(true);
      if (op === "−") expect(within(b, RANGES.add) && within(answer, RANGES.add) && answer === a - b).toBe(true);
      if (op === "×") expect(within(a, RANGES.multiplyBy) && within(b, RANGES.multiply) && answer === a * b).toBe(true);
      if (op === "÷") expect(within(b, RANGES.multiplyBy) && within(answer, RANGES.multiply) && answer * b === a).toBe(true);
    }
  });

  it("is deterministic for a seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(Array.from({ length: 10 }, () => makeQuestion(a))).toEqual(Array.from({ length: 10 }, () => makeQuestion(b)));
  });

  it("accepts only the exact whole-number answer", () => {
    const q = { prompt: "12 + 30", answer: 42 };
    expect(isCorrect("42", q)).toBe(true);
    expect(isCorrect(" 42 ", q)).toBe(true);
    expect(isCorrect("4", q)).toBe(false);
    expect(isCorrect("42.0", q)).toBe(false);
    expect(isCorrect("", q)).toBe(false);
  });
});
