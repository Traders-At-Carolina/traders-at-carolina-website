import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BitSurface } from "@/components/home/BitSurface";
import { MARKET_REGIMES } from "@/lib/vol-surface";

const params = MARKET_REGIMES[0].params;

/** jsdom has no 2D context; the component must bail out of drawing quietly instead of throwing. */
function renderSurface() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const onInteractStart = vi.fn();
  const onInteractEnd = vi.fn();
  render(<BitSurface params={params} animate label="Calm market. Implied volatility surface." onInteractStart={onInteractStart} onInteractEnd={onInteractEnd} />);
  return { figure: screen.getByRole("img"), onInteractStart, onInteractEnd };
}

afterEach(() => vi.restoreAllMocks());

describe("BitSurface", () => {
  it("is one focusable image named for the market, with a decorative canvas inside", () => {
    const { figure } = renderSurface();
    expect(figure).toHaveAccessibleName("Calm market. Implied volatility surface. Use the left and right arrow keys to rotate.");
    expect(figure).toHaveAttribute("tabindex", "0");
    const canvas = figure.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("carries small axis labels that assistive tech skips", () => {
    const { figure } = renderSurface();
    for (const text of ["Strike K/S", "Maturity", "Implied vol", "1.0", "2Y", "60%"]) {
      const label = Array.from(figure.querySelectorAll("span")).find((el) => el.textContent === text);
      expect(label).toBeDefined();
      expect(label).toHaveAttribute("aria-hidden", "true");
    }
    expect(figure).toHaveAccessibleName(/^Calm market\./);
  });

  it("lets vertical swipes scroll the page on touch screens", () => {
    const { figure } = renderSurface();
    expect(figure).toHaveClass("touch-pan-y");
  });

  it("rotates with the left and right arrow keys, reporting the interaction, and ignores other keys", () => {
    const { figure, onInteractStart, onInteractEnd } = renderSurface();
    fireEvent.keyDown(figure, { key: "ArrowRight" });
    fireEvent.keyDown(figure, { key: "ArrowLeft" });
    expect(onInteractStart).toHaveBeenCalledTimes(2);
    expect(onInteractEnd).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(figure, { key: "ArrowUp" });
    fireEvent.keyDown(figure, { key: "Enter" });
    expect(onInteractStart).toHaveBeenCalledTimes(2);
  });

  it("pauses the spin for a drag and hands it back when the drag ends", () => {
    const { figure, onInteractStart, onInteractEnd } = renderSurface();
    fireEvent.pointerDown(figure, { pointerId: 1, button: 0, pointerType: "mouse", clientX: 10, clientY: 10 });
    expect(onInteractStart).toHaveBeenCalledTimes(1);
    fireEvent.pointerMove(figure, { pointerId: 1, pointerType: "mouse", clientX: 60, clientY: 20 });
    expect(onInteractEnd).not.toHaveBeenCalled();
    fireEvent.pointerUp(figure, { pointerId: 1, pointerType: "mouse" });
    expect(onInteractEnd).toHaveBeenCalledTimes(1);
  });

  it("treats hovering as a spotlight only: it never pauses the spin", () => {
    const { figure, onInteractStart } = renderSurface();
    fireEvent.pointerMove(figure, { pointerId: 1, pointerType: "mouse", clientX: 30, clientY: 30 });
    fireEvent.pointerLeave(figure, { pointerId: 1, pointerType: "mouse" });
    expect(onInteractStart).not.toHaveBeenCalled();
  });
});
