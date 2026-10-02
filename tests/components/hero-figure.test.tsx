import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroFigure, INITIAL_SEED } from "@/components/home/HeroFigure";

const caption = "Fig. 1 — Five random walks from one origin.";
const walkPaths = (container: HTMLElement) => Array.from(container.querySelectorAll("svg.draw-in path"), (p) => p.getAttribute("d"));

describe("HeroFigure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders five decorative walks and the ±σ√t band with a real caption", () => {
    const { container } = render(<HeroFigure caption={caption} />);
    expect(walkPaths(container)).toHaveLength(5);
    expect(container.querySelector("svg.envelope-in path")).not.toBeNull();
    container.querySelectorAll("svg").forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));
    expect(screen.getByRole("figure")).toHaveTextContent(caption);
    expect(screen.getByText(`Seed ${INITIAL_SEED}`)).toHaveAttribute("aria-live", "polite");
  });

  it("re-draws new paths and announces the new seed", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { container } = render(<HeroFigure caption={caption} />);
    const before = walkPaths(container);

    await userEvent.click(screen.getByRole("button", { name: "Draw new paths" }));

    expect(screen.getByText("Seed 5500")).toBeInTheDocument();
    expect(walkPaths(container)).not.toEqual(before);
  });

  it("shows the crosshair readout for a mouse and hides it on leave", () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const { container } = render(<HeroFigure caption={caption} />);
    const plot = container.querySelector("figure > div") as HTMLElement;
    vi.spyOn(plot, "getBoundingClientRect").mockReturnValue({ left: 0, width: 960 } as DOMRect);

    fireEvent.pointerMove(plot, { clientX: 480, pointerType: "mouse" });
    expect(screen.getByText("t = 48")).toBeInTheDocument();

    fireEvent.pointerLeave(plot);
    expect(screen.queryByText(/^t = /)).toBeNull();
  });

  it("ignores touch for the crosshair", () => {
    const { container } = render(<HeroFigure caption={caption} />);
    const plot = container.querySelector("figure > div") as HTMLElement;
    fireEvent.pointerMove(plot, { clientX: 100, pointerType: "touch" });
    expect(screen.queryByText(/^t = /)).toBeNull();
  });
});
