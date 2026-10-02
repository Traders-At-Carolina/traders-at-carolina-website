import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTRO_DURATION_MS, introScript } from "@/lib/intro";

const html = document.documentElement;

/** Runs the head script as the browser would, on a page at `pathname`. */
function run(pathname = "/", { reducedMotion = false } = {}) {
  window.history.replaceState(null, "", pathname);
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) => ({ matches: reducedMotion && query.includes("reduce") }) as MediaQueryList,
  );
  new Function(introScript)();
}

describe("intro head script", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    html.className = "";
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("plays when the home page loads", () => {
    run("/");
    expect(html).toHaveClass("intro");
  });

  it("plays again on every reload", () => {
    run("/");
    vi.runAllTimers();
    expect(html).not.toHaveClass("intro");
    run("/");
    expect(html).toHaveClass("intro");
  });

  it("never plays on other pages", () => {
    for (const path of ["/team", "/about", "/apply"]) {
      run(path);
      expect(html).not.toHaveClass("intro");
    }
  });

  it("skips under reduced motion", () => {
    run("/", { reducedMotion: true });
    expect(html).not.toHaveClass("intro");
  });

  it("removes itself once the timeline ends", () => {
    run("/");
    vi.advanceTimersByTime(INTRO_DURATION_MS - 1);
    expect(html).toHaveClass("intro");
    vi.advanceTimersByTime(1000);
    expect(html).not.toHaveClass("intro");
  });

  it.each([
    ["a key press", () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))],
    ["a click", () => window.dispatchEvent(new Event("pointerdown"))],
    ["a scroll", () => window.dispatchEvent(new Event("wheel"))],
  ])("skips to a quick fade on %s", (_, act) => {
    run("/");
    act();
    expect(html).toHaveClass("intro-skip");
    vi.advanceTimersByTime(300);
    expect(html).not.toHaveClass("intro");
    expect(html).not.toHaveClass("intro-skip");
  });
});
