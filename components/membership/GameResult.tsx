"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { buttonClasses } from "@/components/Button";
import type { BestScore } from "@/lib/games/best-score";

type GameResultProps = {
  /** The headline figure, e.g. "14" or "412". */
  score: string;
  /** What the figure means, e.g. "correct in 60 seconds". */
  unit: string;
  detail?: string;
  best: BestScore | null;
  /** Ties the game to interviews and the club; one calm sentence or two. */
  note: string;
  onReplay: () => void;
  /** Interview and Apply links, rendered on the server (Games.tsx). */
  cta: ReactNode;
};

/** End-of-game panel shared by both games: score, best, a note on interviews, then the way in. */
export function GameResult({ score, unit, detail, best, note, onReplay, cta }: GameResultProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Keyboard and screen-reader users land on the result instead of a vanished input.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} tabIndex={-1} className="flex flex-1 flex-col justify-center outline-none" aria-labelledby="game-result-score">
      <p className="eyebrow">Result</p>
      <p id="game-result-score" className="mt-4 flex flex-wrap items-baseline gap-x-3">
        <span className="text-display tabular">{score}</span>
        <span className="text-lead text-ink-2">{unit}</span>
      </p>
      <p className="mt-3 text-caption text-ink-3">
        {detail ? <>{detail} · </> : null}
        {best ? (best.isNew ? "A new best in this browser." : `Best in this browser: ${best.best}.`) : null}
      </p>
      <p className="mt-6 max-w-prose text-body text-ink-2">{note}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {cta}
        <button type="button" onClick={onReplay} className={buttonClasses({ variant: "light-outline", shape: "rounded" })}>
          Play again
        </button>
      </div>
    </div>
  );
}
