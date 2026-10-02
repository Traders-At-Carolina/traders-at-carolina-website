import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { IntroOverlay } from "@/components/home/IntroOverlay";

describe("IntroOverlay", () => {
  it("is decorative, so screen readers go straight to the page", () => {
    const { container } = render(<IntroOverlay />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the full-colour logo and the typeset club name", () => {
    const { container } = render(<IntroOverlay />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/brand/logo.svg");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.textContent).toBe("Traders at Carolina");
  });

  it("draws the grid as separate row and column layers", () => {
    const { container } = render(<IntroOverlay />);
    expect(container.querySelector(".intro-rows")).not.toBeNull();
    expect(container.querySelector(".intro-cols")).not.toBeNull();
  });
});
