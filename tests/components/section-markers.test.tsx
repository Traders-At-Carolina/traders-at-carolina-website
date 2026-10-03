import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "@/components/Section";
import { SectionProgress } from "@/components/SectionProgress";

describe("section markers", () => {
  it("renders the numbered eyebrow and a drawable rule in the header", () => {
    const { container } = render(<SectionHeader index={2} eyebrow="Process" title="Title" />);
    expect(screen.getByText("§ 02 — Process")).toBeInTheDocument();
    expect(container.querySelector(".section-marker")).not.toBeNull();
    expect(container.querySelector(".section-rule")).toHaveClass("bg-rule");
  });

  it("uses the inverse rule colour on dark sections", () => {
    const { container } = render(<SectionHeader index={1} eyebrow="Numbers" title="Title" tone="inverse" />);
    expect(container.querySelector(".section-rule")).toHaveClass("bg-rule-inverse");
  });

  it("renders no progress rail when the page has fewer than two sections", () => {
    render(<SectionProgress />);
    expect(screen.queryByTestId("section-progress")).toBeNull();
  });
});
