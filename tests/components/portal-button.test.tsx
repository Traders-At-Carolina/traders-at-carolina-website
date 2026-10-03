import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkInternalBrowser } from "@/components/admin/MarkInternalBrowser";
import { PortalButton } from "@/components/PortalButton";
import { SiteChrome } from "@/components/SiteChrome";
import { INTERNAL_FLAG } from "@/lib/analytics/client-config";

const pathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

beforeEach(() => pathname.mockReturnValue("/"));

describe("PortalButton", () => {
  it("is a circular plain link to the portal, fixed in the bottom-right corner", () => {
    render(<PortalButton />);
    const link = screen.getByRole("link", { name: "Member portal" });
    expect(link).toHaveAttribute("href", "/portal");
    expect(link).toHaveAttribute("rel", "nofollow");
    expect(link.className).toMatch(/\bfixed\b/);
    expect(link.className).toMatch(/\bbottom-4\b/);
    expect(link.className).toMatch(/\bright-4\b/);
    expect(link.className).toMatch(/\brounded-full\b/);
    expect(link.className).toMatch(/\bsize-11\b/);
  });

  it("is hidden on the portal itself", () => {
    pathname.mockReturnValue("/portal");
    const { container } = render(<PortalButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("appears on every public page through the site chrome", () => {
    pathname.mockReturnValue("/membership");
    render(
      <SiteChrome>
        <h1>Page</h1>
      </SiteChrome>,
    );
    expect(screen.getByRole("link", { name: "Member portal" })).toBeInTheDocument();
  });
});

describe("MarkInternalBrowser", () => {
  it("flags this browser so analytics never count admins", () => {
    localStorage.removeItem(INTERNAL_FLAG);
    render(<MarkInternalBrowser />);
    expect(localStorage.getItem(INTERNAL_FLAG)).toBe("1");
    localStorage.removeItem(INTERNAL_FLAG);
  });
});
