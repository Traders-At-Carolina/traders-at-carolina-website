import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BitWordmark } from "@/components/footer/BitWordmark";
import { SiteFooter } from "@/components/SiteFooter";

// SiteFooter's FooterZone reads the current route to hide its zones on /apply and /team.
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));

afterEach(() => vi.restoreAllMocks());

describe("BitWordmark", () => {
  it("renders a decorative canvas that assistive tech skips", () => {
    // jsdom has no 2D context; the component must bail out quietly instead of throwing.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<BitWordmark />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("role", "presentation");
    expect(canvas).not.toHaveAttribute("tabindex");
  });

  it("reserves the band's height with an aspect ratio so the page never shifts", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<BitWordmark />);
    expect(container.querySelector("canvas")?.className).toMatch(/aspect-\[100\/57\].*md:aspect-\[100\/28\]/);
  });

  it("does not block vertical scrolling on touch", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<BitWordmark />);
    expect(container.querySelector("canvas")?.className).toContain("touch-pan-y");
  });
});

describe("SiteFooter", () => {
  it("closes with the bit wordmark band", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");
    expect(footer?.lastElementChild?.querySelector("canvas.bit-wordmark")).not.toBeNull();
  });
});
