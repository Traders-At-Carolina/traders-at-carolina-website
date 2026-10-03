import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GameCard } from "@/components/membership/GameCard";
import { GameResult } from "@/components/membership/GameResult";
import { Games } from "@/components/membership/Games";
import { SPRINT_MS } from "@/lib/games/mental-math";
import { ROUNDS } from "@/lib/games/fermi";

const cta = <a href="/apply#process">See how interviews work</a>;

const solve = (prompt: string) => {
  const [a, b] = prompt.split(/ [+−×÷] /).map(Number);
  if (prompt.includes("+")) return a + b;
  if (prompt.includes("−")) return a - b;
  if (prompt.includes("×")) return a * b;
  return a / b;
};

// No server in tests: saves fail soft unless a test stubs a response.
const fetchMock = vi.fn();
beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("GameCard tabs", () => {
  it("starts on the sprint and moves between games with the arrow keys", () => {
    render(<GameCard cta={cta} />);
    const [sprint, fermi] = screen.getAllByRole("tab");
    expect(sprint).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Mental math sprint");

    fireEvent.keyDown(sprint, { key: "ArrowRight" });
    expect(fermi).toHaveAttribute("aria-selected", "true");
    expect(fermi).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Fermi markets" })).toBeInTheDocument();

    fireEvent.keyDown(fermi, { key: "ArrowRight" });
    expect(sprint).toHaveAttribute("aria-selected", "true");
  });
});

