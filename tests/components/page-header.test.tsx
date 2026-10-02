import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/PageHeader";

describe("PageHeader", () => {
  it("shows the random walk by default", () => {
    const { container } = render(<PageHeader eyebrow="About" title="Who we are." />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("replaces the random walk with the art it is given", () => {
    const { container } = render(<PageHeader eyebrow="Team" title="Us." art={<p>custom art</p>} />);
    expect(screen.getByText("custom art")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders no art column when art is null", () => {
    const { container } = render(<PageHeader eyebrow="Team" title="Us." art={null} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.querySelector(".md\\:col-span-5")).not.toBeInTheDocument();
  });
});
