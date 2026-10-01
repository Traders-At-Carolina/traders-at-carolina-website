import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";
import type { Recruiting } from "@/content/types";

const now = new Date("2027-01-05T17:00:00Z");
const closed: Recruiting = { applicationsOpen: false, applyUrl: "" };

const renderPage = (content = membership, leadNames: Record<string, string> = {}, recruiting = closed) =>
  render(<MembershipPage membership={content} leadNames={leadNames} recruiting={recruiting} now={now} />);

describe("MembershipPage", () => {
  it("numbers the four sections and has one h1 and one navy band", () => {
    const { container } = renderPage();
    expect(screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent)).toEqual([
      "§ 01 — How it works",
      "§ 02 — Tracks",
      "§ 03 — What we do",
      "§ 04 — Expectations",
    ]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });

  it("renders the three tracks in order with stable anchors and no 'required' wording inside them", () => {
    const { container } = renderPage();
    const articles = Array.from(container.querySelectorAll("article"));
    expect(articles.map((a) => a.id)).toEqual(["trading", "research", "development"]);
    articles.forEach((a) => expect(a.textContent).not.toMatch(/required|requirements/i));
    expect(screen.getByText("None of these are required to join.")).toBeInTheDocument();
  });

  it("links a track lead to their Team card when the slug resolves", () => {
    const tracks = membership.tracks.map((t, i) => (i === 1 ? { ...t, leadSlug: "jane-doe" } : t));
    renderPage({ ...membership, tracks }, { "jane-doe": "Jane Doe" });
    expect(screen.getByRole("link", { name: "Led by Jane Doe" })).toHaveAttribute("href", "/team#jane-doe");
  });

  it("exposes activity column headers to assistive tech and shows frequency only when set", () => {
    const activities = membership.activities.map((a, i) => (i === 0 ? { ...a, frequency: "Weekly" } : a));
    renderPage({ ...membership, activities });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Activity",
      "Description",
      "Frequency",
      "Tracks",
    ]);
    expect(within(table).getAllByRole("row")).toHaveLength(1 + membership.activities.length);
    expect(within(table).getByText("Weekly")).toBeInTheDocument();
  });

  it("shows only expectations that have values, and the switching note only when set", () => {
    renderPage();
    const dl = screen.getByRole("region", { name: "What we ask of members." }).querySelector("dl") as HTMLElement;
    expect(Array.from(dl.querySelectorAll("dt")).map((dt) => dt.textContent)).toEqual(["Prerequisites"]);
    expect(screen.queryByText(/switch tracks/)).not.toBeInTheDocument();
  });
});
