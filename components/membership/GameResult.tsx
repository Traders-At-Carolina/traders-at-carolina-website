"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/Button";
import { TextLink } from "@/components/TextLink";
import type { BestScore } from "@/lib/games/best-score";
import { SIGN_IN_HREF, type SaveResult, type ScorePayload, saveContact, saveScore } from "@/lib/games/save-score";

type GameResultProps = {
  /** The headline figure, e.g. "14" or "412". */
  score: string;
  /** What the figure means, e.g. "correct in 120 seconds". */
  unit: string;
  detail?: string;
  /** This browser's best, shown until the server answers or if it can't be reached. */
  best: BestScore | null;
  /** What gets saved; the server rescores Fermi from the quotes. */
  payload: ScorePayload;
  /** Ties the game to interviews and the club; one calm sentence or two. */
  note: string;
  onReplay: () => void;
  /** Interview and Apply links, rendered on the server (Games.tsx). */
  cta: ReactNode;
};

type Save = { status: "saving" } | { status: "saved"; result: SaveResult } | { status: "offline" };

/**
 * End-of-game panel shared by both games (spec 03 §3.7): score, best, save status, a note on interviews, then the
 * way in. Saves the play once on mount. A signed-out top-10% score swaps the note for a name prompt, so the card
 * keeps its fixed height.
 */
export function GameResult({ score, unit, detail, best, payload, note, onReplay, cta }: GameResultProps) {
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [save, setSave] = useState<Save>({ status: "saving" });
  const [promptOpen, setPromptOpen] = useState(true);

  // Keyboard and screen-reader users land on the result instead of a vanished input.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Once per result, even under Strict Mode's double effects.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    saveScore(payload).then((result) => setSave(result ? { status: "saved", result } : { status: "offline" }));
  }, [payload]);

  const saved = save.status === "saved" ? save.result : null;
  const bestText = saved
    ? saved.newBest
      ? "A new personal best."
      : `Personal best: ${saved.best}.`
    : best
      ? best.isNew
        ? "A new best in this browser."
        : `Best in this browser: ${best.best}.`
      : null;
  const asking = Boolean(saved?.askName) && promptOpen;

  return (
    <div ref={ref} tabIndex={-1} className="flex flex-1 flex-col justify-center outline-none" aria-labelledby="game-result-score">
      <p className="eyebrow">Result</p>
      <p id="game-result-score" className="mt-4 flex flex-wrap items-baseline gap-x-3">
        <span className="text-display tabular">{score}</span>
        <span className="text-lead text-ink-2">{unit}</span>
      </p>
      <p className="mt-3 text-caption text-ink-3">
        {detail ? <>{detail} · </> : null}
        {bestText}
      </p>
      <p className="mt-1 min-h-5 text-caption text-ink-3" aria-live="polite">
        {save.status === "saving" ? "Saving your score…" : null}
        {save.status === "offline" ? "Couldn't reach the server, so this score is kept in this browser only." : null}
        {saved?.signedIn ? "Saved to your account." : null}
        {saved && !saved.signedIn ? (
          <>
            Saved.{" "}
            <TextLink href={SIGN_IN_HREF} arrow track={{ cta: "game-sign-in", placement: "membership-games" }}>
              Sign in to keep your scores with an account
            </TextLink>
          </>
        ) : null}
      </p>
      {asking && saved ? (
        <NamePrompt scoreId={saved.scoreId} onDismiss={() => setPromptOpen(false)} />
      ) : (
        <p className="mt-5 max-w-prose text-body text-ink-2">{note}</p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {cta}
        <button type="button" onClick={onReplay} className={buttonClasses({ variant: "light-outline", shape: "rounded" })}>
          Play again
        </button>
      </div>
    </div>
  );
}

const FIELD = "min-h-11 min-w-0 flex-1 basis-40 rounded-[0.625rem] border border-rule-strong bg-black/20 px-3 text-body outline-none transition-colors duration-150 placeholder:text-ink-3/70 focus:border-bone";

/** Name (required) and email (optional) after a top score; officers see them in /admin/games. */
function NamePrompt({ scoreId, onDismiss }: { scoreId: number; onDismiss: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"open" | "sending" | "sent" | "error">("open");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setState("sending");
    setState((await saveContact(scoreId, name.trim(), email.trim())) ? "sent" : "error");
  };

  if (state === "sent") {
    return <p className="game-enter mt-5 max-w-prose text-body text-ink-2">Thanks, {name.trim()}. Officers may be in touch about recruiting.</p>;
  }

  return (
    <form onSubmit={submit} className="game-enter mt-5 max-w-prose" aria-labelledby="game-name-prompt">
      <p id="game-name-prompt" className="text-body">
        That&apos;s a top-10% score. Leave your name and officers may reach out about recruiting.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" placeholder="Name" aria-label="Name" className={FIELD} />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          maxLength={254}
          autoComplete="email"
          placeholder="Email (optional)"
          aria-label="Email (optional)"
          className={FIELD}
        />
        <button type="submit" disabled={state === "sending"} className={buttonClasses({ variant: "light", shape: "rounded", size: "compact" })}>
          Save
        </button>
        <button type="button" onClick={onDismiss} className="min-h-11 px-2 text-caption text-ink-3 underline-offset-4 hover:text-bone hover:underline">
          No thanks
        </button>
      </div>
      {state === "error" ? <p className="mt-2 text-caption text-ink-3">Couldn&apos;t save that. Check the email and try again.</p> : null}
    </form>
  );
}
