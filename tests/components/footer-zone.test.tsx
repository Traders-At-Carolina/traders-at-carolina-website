import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterZone } from "@/components/FooterZone";

const pathname = vi.hoisted(() => ({ current: "/about" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

afterEach(() => {
  pathname.current = "/about";
});

const renderZone = () =>
  render(
    <FooterZone hideOn={["/apply"]}>
      <p>zone content</p>
    </FooterZone>,
  );

describe("FooterZone", () => {
  it("renders its children on other pages", () => {
    renderZone();
    expect(screen.getByText("zone content")).toBeInTheDocument();
  });

  it("renders nothing on a hidden page", () => {
    pathname.current = "/apply";
    renderZone();
    expect(screen.queryByText("zone content")).not.toBeInTheDocument();
  });

  it("ignores a trailing slash", () => {
    pathname.current = "/apply/";
    renderZone();
    expect(screen.queryByText("zone content")).not.toBeInTheDocument();
  });

  it("matches whole paths only", () => {
    pathname.current = "/applying";
    renderZone();
    expect(screen.getByText("zone content")).toBeInTheDocument();
  });
});
