import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { primaryNav } from "@/content/nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/membership" }));

function renderHeader() {
  return render(<SiteHeaderClient links={primaryNav} applyHref="/apply" applyExternal={false} />);
}

describe("SiteHeaderClient", () => {
  it("marks the current page in the primary nav", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent("Membership");
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

  it("keeps Apply one tap away on mobile and hides the page behind the open menu", async () => {
    const user = userEvent.setup();
    const main = document.createElement("main");
    document.body.appendChild(main);
    try {
      const { container } = renderHeader();
      // Desktop nav Apply + compact mobile Apply.
      expect(screen.getAllByRole("link", { name: "Apply" })).toHaveLength(2);

      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(main).toHaveAttribute("inert");
      expect(container.parentElement).not.toHaveAttribute("inert");

      await user.keyboard("{Escape}");
      expect(main).not.toHaveAttribute("inert");
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
});
