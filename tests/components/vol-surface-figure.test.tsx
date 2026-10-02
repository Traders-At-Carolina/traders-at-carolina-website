import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { VolSurfaceFigure } from "@/components/home/VolSurfaceFigure";

// The WebGL canvas is replaced by a stand-in that exposes its accessible label.
vi.mock("@/components/home/VolSurfaceCanvas", () => ({
  default: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
}));

const caption = "Fig. 1 — Implied volatility across strike and maturity.";

/** Renders the figure and waits for the lazily imported canvas to mount. */
async function renderLoaded() {
  render(<VolSurfaceFigure caption={caption} />);
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

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

  it("shows the surface, its live numbers and a caption, with no controls", () => {
    const { container } = render(<VolSurfaceFigure caption={caption} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByRole("figure")).toHaveTextContent(caption);
    expect(container.querySelector("figcaption")?.textContent).toBe(caption);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    // Calm market: ATM 16% at 1Y, term slope +0.2 → 13.6% at 3M and 19.2% at 2Y.
    expect(screen.getByText("13.6 / 16.0 / 19.2%")).toBeInTheDocument();
    expect(screen.getByText(/pts$/)).toBeInTheDocument();
  });

  it("moves on to the next market by itself while visible", async () => {
    vi.useFakeTimers();
    figureInView();
    await renderLoaded();
    expect(screen.getByRole("img")).toHaveAccessibleName(/^Calm market\./);

    act(() => vi.advanceTimersByTime(5000 + 2600 + 100));

    expect(screen.getByRole("img")).toHaveAccessibleName(/^Sell-off\./);
  });

  it("stays on one market under reduced motion", async () => {
    vi.useFakeTimers();
    figureInView();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    await renderLoaded();

    act(() => vi.advanceTimersByTime(20000));

    expect(screen.getByRole("img")).toHaveAccessibleName(/^Calm market\./);
  });
});
