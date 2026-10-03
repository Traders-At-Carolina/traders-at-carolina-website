import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DepthChart } from "@/components/membership/DepthChart";

const realIO = globalThis.IntersectionObserver;
const realMatchMedia = window.matchMedia;

/** Every observed element is reported on screen straight away. */
class OnScreen {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const reduceMotion = (reduce: boolean) => {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
};

const heights = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-layer="bars"] rect')).map((r) => Number(r.getAttribute("height")));

describe("DepthChart", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    globalThis.IntersectionObserver = OnScreen as unknown as typeof IntersectionObserver;
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.IntersectionObserver = realIO;
    window.matchMedia = realMatchMedia;
    vi.restoreAllMocks();
  });

  /** Runs queued frames `ms` apart for `count` frames. */
  const play = (count: number, ms = 16) => {
    let now = 0;
    for (let n = 0; n < count; n++) {
      const queued = frames;
      frames = [];
      act(() => queued.forEach((cb) => cb((now += ms))));
    }
  };

  it("shows the full static book under reduced motion, without animating", () => {
    reduceMotion(true);
    const { container } = render(<DepthChart seed={303} />);
    const root = container.querySelector(".depth-chart") as HTMLElement;
    expect(root).toHaveAttribute("data-ready");
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(heights(root).every((h) => h > 0)).toBe(true);
  });

  it("draws the full book in (no rising bars), then keeps trading", () => {
    reduceMotion(false);
    const { container } = render(<DepthChart seed={303} />);
    const root = container.querySelector(".depth-chart") as HTMLElement;
    // Ready starts the CSS draw-in; the book itself is complete from the first frame.
    expect(root).toHaveAttribute("data-ready");
    root.querySelectorAll("[data-layer=\"curves\"] path").forEach((p) => expect(p.getAttribute("clip-path")).toMatch(/-pen\)$/));
    const built = heights(root);
    expect(built.every((h) => h > 0)).toBe(true);

    // Nothing moves while the line is being drawn.
    play(80);
    expect(heights(root)).toEqual(built);

    // Idle ticks then move it and print fills at the touch.
    play(600);
    expect(heights(root)).not.toEqual(built);
    expect(container.querySelector('[data-layer="pulse"]')).not.toBeNull();
  });
});
