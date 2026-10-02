import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VolSurfaceFigure } from "@/components/home/VolSurfaceFigure";

// The WebGL canvas only mounts once an IntersectionObserver fires, which never happens in jsdom;
// these tests cover the poster, controls and simulation state around it.
const caption = "Fig. 1 — An implied volatility surface.";

describe("VolSurfaceFigure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the static poster, caption and default regime", () => {
    const { container } = render(<VolSurfaceFigure caption={caption} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByRole("figure")).toHaveTextContent(caption);
    expect(screen.getByText("Default regime")).toHaveAttribute("aria-live", "polite");
  });

  it("updates the readout when a slider moves", () => {
    render(<VolSurfaceFigure caption={caption} />);
    const atm = screen.getByLabelText("ATM vol");
    expect(atm).toHaveValue("0.24");
    fireEvent.change(atm, { target: { value: "0.4" } });
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("draws a new regime with its seed", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<VolSurfaceFigure caption={caption} />);
    const skewBefore = (screen.getByLabelText("Skew ρ") as HTMLInputElement).value;

    await userEvent.click(screen.getByRole("button", { name: "New regime" }));

    expect(screen.getByText("Regime 5500")).toBeInTheDocument();
    expect((screen.getByLabelText("Skew ρ") as HTMLInputElement).value).not.toBe(skewBefore);
  });

  it("toggles play with aria-pressed", async () => {
    render(<VolSurfaceFigure caption={caption} />);
    const play = screen.getByRole("button", { name: "Play market" });
    expect(play).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(play);
    expect(screen.getByRole("button", { name: "Pause market" })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables play under reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    render(<VolSurfaceFigure caption={caption} />);
    expect(screen.getByRole("button", { name: "Play market" })).toBeDisabled();
    expect(screen.getByText(/prefers reduced motion/)).toBeInTheDocument();
  });
});
