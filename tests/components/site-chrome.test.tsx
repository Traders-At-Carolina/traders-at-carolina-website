import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";
import { SiteChrome } from "@/components/SiteChrome";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("SiteChrome", () => {
  it("puts the skip link first, then header, main and footer around the page", () => {
    const { container } = render(
      <SiteChrome>
        <h1>Page</h1>
      </SiteChrome>,
    );
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(container.firstElementChild).toBe(skip);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toContainElement(screen.getByRole("heading", { name: "Page" }));
    expect(Array.from(container.children).map((el) => el.tagName)).toEqual(["A", "HEADER", "MAIN", "FOOTER"]);
  });
});

describe("NotFound", () => {
  it("keeps the site header and footer on unknown URLs", () => {
    render(<NotFound />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("This page isn't here.");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
