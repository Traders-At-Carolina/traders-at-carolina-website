import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { StickyApply } from "@/components/apply/StickyApply";

type Callback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;
let observers: Array<{ callback: Callback; target?: Element }> = [];

function mockObserver() {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      entry: { callback: Callback; target?: Element };
      constructor(callback: Callback) {
        this.entry = { callback };
        observers.push(this.entry);
      }
      observe(target: Element) {
        this.entry.target = target;
      }
      disconnect() {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelector("footer")?.remove();
});

describe("StickyApply", () => {
  it("renders nothing until the header has scrolled past, then hides at the footer", () => {
    document.body.append(document.createElement("footer"));
    mockObserver();
    render(
      <StickyApply>
        <a href="/x">Apply</a>
      </StickyApply>,
    );
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();

    const [header, footer] = observers;
    act(() => header.callback([{ isIntersecting: false, boundingClientRect: { top: -40 } as DOMRectReadOnly }]));
    expect(screen.getByRole("link", { name: "Apply" })).toBeInTheDocument();

    act(() => footer.callback([{ isIntersecting: true }]));
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("stays hidden while the marker is still below the viewport top", () => {
    mockObserver();
    render(
      <StickyApply>
        <a href="/x">Apply</a>
      </StickyApply>,
    );
    act(() => observers[0].callback([{ isIntersecting: false, boundingClientRect: { top: 900 } as DOMRectReadOnly }]));
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
  });
});
