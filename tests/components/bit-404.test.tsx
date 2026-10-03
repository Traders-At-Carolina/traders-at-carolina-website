import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";
import { Bit404 } from "@/components/notfound/Bit404";

vi.mock("@/lib/data/public", async () => ({
  getPlacements: async () => ({ firms: [], wall: [] }),
  getRecruiting: async () => (await import("@/content/site")).site.recruiting,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => vi.restoreAllMocks());

describe("Bit404", () => {
  it("renders a decorative canvas that assistive tech skips", () => {
    // jsdom has no 2D context; the component must bail out quietly instead of throwing.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<Bit404 />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("role", "presentation");
    expect(canvas).not.toHaveAttribute("tabindex");
  });

  it("takes the height its flex column leaves, within a floor and a cap, so CSS sizes it before it draws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<Bit404 />);
    const classes = container.querySelector("canvas")?.className.split(/\s+/) ?? [];
    expect(classes).toEqual(expect.arrayContaining(["flex-1", "h-0", "min-h-36", "max-h-[min(28rem,62vw)]", "[contain:size]"]));
  });

  it("does not block vertical scrolling on touch", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<Bit404 />);
    expect(container.querySelector("canvas")?.className).toContain("touch-pan-y");
  });

  it("removes its window listeners when it unmounts", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Bit404 />);
    unmount();
    const added = add.mock.calls.map(([type]) => type);
    const removed = remove.mock.calls.map(([type]) => type);
    for (const type of added) expect(removed).toContain(type);
  });
});

describe("NotFound", () => {
  it("fits the whole 404 section in one screen below the header", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(await NotFound());
    const section = screen.getByRole("main").querySelector("canvas.bit-404")?.parentElement;
    expect(section?.className).toMatch(/\bflex\b.*\bflex-col\b/);
    expect(section?.className).toContain("min-h-[calc(100svh-4rem)]");
    expect(section?.className).toContain("md:min-h-[calc(100svh-5rem)]");
  });

  it("shows the eyebrow, the bit figure, the heading, the lead and the way home, in that order", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(await NotFound());
    const main = screen.getByRole("main");
    const eyebrow = within(main).getByText("Error 404");
    const figure = main.querySelector("canvas.bit-404");
    const heading = within(main).getByRole("heading", { level: 1, name: "This page isn't here." });
    const lead = within(main).getByText(/The link may be out of date/);
    const home = within(main).getByRole("link", { name: /Back to the home page/ });
    expect(home).toHaveAttribute("href", "/");
    expect(figure).not.toBeNull();
    const sequence = [eyebrow, figure!, heading, lead, home];
    for (let i = 1; i < sequence.length; i++) {
      expect(sequence[i - 1].compareDocumentPosition(sequence[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
