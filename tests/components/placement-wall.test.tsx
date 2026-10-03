import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { PlacementWall } from "@/components/team/PlacementWall";
import type { CompanyMark } from "@/content/types";

const logo = { src: "/x.png", width: 96, height: 96 } as StaticImageData;
const companies: CompanyMark[] = ["Citadel", "AWS"].map((name) => ({ name, logo }));

function setup(listWidth = 0) {
  const { container } = render(<PlacementWall companies={companies} />);
  const strip = container.querySelector(".logo-strip") as HTMLElement;
  const track = container.querySelector(".logo-strip-track") as HTMLElement;
  // jsdom has no layout; give the first list a width so the loop wraps like it does in a browser.
  Object.defineProperty(track.querySelector("ul"), "offsetWidth", { value: listWidth, configurable: true });
  return { strip, track };
}
const drag = (el: HTMLElement, from: number, to: number) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: from });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: to });
};

describe("PlacementWall dragging", () => {
  beforeEach(() => {
    // Freeze the auto-scroll so only the drag moves the track.
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  it("moves the strip with the pointer: dragging left slides the logos left", () => {
    const { strip, track } = setup();
    drag(strip, 200, 150);
    expect(track.style.transform).toBe("translate3d(-50px, 0, 0)");
  });

  it("stops following the pointer once it is released", () => {
    const { strip, track } = setup();
    drag(strip, 200, 150);
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 150 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientX: 100 });
    expect(track.style.transform).toBe("translate3d(-50px, 0, 0)");
  });

  it("wraps around the repeated list in both directions, so dragging never runs out of logos", () => {
    const left = setup(100);
    drag(left.strip, 200, 70); // 130px left on a 100px list
    expect(left.track.style.transform).toBe("translate3d(-30px, 0, 0)");

    const right = setup(100);
    drag(right.strip, 100, 120); // 20px right from the start
    expect(right.track.style.transform).toBe("translate3d(-80px, 0, 0)");
  });

  it("ignores the secondary mouse button", () => {
    const { strip, track } = setup();
    fireEvent.pointerDown(strip, { pointerId: 1, button: 2, clientX: 200 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientX: 150 });
    expect(track.style.transform).toBe("");
  });

  it("does not move under reduced motion, where the strip is a static row", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      const { strip, track } = setup();
      drag(strip, 200, 150);
      expect(track.style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("PlacementWall tone", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps ink marks and the default hairlines on the default tone", () => {
    const { container } = render(<PlacementWall companies={companies} />);
    const mark = container.querySelector("img") as HTMLElement;
    expect(mark.className).toContain("brightness-0");
    expect(mark.className).not.toContain("invert");
    expect(container.querySelector(".logo-strip")).toHaveClass("border-rule");
    expect(screen.getAllByText("Citadel")[0]).toHaveClass("text-ink-2");
  });

  it("shows the marks unaltered on a clear background and uses inverse hairlines and text on the inverse tone", () => {
    const { container } = render(<PlacementWall companies={companies} tone="inverse" />);
    const mark = container.querySelector("img") as HTMLElement;
    expect(mark.className).not.toContain("brightness");
    expect(mark.className).not.toContain("invert");
    expect(mark.className).not.toContain("opacity-70");
    expect(mark.parentElement?.className).not.toContain("bg-");
    expect(container.querySelector(".logo-strip")).toHaveClass("border-rule-inverse");
    expect(screen.getAllByText("Citadel")[0]).toHaveClass("text-bone");
    expect(screen.getByText("Where we've worked")).toHaveClass("text-bone");
  });
});
