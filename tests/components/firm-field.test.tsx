import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { FirmField } from "@/components/team/FirmField";
import type { CompanyMark } from "@/content/types";
import { seedLayout } from "@/lib/float-field";

const logo = { src: "/x.png", width: 96, height: 96 } as StaticImageData;
const companies: CompanyMark[] = ["Citadel", "AWS"].map((name) => ({ name, logo }));
// Two firms fit the reference field (1200 × 420) at its base height, so the server layout maps onto it one to one.
const REFERENCE = { width: 1200, height: 420 };

const cells = () => screen.getAllByRole("listitem");
const drag = (el: HTMLElement, dx: number, dy: number) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
};

describe("FirmField", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
    // jsdom has no layout; give the field the reference size.
    vi.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(function (this: Element) {
      return this.classList.contains("firm-field") ? REFERENCE.width : 0;
    });
    vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
      return this.classList.contains("firm-field") ? REFERENCE.height : 0;
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("lists each firm once with its name, with decorative marks at the seeded positions", () => {
    const { container } = render(<FirmField companies={companies} />);
    expect(cells().map((cell) => cell.textContent)).toEqual(["Citadel", "AWS"]);
    expect(container.querySelectorAll("img[alt='']")).toHaveLength(2);
    const [first] = seedLayout(2, REFERENCE);
    expect(cells()[0].style.left).toBe(`${((first.x / REFERENCE.width) * 100).toFixed(2)}%`);
    expect(cells()[0].style.top).toBe(`${((first.y / REFERENCE.height) * 100).toFixed(2)}%`);
  });

  it("shows each mark in its own colours rather than flattened to ink", () => {
    const { container } = render(<FirmField companies={companies} />);
    for (const img of container.querySelectorAll("img")) {
      expect(img.className).not.toMatch(/brightness-0|invert|grayscale|opacity-/);
    }
  });

  it("moves a firm with the pointer while it is held, and stops following once let go", () => {
    render(<FirmField companies={companies} />);
    const [b] = seedLayout(2, REFERENCE);
    // Drag toward the middle so the walls never clamp the move.
    const dx = b.x < REFERENCE.width / 2 ? 10 : -10;
    const dy = b.y < REFERENCE.height / 2 ? 5 : -5;
    const cell = cells()[0];
    expect(cell.style.transform).toBe("translate3d(0px, 0px, 0)");
    drag(cell, dx, dy);
    expect(cell.style.transform).toBe(`translate3d(${dx}px, ${dy}px, 0)`);
    fireEvent.pointerUp(cell, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
    fireEvent.pointerMove(cell, { pointerId: 1, clientX: 300, clientY: 300 });
    expect(cell.style.transform).toBe(`translate3d(${dx}px, ${dy}px, 0)`);
  });

  it("ignores the secondary mouse button", () => {
    render(<FirmField companies={companies} />);
    const cell = cells()[0];
    fireEvent.pointerDown(cell, { pointerId: 1, button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(cell, { pointerId: 1, clientX: 110, clientY: 100 });
    expect(cell.style.transform).toBe("translate3d(0px, 0px, 0)");
  });

  it("pauses and resumes from a button that names its action; a paused field can't be dragged", () => {
    render(<FirmField companies={companies} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    const play = screen.getByRole("button", { name: "Play motion" });
    expect(play).not.toHaveAttribute("aria-pressed");
    drag(cells()[0], 10, 5);
    expect(cells()[0].style.transform).toBe("translate3d(0px, 0px, 0)");
    fireEvent.click(play);
    expect(screen.getByRole("button", { name: "Pause motion" })).toBeInTheDocument();
  });

  describe("the loop", () => {
    const original = globalThis.IntersectionObserver;
    let report: (visible: boolean) => void = () => {};
    beforeEach(() => {
      globalThis.IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          report = (visible) => callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);
        }
        observe() {}
        disconnect() {}
      } as unknown as typeof IntersectionObserver;
    });
    afterEach(() => {
      globalThis.IntersectionObserver = original;
    });

    it("only runs once the field is on screen", () => {
      render(<FirmField companies={companies} />);
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      report(true);
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it("never steps backwards when a frame's timestamp is older than the loop's start", () => {
      render(<FirmField companies={companies} />);
      report(true);
      const tick = vi.mocked(window.requestAnimationFrame).mock.calls[0][0];
      tick(performance.now() - 5000);
      expect(cells().map((cell) => cell.style.transform)).toEqual(["translate3d(0px, 0px, 0)", "translate3d(0px, 0px, 0)"]);
    });
  });

  it("is a static row under reduced motion: no pause button, no transforms, no dragging", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      render(<FirmField companies={companies} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      drag(cells()[0], 10, 5);
      expect(cells()[0].style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});
