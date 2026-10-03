import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { ApplyPage } from "@/components/apply/ApplyPage";
import { apply } from "@/content/apply";
import type { ClubEvent, Recruiting } from "@/content/types";

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
  it("renders the open state with one h1 and the form link in the header and What you get", () => {
    const { container } = render(<ApplyPage apply={apply} recruiting={open} now={before} />);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["Applications are open."]);
    expect(screen.getByText("Due Sat, Feb 6 at 11:59 PM ET")).toBeInTheDocument();
    // Header and What you get; the closing band is the footer's.
    const applyLinks = screen.getAllByRole("link", { name: /^Apply/ });
    expect(applyLinks).toHaveLength(2);
    applyLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "https://forms.gle/apply");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(0);
  });

  it("leads the closed state with one action and no band of its own", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Be first to know when applications open.");
    expect(screen.getByText(/^Applications are closed · /)).toBeInTheDocument();
    const notify = screen.getAllByRole("link", { name: /^Keep me posted/ });
    expect(notify).toHaveLength(2);
    notify.forEach((link) => expect(link).toHaveAttribute("href", "https://forms.gle/notify"));
    const header = screen.getByRole("heading", { level: 1 }).closest("header")!;
    expect(within(header).getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Don't miss the next cycle." })).not.toBeInTheDocument();
  });

  it("orders the sections header, until then, what you get, process, FAQ", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Make the most of the wait.",
      "Everything you need to break into quant.",
      "What happens after you apply.",
      "Common questions.",
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
    expect(screen.getByText("We open applications each fall and spring. Here's how a typical cycle works.")).toBeInTheDocument();
    expect(screen.queryByText(/^Due /)).not.toBeInTheDocument();
  });

  it("keeps draft FAQ answers off production", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} vercelEnv="production" />);
    const faq = screen.getByRole("region", { name: "Common questions." });
    expect(faq.querySelectorAll("details")).toHaveLength(apply.faq.filter((f) => !f.draft).length);
  });

  it("tags each Keep me posted action with its placement for analytics", () => {
    render(<ApplyPage apply={apply} recruiting={closed} now={before} />);
    const placements = screen
      .getAllByRole("link", { name: /^Keep me posted/ })
      .map((link) => [link.getAttribute("data-ph-capture-attribute-cta"), link.getAttribute("data-ph-capture-attribute-placement")]);
    expect(placements).toEqual([
      ["keep-me-posted", "apply-header"],
      ["keep-me-posted", "apply-benefits"],
    ]);
  });

  it("adds a closed-only 'until then' section with an event when one is coming", () => {
    const event: ClubEvent = {
      title: "Mock trading night",
      type: "workshop",
      startsAt: "2027-02-10T19:00",
      audience: "public",
      featured: false,
      url: "https://example.com/mock",
    };
    render(<ApplyPage apply={apply} recruiting={closed} events={[event]} social={{ instagram: "https://instagram.com/tac" }} now={before} />);
    const wait = screen.getByRole("region", { name: "Make the most of the wait." });
    expect(within(wait).getByText(/Mock trading night/)).toBeInTheDocument();
    expect(within(wait).getByRole("link", { name: /^Details/ })).toHaveAttribute("href", "https://example.com/mock");
    expect(within(wait).getByRole("link", { name: /^Instagram/ })).toHaveAttribute("href", "https://instagram.com/tac");
    expect(within(wait).getByRole("link", { name: /^Meet the team/ })).toHaveAttribute("href", "/team");
  });

  it("leaves the 'until then' section out while applications are open", () => {
    render(<ApplyPage apply={apply} recruiting={open} now={before} />);
    expect(screen.queryByRole("region", { name: "Make the most of the wait." })).not.toBeInTheDocument();
  });

  it("shows the contact email under the FAQ heading", () => {
    render(<ApplyPage apply={apply} recruiting={closed} contactEmail="hi@club.org" now={before} />);
    expect(screen.getByText(/^Questions\? Email/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hi@club.org" })).toHaveAttribute("href", "mailto:hi@club.org");
  });
});
