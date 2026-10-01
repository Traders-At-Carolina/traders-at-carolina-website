import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplyButton } from "@/components/ApplyButton";
import type { Recruiting } from "@/content/types";

const now = new Date("2027-02-01T12:00:00Z");
const open: Recruiting = { applicationsOpen: true, applyUrl: "https://forms.gle/apply", applyDeadline: "2027-02-06T23:59" };

describe("ApplyButton", () => {
  it("links to the Google Form in a new tab when open", () => {
    render(<ApplyButton now={now} recruiting={open} />);
    const link = screen.getByRole("link", { name: /^Apply/ });
    expect(link).toHaveAttribute("href", "https://forms.gle/apply");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("links to /apply in the same tab when closed", () => {
    render(<ApplyButton now={now} recruiting={{ ...open, applicationsOpen: false }} />);
    const link = screen.getByRole("link", { name: "Apply" });
    expect(link).toHaveAttribute("href", "/apply");
    expect(link).not.toHaveAttribute("target");
  });

  it("treats a passed deadline as closed", () => {
    render(<ApplyButton now={new Date("2027-03-01T00:00:00Z")} recruiting={open} />);
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/apply");
  });
});
