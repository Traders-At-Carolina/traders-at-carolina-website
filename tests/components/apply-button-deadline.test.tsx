import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplyButton } from "@/components/ApplyButton";

describe("ApplyButton deadline switch (spec 06 §10)", () => {
  it("links to the form before the deadline, ready to switch in the browser", () => {
    const { container } = render(
      <ApplyButton recruiting={{ mode: "open", applicationsOpen: true, applyUrl: "https://forms.gle/abc", applyDeadline: "2099-11-01T23:59" }} now={new Date("2099-10-01T12:00:00Z")} />,
    );
    expect(screen.getByRole("link", { name: /Apply/ })).toHaveAttribute("href", "https://forms.gle/abc");
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("goes to /apply once closed", () => {
    render(<ApplyButton recruiting={{ mode: "closed", applicationsOpen: false, applyUrl: "https://forms.gle/abc" }} />);
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/apply");
  });
});
