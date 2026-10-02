import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { primaryNav } from "@/content/nav";

const pathname = vi.hoisted(() => ({ current: "/membership" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

type ObserverRecord = { callback: IntersectionObserverCallback; targets: Element[] };
let observers: ObserverRecord[] = [];

class MockIntersectionObserver {
  record: ObserverRecord;
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, targets: [] };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.record.targets = [];
  }
}

/** Reports the hero as on screen (or scrolled away) to every live observer. */
function setHeroVisible(visible: boolean) {
  act(() => {
    for (const { callback, targets } of observers) {
      for (const target of targets) {
        const entry = {
          target,
          isIntersecting: visible,
          boundingClientRect: { top: visible ? 0 : -500 } as DOMRectReadOnly,
        } as IntersectionObserverEntry;
        callback([entry], {} as IntersectionObserver);
      }
    }
  });
}

/** jsdom has no layout, so give each nav link a deterministic box. */
function stubLinkBoxes() {
  const nav = screen.getByRole("navigation", { name: "Primary" });
  nav.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((link, i) => {
    Object.defineProperty(link, "offsetLeft", { configurable: true, value: i * 100 });
    Object.defineProperty(link, "offsetWidth", { configurable: true, value: 60 + i * 10 });
  });
}

function renderHeader({ withHero = true } = {}) {
  return render(
    <>
      <SiteHeaderClient links={primaryNav} applyHref="/apply" applyExternal={false} />
      {withHero ? <section data-nav-hero>Hero</section> : null}
    </>,
  );
}

const banner = () => screen.getByRole("banner");
const indicator = () => screen.getByTestId("nav-indicator");

beforeEach(() => {
  pathname.current = "/membership";
  observers = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.scrollY = 0;
});

describe("SiteHeaderClient", () => {
  it("lists About, Membership and Team, then Apply", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const labels = Array.from(nav.querySelectorAll("a")).map((a) => a.textContent);
    expect(labels).toEqual(["About", "Membership", "Team", "Apply"]);
  });

  it("marks the current page in the primary nav", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent("Membership");
  });

  it("renders the header Apply button as a pill", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const apply = Array.from(nav.querySelectorAll("a")).find((a) => a.textContent === "Apply");
    expect(apply).toHaveClass("rounded-full");
  });

  it("opens and closes the mobile menu with the button", async () => {
    const user = userEvent.setup();
    renderHeader();
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("closes the menu on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("renders the mobile-menu Apply button as a pill", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu");
    const apply = Array.from(menu?.querySelectorAll("a") ?? []).find((a) => a.textContent === "Apply");
    expect(apply).toHaveClass("rounded-full");
  });
});

describe("SiteHeaderClient floating state", () => {
  it("is docked while the hero is on screen", () => {
    renderHeader();
    setHeroVisible(true);
    expect(banner()).toHaveAttribute("data-floating", "false");
  });

  it("floats once the hero scrolls out of view, and docks again when it returns", () => {
    renderHeader();
    setHeroVisible(false);
    expect(banner()).toHaveAttribute("data-floating", "true");
    setHeroVisible(true);
    expect(banner()).toHaveAttribute("data-floating", "false");
  });

  it("observes the element marked data-nav-hero", () => {
    renderHeader();
    const hero = document.querySelector("[data-nav-hero]");
    expect(observers.some((o) => o.targets.includes(hero as Element))).toBe(true);
  });

  it("falls back to a scroll offset on pages without a hero", () => {
    renderHeader({ withHero: false });
    expect(banner()).toHaveAttribute("data-floating", "false");
    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(banner()).toHaveAttribute("data-floating", "true");
  });

  it("docks while the mobile menu is open", async () => {
    const user = userEvent.setup();
    renderHeader();
    setHeroVisible(false);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(banner()).toHaveAttribute("data-floating", "false");
  });
});

describe("SiteHeaderClient sliding underline", () => {
  function linkNamed(name: string) {
    const nav = screen.getByRole("navigation", { name: "Primary" });
    return Array.from(nav.querySelectorAll<HTMLAnchorElement>("[data-nav-link]")).find((a) => a.textContent === name)!;
  }

  function measure() {
    stubLinkBoxes();
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  it("rests under the active page", () => {
    renderHeader();
    measure();
    expect(indicator()).toHaveAttribute("data-target", "1");
    expect(indicator().style.transform).toBe("translateX(100px) scaleX(70)");
    expect(indicator()).toHaveAttribute("data-visible", "true");
  });

  it("springs to a hovered link and back to the active page on leave", () => {
    renderHeader();
    measure();
    fireEvent.pointerEnter(linkNamed("Team"));
    expect(indicator()).toHaveAttribute("data-target", "2");
    expect(indicator().style.transform).toBe("translateX(200px) scaleX(80)");

    fireEvent.pointerLeave(linkNamed("Team").closest("ul")!);
    expect(indicator()).toHaveAttribute("data-target", "1");
  });

  it("follows keyboard focus", () => {
    renderHeader();
    measure();
    act(() => linkNamed("About").focus());
    expect(indicator()).toHaveAttribute("data-target", "0");
  });

  it("is hidden on pages with no active link until a link is hovered", () => {
    pathname.current = "/";
    renderHeader();
    measure();
    expect(indicator()).toHaveAttribute("data-visible", "false");

    fireEvent.pointerEnter(linkNamed("About"));
    expect(indicator()).toHaveAttribute("data-visible", "true");
    expect(indicator()).toHaveAttribute("data-target", "0");
  });
});
