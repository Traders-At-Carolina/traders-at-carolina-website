import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RandomWalk } from "@/components/RandomWalk";

describe("RandomWalk", () => {
  it("renders the requested number of decorative paths", () => {
    const { container } = render(<RandomWalk seed={3} paths={5} size="hero" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("path")).toHaveLength(5);
  });

  it("renders identically for the same seed", () => {
    const a = render(<RandomWalk seed={11} size="header" />).container.innerHTML;
    const b = render(<RandomWalk seed={11} size="header" />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("emphasizes the first path and mutes the rest", () => {
    const { container } = render(<RandomWalk seed={1} paths={3} size="header" />);
    const [first, second, third] = Array.from(container.querySelectorAll("path"));
    expect(first).toHaveAttribute("stroke-width", "1.5");
    expect(second).toHaveAttribute("stroke-opacity", "0.3");
    expect(third).toHaveAttribute("stroke-opacity", "0.25");
  });
});
