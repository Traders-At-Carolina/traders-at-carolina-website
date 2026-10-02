import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { ApplyPage } from "@/components/apply/ApplyPage";
import { apply } from "@/content/apply";
import type { Recruiting } from "@/content/types";

const open: Recruiting = {
  applicationsOpen: true,
  applyUrl: "https://forms.gle/apply",
  cycleLabel: "Spring 2027",
  applyDeadline: "2027-02-06T23:59",
};
const closed: Recruiting = { applicationsOpen: false, applyUrl: "", interestFormUrl: "https://forms.gle/notify" };
const before = new Date("2027-02-01T12:00:00Z");

afterEach(() => {
  vi.useRealTimers();
});

describe("ApplyPage", () => {
  it("renders the open state with one h1 and the form link in the header and band", () => {
    const { container } = render(<ApplyPage apply={apply} recruiting={open} now={before} />);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["Applications are open."]);
    expect(screen.getByText("Due Sat, Feb 6 at 11:59 PM ET")).toBeInTheDocument();
    // Header, What you get and the band.
    const applyLinks = screen.getAllByRole("link", { name: /^Apply/ });
    expect(applyLinks).toHaveLength(3);
    applyLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "https://forms.gle/apply");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });

  it("leads the closed state with one action and no repeated 'closed' in the band", () => {
    const { container } = render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Be first to know when applications open.");
    expect(screen.getByText(/^Applications are closed · /)).toBeInTheDocument();
    const notify = screen.getAllByRole("link", { name: /^Get notified/ });
    expect(notify).toHaveLength(3);
    notify.forEach((link) => expect(link).toHaveAttribute("href", "https://forms.gle/notify"));
    const header = container.querySelector('[data-track-location="apply-header"]')!;
    expect(within(header as HTMLElement).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Don't miss the next cycle." })).toBeInTheDocument();
  });

  it("orders the sections header, what you get, process, FAQ, band", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Everything you need to break into quant.",
      "What happens after you apply.",
      "Common questions.",
      "Don't miss the next cycle.",
    ]);
  });

  it("marks the application stage as open now", () => {
    render(<ApplyPage apply={apply} recruiting={open} now={before} />);
    const process = screen.getByRole("region", { name: "What happens after you apply." });
    expect(within(process).getByText("Open now")).toBeInTheDocument();
    expect(within(process).getByText("Due Feb 6")).toBeInTheDocument();
  });

  it("is closed at build time once the deadline has passed", () => {
    render(<ApplyPage apply={apply} recruiting={open} now={new Date("2027-02-08T00:00:00Z")} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Applications are closed.");
  });

  it("switches to closed in the browser when the deadline passes after the build", () => {
    vi.useFakeTimers({ now: new Date("2027-02-07T04:58:00Z") });
    render(<ApplyPage apply={apply} recruiting={open} now={before} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Applications are open.");
    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Applications are closed.");
    expect(screen.getByRole("heading", { name: "Applications are closed for now." })).toBeInTheDocument();
  });

  it("renders FAQ items as details with links and FAQPage JSON-LD", () => {
    const { container } = render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    const faq = screen.getByRole("region", { name: "Common questions." });
    expect(faq.querySelectorAll("details")).toHaveLength(apply.faq.length);
    expect(faq.querySelector("h2")).toHaveTextContent("Common questions.");
    expect(faq).toHaveClass("surface-graphite", "on-dark");
    expect(within(faq).getByRole("link", { name: "recommended background" })).toHaveAttribute("href", "/membership#trading");
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity[0].acceptedAnswer.text).not.toContain("](");
  });

  it("shows generic process copy and no dates when closed", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    expect(screen.getByText("We recruit each fall and spring. Here's how a typical cycle works.")).toBeInTheDocument();
    expect(screen.queryByText(/^Due /)).not.toBeInTheDocument();
  });

  it("keeps draft FAQ answers off production", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} vercelEnv="production" />);
    const faq = screen.getByRole("region", { name: "Common questions." });
    expect(faq.querySelectorAll("details")).toHaveLength(apply.faq.filter((f) => !f.draft).length);
  });
});
