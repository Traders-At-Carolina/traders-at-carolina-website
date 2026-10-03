import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AboutPage } from "@/components/about/AboutPage";
import type { AboutContent, TimelineEntry } from "@/content/types";

const base: AboutContent = {
  header: { h1: "Built by students, for the long game.", lead: "Lead." },
  headings: { mission: "Why we exist.", story: "How it started.", principles: "How we operate.", partners: "Who supports us.", advisorsOnly: "Our advisors." },
  mission: { statement: "Mission statement.", body: "Mission body." },
  vision: { statement: "Vision statement.", body: "Vision body." },
  story: { paragraphs: [] },
  principles: [
    { title: "One", body: "B1." },
    { title: "Two", body: "B2." },
    { title: "Three", body: "B3." },
    { title: "Four", body: "B4." },
  ],
  partners: [],
  advisors: [],
};
const milestones = (n: number): TimelineEntry[] => Array.from({ length: n }, (_, i) => ({ year: 2024 - i, title: `Milestone ${i}` }));
const story = { paragraphs: ["Founded in a dorm room.", "Grew every semester."] };

const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);
const renderAbout = (about: Partial<AboutContent> = {}, timeline: TimelineEntry[] = []) =>
  render(<AboutPage about={{ ...base, ...about }} timeline={timeline} />);

describe("AboutPage", () => {
  it("renders the page header as the only h1 and no navy band (the footer owns it)", () => {
    const { container } = renderAbout();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(0);
  });

  it("hides story and partners without content and keeps numbering sequential", () => {
    renderAbout();
    expect(eyebrows()).toEqual(["§ 01 — Mission and vision", "§ 02 — Principles"]);
    expect(screen.queryByText("How it started.")).not.toBeInTheDocument();
  });

  it("renders the story with a pull quote, without milestones below the threshold", () => {
    const quote = { text: "Start where you are.", name: "A. Founder", role: "Co-founder", classYear: 2021 };
    renderAbout({ story: { ...story, quote } }, milestones(2));
    expect(eyebrows()).toEqual(["§ 01 — Mission and vision", "§ 02 — Our story", "§ 03 — Principles"]);
    const figure = screen.getByRole("figure");
    expect(within(figure).getByText("“Start where you are.”")).toBeInTheDocument();
    expect(within(figure).getByText(/A\. Founder, Co-founder, '21/)).toBeInTheDocument();
    expect(screen.queryByText("Milestone 0")).not.toBeInTheDocument();
  });

  it("shows milestones oldest first once there are three", () => {
    renderAbout({ story }, milestones(3));
    const region = screen.getByRole("region", { name: "How it started." });
    const years = within(region).getAllByText(/^20\d\d$/).map((el) => el.textContent);
    expect(years).toEqual(["2022", "2023", "2024"]);
  });

  it("lists partners alphabetically with external links in a new tab", () => {
    renderAbout({ partners: [{ name: "Optiver", relationship: "Event partner" }, { name: "Citadel", url: "https://citadel.com" }] });
    expect(eyebrows().at(-1)).toBe("§ 03 — Partners and advisors");
    const region = screen.getByRole("region", { name: "Who supports us." });
    const names = within(region).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names[0]).toMatch(/^Citadel/);
    expect(names[1]).toBe("Optiver");
    const link = within(region).getByRole("link", { name: /Citadel/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(region).queryByText("Advisors")).not.toBeInTheDocument();
  });

  it("shows a decorative logo beside partners that have one, keeping the name as the heading text", () => {
    renderAbout({
      partners: [
        { name: "Jane Street", relationship: "Sponsor", logo: { src: "/images/sponsors/jane-street.svg", width: 28, height: 28 } },
        { name: "Optiver" },
      ],
    });
    const region = screen.getByRole("region", { name: "Who supports us." });
    const [jane, optiver] = within(region).getAllByRole("heading", { level: 3 });
    expect(jane).toHaveTextContent("Jane Street");
    expect(jane.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
    expect(optiver.querySelector('span[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it("becomes an Advisors section when there are advisors but no partners", () => {
    renderAbout({ advisors: [{ name: "Dr. Lee", title: "Professor", department: "STOR" }] });
    expect(eyebrows().at(-1)).toBe("§ 03 — Advisors");
    expect(screen.getByRole("heading", { name: "Our advisors." })).toBeInTheDocument();
    expect(screen.getByText("Professor, STOR")).toBeInTheDocument();
  });

  it("renders three principles in one row and four in a 2 × 2 grid", () => {
    const { unmount } = renderAbout({ principles: base.principles.slice(0, 3) });
    const three = screen.getByRole("region", { name: "How we operate." }).querySelector("ol");
    expect(three?.className).toContain("lg:grid-cols-3");
    unmount();
    renderAbout();
    const four = screen.getByRole("region", { name: "How we operate." }).querySelector("ol");
    expect(four?.className).toContain("lg:grid-cols-2");
    expect(within(four as HTMLElement).getAllByRole("listitem")).toHaveLength(4);
  });
});
