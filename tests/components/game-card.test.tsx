import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { GameCard } from "@/components/membership/GameCard";
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

beforeEach(() => window.localStorage.clear());

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
    expect(screen.getByRole("button", { name: "Quote your spread" })).toBeDisabled();
    fireEvent.change(low(), { target: { value: "abc" } });
    expect(screen.getByText("Try a number like 250k, 3.5m or 2e9.")).toBeInTheDocument();
    fireEvent.change(low(), { target: { value: "5m" } });
    fireEvent.change(high(), { target: { value: "2m" } });
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
