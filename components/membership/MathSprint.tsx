"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClasses } from "@/components/Button";
import { GameResult } from "@/components/membership/GameResult";
import { type BestScore, recordBest } from "@/lib/games/best-score";
import { type Question, SPRINT_MS, isCorrect, makeQuestion } from "@/lib/games/mental-math";
import { mulberry32 } from "@/lib/random-walk";

const TICK_MS = 100;
const WARN_MS = 10_000;

type Phase = "idle" | "playing" | "done";

/**
 * A Zetamac-style sprint: 120 seconds of mixed arithmetic (spec 03 §3.7). A correct answer submits itself, so the
 * only keys that matter are digits. The timer is wall-clock (Date.now), so a throttled background tab still ends on time.
 */
export function MathSprint({ cta }: { cta: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNo, setQuestionNo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [typed, setTyped] = useState("");
  const [misses, setMisses] = useState(0);
  const [remaining, setRemaining] = useState(SPRINT_MS);
  const [best, setBest] = useState<BestScore | null>(null);

  const rand = useRef<() => number>(Math.random);
  const startedAt = useRef(0);
  const correctRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    inputRef.current?.focus();
    const id = window.setInterval(() => {
      const left = Math.max(0, SPRINT_MS - (Date.now() - startedAt.current));
      setRemaining(left);
      if (left === 0) {
        setBest(recordBest("sprint", correctRef.current));
        setPhase("done");
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const nextQuestion = () => {
    setQuestion(makeQuestion(rand.current));
    setQuestionNo((n) => n + 1);
    setTyped("");
  };

  const start = () => {
    rand.current = mulberry32(Math.floor(Math.random() * 2 ** 32));
    startedAt.current = Date.now();
    correctRef.current = 0;
    setCorrect(0);
    setSkipped(0);
    setMisses(0);
    setRemaining(SPRINT_MS);
    setBest(null);
    nextQuestion();
    setPhase("playing");
  };

  const onChange = (input: HTMLInputElement) => {
    if (!question) return;
    const cleaned = input.value.replace(/[^\d-]/g, "");
    if (isCorrect(cleaned, question)) {
      // A pasted answer arrives while state is still "", so setting state to "" changes nothing React can see.
      input.value = "";
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setMisses(0);
      nextQuestion();
    } else {
      setTyped(cleaned);
    }
  };

  const skip = () => {
    setSkipped((s) => s + 1);
    setMisses(0);
    nextQuestion();
    inputRef.current?.focus();
  };

  if (phase === "idle") {
    return (
      <div className="flex flex-1 flex-col items-start justify-center">
        <p className="eyebrow">120 seconds · Zetamac rules</p>
        <h3 className="mt-4 text-h3">Mental math sprint</h3>
        <p className="mt-3 max-w-prose text-body text-ink-2">
          Addition, subtraction, multiplication and division: the drill trading candidates practise on. A correct answer
          submits itself; skip anything that stalls you.
        </p>
        <button type="button" onClick={start} className={`mt-8 ${buttonClasses({ variant: "light", shape: "rounded" })}`}>
          Start the sprint
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <GameResult
        score={String(correct)}
        unit="correct in 120 seconds"
        detail={skipped ? `${skipped} skipped` : undefined}
        best={best}
        note="Zetamac is the two-minute drill trading candidates practise on, so your score compares directly. Our interview is a conversation: we care how you reason, not how fast you type."
        onReplay={start}
        cta={cta}
      />
    );
  }

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="flex flex-1 flex-col font-zetamac">
      <div className="h-0.5 w-full bg-rule" aria-hidden="true">
        <div className="game-timer h-full origin-left bg-navy" style={{ transform: `scaleX(${remaining / SPRINT_MS})` }} />
      </div>
      <div className="mt-3 flex items-baseline justify-between text-caption text-ink-3">
        <span className="tabular">{correct} correct</span>
        <span className={`tabular ${remaining <= WARN_MS ? "font-semibold text-navy" : ""}`}>{seconds}s left</span>
      </div>
      <p className="sr-only" aria-live="polite">
        {remaining <= WARN_MS ? "Ten seconds left." : ""}
      </p>

      {/* Problem and answer share one line, as on Zetamac; the group sits a little above centre in the fixed-height card. */}
      <div className="flex flex-1 flex-col justify-center pb-8">
        <form
          className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[clamp(1.875rem,5vw,3.5rem)] leading-none tabular"
          onSubmit={(e) => {
            e.preventDefault();
            // A correct answer never gets here (it submits itself), so Enter on a value means "not this".
            if (typed) {
              setMisses((m) => m + 1);
              setTyped("");
            }
          }}
        >
          <span key={questionNo} id="sprint-prompt" className="game-enter inline-block whitespace-nowrap">
            {question?.prompt} =
          </span>
          {/* Exactly four digits wide: the largest answer is 12 × 100 = 1,200. */}
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => onChange(e.target)}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            aria-label="Answer"
            aria-describedby="sprint-prompt"
            className="w-[calc(4ch+0.5em+2px)] min-w-0 rounded-[0.625rem] border border-rule-strong bg-black/20 px-[0.25em] py-[0.15em] font-zetamac tabular outline-none transition-colors duration-150 focus:border-bone"
          />
        </form>
        <div className="mt-6 flex min-h-11 items-center gap-4">
          <button type="button" onClick={skip} className={buttonClasses({ variant: "light-outline", shape: "rounded", size: "compact" })}>
            Skip
          </button>
          <p className="text-caption text-ink-3" aria-live="polite">
            {misses ? (
              <span key={misses} className="game-enter inline-block">
                Not quite. Try again or skip.
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
