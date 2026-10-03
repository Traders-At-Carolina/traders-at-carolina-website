import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wordmark } from "@/components/Wordmark";

describe("Wordmark", () => {
  it("links home and is named after the club", () => {
    render(<Wordmark />);
    const link = screen.getByRole("link", { name: "Traders at Carolina, home" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows the full-colour logo mark as a decorative image", () => {
    const { container } = render(<Wordmark />);
    const mark = container.querySelector("img");
    expect(mark).toHaveAttribute("src", "/brand/logo.svg");
    expect(mark).toHaveAttribute("alt", "");
  });

  it("uses the one-colour bone mark on dark backgrounds", () => {
    const { container } = render(<Wordmark tone="inverse" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/brand/logo-bone.svg");
  });

  it("keeps the typeset club name beside the mark", () => {
    render(<Wordmark />);
    expect(screen.getByRole("link").textContent).toBe("Traders at Carolina");
  });

  it("renders a larger mark when asked", () => {
    const { container } = render(<Wordmark size="lg" />);
    expect(container.querySelector("img")).toHaveClass("h-11");
  });

  it("keeps the name in a plain span unless asked to tuck", () => {
    const { container } = render(<Wordmark />);
    expect(container.querySelector("[data-wordmark-track]")).toBeNull();
  });

  it("clips the name in a track beside the mark when tucking, keeping the link's name", () => {
    const { container } = render(<Wordmark tuck />);
    const track = container.querySelector("[data-wordmark-track]");
    expect(track).toHaveClass("wordmark-track", "max-[359px]:hidden");
    expect(track?.querySelector(".wordmark-name")).toHaveTextContent("Traders at Carolina");
    expect(screen.getByRole("link", { name: "Traders at Carolina, home" })).toHaveClass("group");
  });
});
