"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/Button";
import { GameResult } from "@/components/membership/GameResult";
import { type BestScore, recordBest } from "@/lib/games/best-score";
import {
  type Domain,
  type FermiQuestion,
  MAX_ROUND_SCORE,
  ROUNDS,
  axisDomain,
  axisPercent,
  axisTicks,
  formatAmount,
  formatAnswer,
  formatRatio,
  isHit,
  missFactor,
  parseAmount,
  pickRounds,
  scoreSpread,
  tickLabel,
} from "@/lib/games/fermi";

type Phase = "idle" | "playing" | "done";
type Quote = { low: number; high: number };

const INPUT_CLASSES =
  "mt-1.5 w-full rounded-[0.625rem] border border-rule-strong bg-black/20 px-4 py-2 text-lead tabular outline-none transition-colors duration-150 placeholder:text-ink-3/60 focus:border-bone disabled:opacity-60";

/**
 * Fermi markets (spec 03 §3.7): quote a low–high spread on a big-number question. The spread draws live on a log
 * number line; locking in rescales the line to take in the answer, then drops the answer's marker onto it.
 * The line only ever fits the visitor's own numbers until the reveal, so its scale never gives the answer away.
 */
export function FermiMarket({ cta }: { cta: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<FermiQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [lowText, setLowText] = useState("");
  const [highText, setHighText] = useState("");
  // Format errors wait until a field is left or a quote is tried, so half-typed values ("2.", "3 bi") never flag.
  const [touched, setTouched] = useState({ low: false, high: false });
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [best, setBest] = useState<BestScore | null>(null);
  const lowRef = useRef<HTMLInputElement>(null);
  const highRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const question = rounds[round];
  const quote: Quote | undefined = quotes[round];
  const revealed = quote !== undefined;

  useEffect(() => {
    if (phase !== "playing") return;
    (revealed ? nextRef : lowRef).current?.focus();
  }, [phase, revealed, round]);

  const start = () => {
    setRounds(pickRounds(Math.floor(Math.random() * 2 ** 32)));
    setRound(0);
    setLowText("");
    setHighText("");
    setTouched({ low: false, high: false });
    setQuotes([]);
    setBest(null);
    setPhase("playing");
  };

  const scores = quotes.map((q, i) => scoreSpread(q.low, q.high, rounds[i].value));
  const total = scores.reduce((a, b) => a + b, 0);

  const next = () => {
    if (round + 1 >= rounds.length) {
      setBest(recordBest("fermi", total));
      setPhase("done");
      return;
    }
    setRound(round + 1);
    setLowText("");
    setHighText("");
    setTouched({ low: false, high: false });
  };

  if (phase === "idle") {
    return (
      <div className="flex flex-1 flex-col items-start justify-center">
        <p className="eyebrow">{ROUNDS} questions · Make a market</p>
        <h3 className="mt-4 text-h3">Fermi markets</h3>
        <p className="mt-3 max-w-prose text-body text-ink-2">
          Big-number questions you can reason your way into. Quote a low and a high: a tight spread that catches the answer scores
          most, and a miss scores nothing.
        </p>
        <button type="button" onClick={start} className={`mt-8 ${buttonClasses({ variant: "light", shape: "rounded" })}`}>
          Make a market
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const hits = quotes.filter((q, i) => isHit(q.low, q.high, rounds[i].value)).length;
    // Geometric mean of the width ratios: the typical spread on a log scale.
    const typical = 10 ** (quotes.reduce((sum, q) => sum + Math.log10(q.high / q.low), 0) / quotes.length);
    return (
      <GameResult
        score={String(total)}
        unit={`of ${ROUNDS * MAX_ROUND_SCORE}`}
        detail={`Caught ${hits} of ${ROUNDS} · typical spread ${formatRatio(typical)}`}
        best={best}
        payload={{ game: "fermi", quotes: quotes.map((q, i) => ({ id: rounds[i].id, low: q.low, high: q.high })) }}
        note="Market-making interviews ask exactly this: a range you'd trade on, tight enough to be useful and wide enough to be right. Knowing how sure you are is half the skill."
        onReplay={start}
        cta={cta}
      />
    );
  }

  const low = parseAmount(lowText);
  const high = parseAmount(highText);
  const valid = low !== null && high !== null && low <= high;
  const lowBad = touched.low && lowText.trim() !== "" && low === null;
  const highBad = touched.high && highText.trim() !== "" && high === null;
  const error =
    lowBad || highBad
      ? "Use a number, a decimal or k, m, b, t: 450, 2.5k, 3m, 1.2b."
      : touched.low && touched.high && low !== null && high !== null && low > high
        ? "Low should be at or below high."
        : null;

  const spread = revealed ? quote : valid ? { low, high } : null;
  const domain = revealed
    ? axisDomain([quote.low, quote.high, question.value])
    : axisDomain([low, high].filter((n): n is number => n !== null));

  const lockIn = () => {
    if (valid) setQuotes((q) => [...q, { low, high }]);
    else setTouched({ low: true, high: true });
  };

  // Enter in Low moves on to an empty High; otherwise Enter locks in.
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.currentTarget === lowRef.current && highText.trim() === "") highRef.current?.focus();
    else lockIn();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between text-caption text-ink-3">
        <span className="tabular">
          Question {round + 1} of {rounds.length}
        </span>
        <span className="tabular">{total} points</span>
      </div>

      <p key={question.id} id="fermi-prompt" className="game-enter mt-3 max-w-prose font-display text-h3">
        {question.prompt}
      </p>

      {/* Low, High and the action share one row from 768px, which keeps the tallest state (and so the card) short. */}
      <div className="mt-3 grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_1fr_auto] md:gap-4">
        <label className="flex flex-col">
          <span className="text-caption text-ink-3">Low</span>
          <input
            ref={lowRef}
            value={revealed ? formatAmount(quote.low) : lowText}
            onChange={(e) => setLowText(e.target.value)}
            onKeyDown={onEnter}
            onBlur={() => setTouched((t) => ({ ...t, low: true }))}
            disabled={revealed}
            placeholder="e.g. 200k"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-describedby="fermi-prompt fermi-help"
            aria-invalid={lowBad}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-caption text-ink-3">High</span>
          <input
            ref={highRef}
            value={revealed ? formatAmount(quote.high) : highText}
            onChange={(e) => setHighText(e.target.value)}
            onKeyDown={onEnter}
            onBlur={() => setTouched((t) => ({ ...t, high: true }))}
            disabled={revealed}
            placeholder="e.g. 5m"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-describedby="fermi-prompt fermi-help"
            aria-invalid={highBad}
            className={INPUT_CLASSES}
          />
        </label>
        <div className="col-span-2 md:col-span-1">
          {revealed ? (
            <button ref={nextRef} type="button" onClick={next} className={buttonClasses({ variant: "light", shape: "rounded", className: "w-full md:w-52" })}>
              {round + 1 >= rounds.length ? "See your result" : "Next question"}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={lockIn}
              disabled={!valid}
              // Fixed width: the label changes as you type, and an auto-width column would shift the inputs.
              className={`${buttonClasses({ variant: "light", shape: "rounded", className: "w-full md:w-52" })} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {valid ? `Quote ${formatAmount(low)} – ${formatAmount(high)}` : "Quote spread"}
            </button>
          )}
        </div>
      </div>
      <p id="fermi-help" className="mt-2 min-h-5 text-caption text-ink-3" aria-live="polite">
        {revealed ? null : (error ?? (valid ? `${formatRatio(high / low)} wide` : "Numbers, decimals, or k, m, b, t: 2.5m, 300k, 1.2b."))}
      </p>

      <NumberLine domain={domain} spread={spread} truth={revealed ? question.value : null} hit={revealed ? isHit(quote.low, quote.high, question.value) : null} />

      {revealed ? (
        <div className="game-enter mt-3" aria-live="polite">
          <p className="text-body">
            <span className="font-semibold">{formatAnswer(question)}.</span> <span className="text-ink-2">{question.why}</span>
          </p>
          <p className="mt-1 text-caption text-ink-3 tabular">
            {isHit(quote.low, quote.high, question.value)
              ? `Inside your spread · ${formatRatio(quote.high / quote.low)} wide · ${scores[round]} of ${MAX_ROUND_SCORE} points.`
              : `Your spread was ${formatRatio(missFactor(quote.low, quote.high, question.value))} too ${question.value < quote.low ? "high" : "low"} · 0 points.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type NumberLineProps = {
  domain: Domain;
  spread: Quote | null;
  truth: number | null;
  hit: boolean | null;
};

/**
 * Log-scale line, decorative (the inputs and reveal text carry the same information). Positions are percentages,
 * so a new domain glides everything to its new place via the `fermi-move` transition. A missed spread turns from a
 * filled band to an outline, so hit and miss read without colour.
 */
function NumberLine({ domain, spread, truth, hit }: NumberLineProps) {
  const left = spread ? axisPercent(spread.low, domain) : 0;
  const right = spread ? axisPercent(spread.high, domain) : 0;

  return (
    <div className="relative mx-3 mt-3 h-[4.5rem]" aria-hidden="true">
      <div className="absolute inset-x-0 top-9 h-px bg-rule-strong" />
      {axisTicks(domain).map((exp) => (
        <div
          key={exp}
          className="fermi-move fermi-tick absolute top-9 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${axisPercent(10 ** exp, domain)}%` }}
        >
          <span className="h-2 w-px bg-rule-strong" />
          <span className="mt-1.5 whitespace-nowrap text-caption text-ink-3 tabular">{tickLabel(exp)}</span>
        </div>
      ))}
      {spread ? (
        <div
          className={`fermi-move absolute top-[1.875rem] h-3 -translate-x-1.5 rounded-full ${hit === false ? "border border-bone" : "bg-bone"}`}
          style={{ left: `${left}%`, width: `calc(${right - left}% + 0.75rem)` }}
        />
      ) : null}
      {truth !== null ? (
        <div className="fermi-truth absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${axisPercent(truth, domain)}%` }}>
          <span className="whitespace-nowrap text-caption font-semibold text-bone tabular">{formatAmount(truth)}</span>
          {/* A graphite outline keeps the stem visible where it crosses a filled (hit) band. */}
          <span className="mt-0.5 h-6 w-0.5 rounded-full bg-bone shadow-[0_0_0_2px_var(--color-graphite)]" />
        </div>
      ) : null}
    </div>
  );
}
