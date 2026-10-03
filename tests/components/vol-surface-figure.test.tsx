import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { VolSurfaceFigure } from "@/components/home/VolSurfaceFigure";

// The bit canvas is replaced by a stand-in that exposes its accessible label.
vi.mock("@/components/home/BitSurface", () => ({
  BitSurface: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
}));

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

  it("shows the surface and its live numbers, with no caption and no controls", () => {
    const { container } = render(<VolSurfaceFigure />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^Calm market\. Implied volatility surface/);
    expect(container.querySelector("figcaption")).toBeNull();
    expect(screen.getByRole("figure")).not.toHaveTextContent(/Fig\. 1/);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    // Calm market: ATM 16% at 1Y, term slope +0.2 → 13.6% at 3M and 19.2% at 2Y.
    expect(screen.getByText("13.6 / 16.0 / 19.2%")).toBeInTheDocument();
    expect(screen.getByText(/pts$/)).toBeInTheDocument();
  });

  it("ends with the live numbers, directly under the plot", () => {
    render(<VolSurfaceFigure />);
    const children = Array.from(screen.getByRole("figure").children);
    expect(children).toHaveLength(2);
    const [plot, numbers] = children;
    expect(plot.querySelector("[role='img']")).not.toBeNull();
    expect(numbers).toHaveTextContent("Calm market");
    expect(numbers).toHaveTextContent("13.6 / 16.0 / 19.2%");
    expect(numbers).toHaveClass("border-t");
  });

  it("moves on to the next market by itself while visible", () => {
    vi.useFakeTimers();
    figureInView();
    render(<VolSurfaceFigure />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^Calm market\./);

    act(() => vi.advanceTimersByTime(5000 + 2600 + 100));

    expect(screen.getByRole("img")).toHaveAccessibleName(/^Sell-off\./);
  });

  it("stays on one market under reduced motion", () => {
    vi.useFakeTimers();
    figureInView();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    render(<VolSurfaceFigure />);

    act(() => vi.advanceTimersByTime(20000));

    expect(screen.getByRole("img")).toHaveAccessibleName(/^Calm market\./);
  });
});
