"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { FermiMarket } from "@/components/membership/FermiMarket";
import { MathSprint } from "@/components/membership/MathSprint";
import { claimHistory } from "@/lib/games/save-score";

const GAMES = [
  { id: "sprint", label: "Mental math sprint" },
  { id: "fermi", label: "Fermi markets" },
] as const;

type GameId = (typeof GAMES)[number]["id"];

/**
 * Two games behind one tablist (spec 03 §3.7), styled as a segmented control: a bone pill slides under the active tab.
 * Switching remounts the panel, which resets the game you left and fades the new one in.
 */
export function GameCard({ cta }: { cta: ReactNode }) {
  const [active, setActive] = useState<GameId>("sprint");
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = GAMES.findIndex((g) => g.id === active);

  // Back from sign-in (?claim=1): move this browser's anonymous scores onto the account, then tidy the URL.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("claim") !== "1") return;
    url.searchParams.delete("claim");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    void claimHistory();
  }, []);

  // Roving focus with automatic activation (WAI-ARIA tabs pattern).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: GAMES.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = (moves[e.key] + GAMES.length) % GAMES.length;
    setActive(GAMES[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div className="rounded-[1rem] border border-rule bg-bone/5">
      <div className="p-2 md:p-3">
        <div role="tablist" aria-label="Mini games" onKeyDown={onKeyDown} className="relative grid grid-cols-2 rounded-[0.75rem] bg-black/25 p-1">
          <span
            aria-hidden="true"
            className="game-tab-indicator absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[0.625rem] bg-bone"
            style={{ transform: `translateX(${index * 100}%)` }}
          />
          {GAMES.map((game, i) => {
            const selected = game.id === active;
            return (
              <button
                key={game.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`game-tab-${game.id}`}
                aria-selected={selected}
                aria-controls={`game-panel-${game.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(game.id)}
                className={`game-tab relative min-h-11 rounded-[0.625rem] px-3 text-center text-nav font-semibold ${selected ? "text-graphite" : "text-ink-3 hover:text-bone"}`}
              >
                {game.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        key={active}
        role="tabpanel"
        id={`game-panel-${active}`}
        aria-labelledby={`game-tab-${active}`}
        // Fixed to the tallest state (a Fermi round with its answer revealed) at each breakpoint, so the card never
        // changes height between tabs, rounds or results; shorter states lay themselves out to fill it. Below
        // 1280px the card is narrower and the longest prompts wrap more; from 1280px the section fits within 720px.
        className="game-enter flex min-h-[39rem] flex-col px-5 pt-4 pb-6 md:min-h-[33rem] md:px-8 md:pt-5 md:pb-7 xl:min-h-[31rem]"
      >
        {active === "sprint" ? <MathSprint cta={cta} /> : <FermiMarket cta={cta} />}
      </div>
    </div>
  );
}
