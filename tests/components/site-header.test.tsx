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

/** Reports the float point's position to every live observer. */
function reportPoint({ intersecting, top }: { intersecting: boolean; top: number }) {
  act(() => {
    for (const { callback, targets } of observers) {
      for (const target of targets) {
        const entry = {
          target,
          isIntersecting: intersecting,
          boundingClientRect: { top } as DOMRectReadOnly,
        } as IntersectionObserverEntry;
        callback([entry], {} as IntersectionObserver);
      }
    }
  });
}

/** Shorthand: the float point is on screen, or scrolled well past the top. */
function setHeroVisible(visible: boolean) {
  reportPoint(visible ? { intersecting: true, top: 300 } : { intersecting: false, top: -500 });
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
      {withHero ? <span data-nav-float-point /> : null}
      <button type="button">Outside</button>
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
  vi.restoreAllMocks();
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

  it("renders the header Apply button with boxy 10px corners", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const apply = Array.from(nav.querySelectorAll("a")).find((a) => a.textContent === "Apply");
    expect(apply).toHaveClass("rounded-[0.625rem]");
    expect(apply).not.toHaveClass("rounded-full");
  });

  it("renders the header Apply button compact, at 32px", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const apply = Array.from(nav.querySelectorAll("a")).find((a) => a.textContent === "Apply");
    expect(apply).toHaveClass("min-h-8");
    expect(apply).not.toHaveClass("min-h-11");
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

  it("keeps Apply one tap away on mobile, swaps it for the menu's own Apply while open, and leaves the page usable", async () => {
    const user = userEvent.setup();
    const main = document.createElement("main");
    document.body.appendChild(main);
    try {
      renderHeader();
      // Desktop nav Apply + compact mobile Apply beside the menu button.
      const barApplies = screen.getAllByRole("link", { name: "Apply" });
      expect(barApplies).toHaveLength(2);
      expect(barApplies[1]).toHaveClass("min-h-11", "px-4");

      // Open: the compact one gives way to the full-width Apply in the card. The page stays
      // interactive (a non-modal dropdown), so it must not be made inert.
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getAllByRole("link", { name: "Apply" })).toHaveLength(2);
      expect(document.getElementById("mobile-menu")?.querySelector("a[class*='w-full']")).not.toBeNull();
      expect(main).not.toHaveAttribute("inert");

      await user.keyboard("{Escape}");
      expect(screen.getAllByRole("link", { name: "Apply" })).toHaveLength(2);
    } finally {
      main.remove();
    }
  });

  it("closes the menu on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("renders the mobile-menu Apply button with boxy 10px corners", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu");
    const apply = Array.from(menu?.querySelectorAll("a") ?? []).find((a) => a.textContent === "Apply");
    expect(apply).toHaveClass("rounded-[0.625rem]");
    expect(apply).not.toHaveClass("rounded-full");
    expect(apply).toHaveClass("min-h-11");
    expect(apply).not.toHaveClass("min-h-8");
  });
});

describe("SiteHeaderClient docked grid", () => {
  it("has a decorative graph-paper layer that continues the hero's grid behind the docked bar", () => {
    renderHeader();
    const grid = banner().querySelector("[data-nav-grid]");
    expect(grid).not.toBeNull();
    expect(grid).toHaveAttribute("aria-hidden", "true");
    expect(grid).toHaveClass("graph-paper-nav");
  });

  it("sits behind the bar's content and never takes pointer events", () => {
    renderHeader();
    // The grid comes first and the bar is positioned too, so DOM order paints the bar's content over it.
    const [grid, shell] = Array.from(banner().children);
    expect(grid).toHaveAttribute("data-nav-grid");
    expect(grid).toHaveClass("pointer-events-none");
    expect(shell).toHaveClass("relative");
  });
});

describe("SiteHeaderClient mobile menu card", () => {
  async function openMenu() {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    return user;
  }

  it("drops down inside the header instead of covering the page", async () => {
    await openMenu();
    const menu = document.getElementById("mobile-menu");
    expect(menu).not.toBeNull();
    expect(banner().contains(menu)).toBe(true);
    expect(menu).not.toHaveClass("fixed");
  });

  it("does not lock page scrolling", async () => {
    await openMenu();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("closes on a pointer press outside the header", async () => {
    const user = await openMenu();
    await user.click(document.body);
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("stays open when the card itself is pressed", async () => {
    const user = await openMenu();
    await user.click(document.getElementById("mobile-menu")!);
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();
  });

  it("closes when focus moves out of the header", async () => {
    await openMenu();
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("closes when a link is chosen", async () => {
    const user = await openMenu();
    const nav = screen.getByRole("navigation", { name: "Mobile" });
    await user.click(nav.querySelector("a")!);
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
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

  it("observes the float point placed halfway down the hero", () => {
    renderHeader();
    const point = document.querySelector("[data-nav-float-point]");
    expect(observers.some((o) => o.targets.includes(point as Element))).toBe(true);
  });

  it("floats as soon as the float point slips under the header, before it leaves the viewport", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(80);
    renderHeader();
    reportPoint({ intersecting: false, top: 40 });
    expect(banner()).toHaveAttribute("data-floating", "true");
  });

  it("stays docked when the float point is below the fold", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(80);
    renderHeader();
    reportPoint({ intersecting: false, top: 2000 });
    expect(banner()).toHaveAttribute("data-floating", "false");
  });

  it("floats as soon as the page scrolls on pages without a hero", () => {
    renderHeader({ withHero: false });
    expect(banner()).toHaveAttribute("data-floating", "false");
    act(() => {
      window.scrollY = 1;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(banner()).toHaveAttribute("data-floating", "true");
  });

  it("stays floating while the mobile menu is open", async () => {
    const user = userEvent.setup();
    renderHeader();
    setHeroVisible(false);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(banner()).toHaveAttribute("data-floating", "true");
  });
});

describe("SiteHeaderClient sliding highlight", () => {
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

  it("is a boxy 10px-cornered highlight, not a pill", () => {
    renderHeader();
    expect(indicator()).toHaveClass("rounded-[0.625rem]");
    expect(indicator()).not.toHaveClass("rounded-full");
    expect(linkNamed("About")).toHaveClass("rounded-[0.625rem]");
  });

  it("trails the pointer: a gentle spring that starts after a short delay", () => {
    renderHeader();
    measure();
    // First appearance snaps into place, with no travel and no delay.
    expect(indicator().className).not.toContain("--ease-spring");

    fireEvent.pointerEnter(linkNamed("Team"));
    expect(indicator().className).toContain("transform_700ms_var(--ease-spring)_70ms");
    expect(indicator().className).toContain("width_700ms_var(--ease-spring)_70ms");
    expect(indicator().className).not.toContain("--ease-bounce");
  });

  it("rests behind the active page", () => {
    renderHeader();
    measure();
    expect(indicator()).toHaveAttribute("data-target", "1");
    expect(indicator().style.transform).toBe("translateX(100px)");
    expect(indicator().style.width).toBe("70px");
    expect(indicator()).toHaveAttribute("data-visible", "true");
  });

  it("springs to a hovered link and back to the active page on leave", () => {
    renderHeader();
    measure();
    fireEvent.pointerEnter(linkNamed("Team"));
    expect(indicator()).toHaveAttribute("data-target", "2");
    expect(indicator().style.transform).toBe("translateX(200px)");
    expect(indicator().style.width).toBe("80px");

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

  it("opens the menu on hover and closes it when the pointer leaves the header", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query }));
    const user = userEvent.setup();
    renderHeader();
    await user.hover(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    await user.unhover(screen.getByRole("banner"));
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
