import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { VolSurfaceFigure } from "@/components/home/VolSurfaceFigure";

// The WebGL canvas itself is mocked out; these tests cover the poster, captions and the regime cycle.
vi.mock("@/components/home/VolSurfaceCanvas", () => ({ default: () => null }));

const caption = "Fig. 1 — An implied volatility surface.";

/** An IntersectionObserver that reports the figure as visible immediately. */
function figureInView() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      disconnect() {}
    },
  );
}

describe("VolSurfaceFigure", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts on the first market with the static poster and no controls", () => {
    const { container } = render(<VolSurfaceFigure caption={caption} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByRole("figure")).toHaveTextContent(caption);
    expect(screen.getByText("Calm market")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Calm market (showing)")).toBeInTheDocument();
  });

  it("moves on to the next market by itself while visible", () => {
    vi.useFakeTimers();
    figureInView();
    render(<VolSurfaceFigure caption={caption} />);

    act(() => vi.advanceTimersByTime(4500 + 2600 + 100));

    expect(screen.getByText("Sell-off")).toBeInTheDocument();
    expect(screen.getByText("Sell-off (showing)")).toBeInTheDocument();
  });

  it("stays on one market under reduced motion", () => {
    vi.useFakeTimers();
    figureInView();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    render(<VolSurfaceFigure caption={caption} />);

    act(() => vi.advanceTimersByTime(20000));

    expect(screen.getByText("Calm market")).toBeInTheDocument();
    expect(screen.getByText(/prefers reduced motion/)).toBeInTheDocument();
  });
});