describe("Mental math sprint", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("advances on a correct answer without Enter and ends on the result after 120 seconds", () => {
    render(<GameCard cta={cta} />);
    fireEvent.click(screen.getByRole("button", { name: "Start the sprint" }));

    const input = screen.getByRole("textbox", { name: "Answer" });
    const first = document.getElementById("sprint-prompt")!.textContent!.replace(/ =$/, "");
    fireEvent.change(input, { target: { value: String(solve(first)) } });
    expect(screen.getByText("1 correct")).toBeInTheDocument();
    expect(input).toHaveValue("");

    // A wrong answer on Enter is cleared with a hint, and doesn't count.
    fireEvent.change(input, { target: { value: "-1" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText("Not quite. Try again or skip.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(SPRINT_MS + 200));
    expect(screen.getByText("correct in 120 seconds")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See how interviews work" })).toHaveAttribute("href", "/apply#process");
    expect(window.localStorage.getItem("tac:games:sprint")).toBe("1");
  });
});

describe("Fermi markets", () => {
  const low = () => screen.getByRole("textbox", { name: "Low" });
  const high = () => screen.getByRole("textbox", { name: "High" });

  it("quotes spreads, scores hits by width and misses at zero, then totals three rounds", () => {
    render(<GameCard cta={cta} />);
    fireEvent.click(screen.getByRole("tab", { name: "Fermi markets" }));
    fireEvent.click(screen.getByRole("button", { name: "Make a market" }));

    // Can't quote until both sides read as numbers, low ≤ high.
    expect(screen.getByRole("button", { name: "Quote spread" })).toBeDisabled();
    // Half-typed values don't flag; errors show once the field is left.
    fireEvent.change(low(), { target: { value: "2." } });
    expect(screen.queryByText(/Use a number/)).not.toBeInTheDocument();
    fireEvent.change(low(), { target: { value: "abc" } });
    expect(screen.queryByText(/Use a number/)).not.toBeInTheDocument();
    fireEvent.blur(low());
    expect(screen.getByText("Use a number, a decimal or k, m, b, t: 450, 2.5k, 3m, 1.2b.")).toBeInTheDocument();
    fireEvent.change(low(), { target: { value: "5m" } });
    fireEvent.change(high(), { target: { value: "2.5m" } });
    fireEvent.blur(high());
    expect(screen.getByText("Low should be at or below high.")).toBeInTheDocument();

    // Round 1: a spread wide enough to catch any answer in the bank.
    fireEvent.change(low(), { target: { value: "1" } });
    fireEvent.change(high(), { target: { value: "1e70" } });
    fireEvent.click(screen.getByRole("button", { name: /^Quote 1 – / }));
    expect(screen.getByText(/Inside your spread · .* wide · 5 of 100 points\./)).toBeInTheDocument();
    expect(low()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    // Round 2: every answer is at least 100, so 1–2 misses low.
    fireEvent.change(low(), { target: { value: "1" } });
    fireEvent.change(high(), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Quote 1 – 2" }));
    expect(screen.getByText(/Your spread was .+× too low · 0 points\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    // Round 3 by keyboard: Enter in Low moves to High, Enter in High locks in.
    fireEvent.change(low(), { target: { value: "1" } });
    fireEvent.keyDown(low(), { key: "Enter" });
    expect(high()).toHaveFocus();
    fireEvent.change(high(), { target: { value: "1e70" } });
    fireEvent.keyDown(high(), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "See your result" }));

    expect(screen.getByText(`of ${ROUNDS * 100}`)).toBeInTheDocument();
    expect(screen.getByText(/Caught 2 of 3 · typical spread/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See how interviews work" })).toBeInTheDocument();
    expect(window.localStorage.getItem("tac:games:fermi")).toBe("10");
  });
});

describe("Games section", () => {
  it("is a graphite band with the game card and no side note", () => {
    render(<Games index={3} title="Two short problems, before you apply." />);
    const region = screen.getByRole("region", { name: "Two short problems, before you apply." });
    expect(region).toHaveAttribute("data-tone", "graphite");
    expect(screen.getByText("§ 03 — Try a problem")).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Mini games" })).toBeInTheDocument();
    expect(screen.queryByText("In the interview")).not.toBeInTheDocument();
  });
});

describe("Saving a result", () => {
  const saved = (overrides: Record<string, unknown>) =>
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ scoreId: 11, score: 45, best: 45, newBest: false, signedIn: false, askName: false, ...overrides }), { status: 200 }),
    );
  const renderResult = () =>
    render(
      <GameResult
        score="45"
        unit="correct in 120 seconds"
        best={{ best: 45, isNew: false }}
        payload={{ game: "sprint", correct: 45, skipped: 0 }}
        note="The interview note."
        onReplay={() => {}}
        cta={cta}
      />,
    );

  it("posts the play once and offers sign-in when signed out", async () => {
    saved({});
    renderResult();
    expect(await screen.findByRole("link", { name: /Sign in to keep your scores/ })).toHaveAttribute("href", expect.stringContaining("/account/sign-in"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/games/scores");
    expect(JSON.parse(init.body)).toMatchObject({ game: "sprint", correct: 45, skipped: 0, playerId: expect.any(String) });
    expect(screen.getByText("The interview note.")).toBeInTheDocument();
  });

  it("says it's on the account when signed in", async () => {
    saved({ signedIn: true, newBest: true });
    renderResult();
    expect(await screen.findByText("Saved to your account.")).toBeInTheDocument();
    expect(screen.getByText("A new personal best.")).toBeInTheDocument();
  });

  it("asks a signed-out top scorer for a name in place of the note, and sends it", async () => {
    saved({ askName: true });
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    renderResult();
    fireEvent.change(await screen.findByRole("textbox", { name: "Name" }), { target: { value: "Alex" } });
    expect(screen.queryByText("The interview note.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/Thanks, Alex\./)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/games/contact");
    expect(JSON.parse(init.body)).toMatchObject({ scoreId: 11, name: "Alex", email: "" });
  });

  it("lets them decline, bringing the note back", async () => {
    saved({ askName: true });
    renderResult();
    fireEvent.click(await screen.findByRole("button", { name: "No thanks" }));
    expect(screen.getByText("The interview note.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();
  });

  it("falls back to this browser's best when the server can't be reached", async () => {
    renderResult();
    expect(await screen.findByText(/kept in this browser only/)).toBeInTheDocument();
    expect(screen.getByText("Best in this browser: 45.")).toBeInTheDocument();
  });
});

describe("Claiming history after sign-in", () => {
  it("claims once on ?claim=1 and removes the param", async () => {
    window.history.replaceState(null, "", "/membership?claim=1#games");
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<GameCard cta={cta} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/games/claim", expect.anything()));
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#games");
    window.history.replaceState(null, "", "/");
  });
});
