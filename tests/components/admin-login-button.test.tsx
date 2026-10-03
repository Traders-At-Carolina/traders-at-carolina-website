import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminLoginButton } from "@/components/AdminLoginButton";
import { MarkInternalBrowser } from "@/components/admin/MarkInternalBrowser";
import { SiteChrome } from "@/components/SiteChrome";
import { INTERNAL_FLAG } from "@/lib/analytics/client-config";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("AdminLoginButton", () => {
  it("is a circular link to the admin sign-in, fixed in the bottom-right corner", () => {
    render(<AdminLoginButton />);
    const link = screen.getByRole("link", { name: "Admin sign in" });
    expect(link).toHaveAttribute("href", "/admin/sign-in");
    expect(link).toHaveAttribute("rel", "nofollow");
    expect(link.className).toMatch(/\bfixed\b/);
    expect(link.className).toMatch(/\bbottom-4\b/);
    expect(link.className).toMatch(/\bright-4\b/);
    expect(link.className).toMatch(/\brounded-full\b/);
    expect(link.className).toMatch(/\bsize-11\b/);
  });

  it("appears on every public page through the site chrome", () => {
    render(
      <SiteChrome>
        <h1>Page</h1>
      </SiteChrome>,
    );
    expect(screen.getByRole("link", { name: "Admin sign in" })).toBeInTheDocument();
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
