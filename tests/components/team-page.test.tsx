import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { TeamPage } from "@/components/team/TeamPage";
import { membership } from "@/content/membership";
import type { Person, Placement, Recruiting, TeamContent } from "@/content/types";

const now = new Date("2027-01-05T17:00:00Z");
const closed: Recruiting = { applicationsOpen: false, applyUrl: "" };
const image = { src: "/images/team/x.jpg", width: 800, height: 1000, blurDataURL: "data:image/png;base64,iVBORw0KGgo=" } as StaticImageData;

const pres: Person = {
  slug: "ada-lovelace",
  name: "Ada Lovelace",
  role: "President",
  group: "exec",
  order: 1,
  classYear: 2027,
  major: "Mathematics",
  headshot: image,
  alt: "Portrait of Ada Lovelace",
  linkedin: "https://www.linkedin.com/in/ada",
  track: "research",
};
const lead: Person = {
  slug: "tom-trader",
  name: "Tom Trader",
  role: "Trading Lead",
  group: "track-lead",
  track: "trading",
  order: 1,
  classYear: 2028,
  major: "Statistics",
  placement: "Incoming QT intern, Firm X",
};
const firms = (n: number): Placement[] => Array.from({ length: n }, (_, i) => ({ firm: `Firm ${String.fromCharCode(69 - i)}` }));

const renderTeam = (team: TeamContent, placements: Placement[] = []) =>
  render(<TeamPage team={team} placements={placements} tracks={membership.tracks} recruiting={closed} now={now} />);
const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);

describe("TeamPage", () => {
  it("shows honest empty states with no people, and hides placements", () => {
    const { container } = renderTeam({ people: [] });
    expect(screen.getByText("Board profiles will be posted here soon.")).toBeInTheDocument();
    expect(screen.getAllByText("Lead to be announced.")).toHaveLength(3);
    expect(eyebrows()).toEqual(["§ 01 — Executive board", "§ 02 — Track leads"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });

  it("renders person cards with grayscale headshots, anchors and LinkedIn links", () => {
    const { container } = renderTeam({ academicYear: "2026–27", people: [pres, lead] });
    expect(screen.getByRole("heading", { name: "Leadership, 2026–27." })).toBeInTheDocument();
    const card = container.querySelector("#ada-lovelace") as HTMLElement;
    expect(within(card).getByRole("img", { name: "Portrait of Ada Lovelace" }).className).toContain("grayscale");
    expect(within(card).getByText("'27 · Mathematics")).toBeInTheDocument();
    const linkedin = within(card).getByRole("link", { name: "Ada Lovelace on LinkedIn" });
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Incoming QT intern, Firm X")).toBeInTheDocument();
  });

  it("renders co-presidents, executive board and directors as ordered tiers", () => {
    const co: Person = { slug: "co-one", name: "Co One", role: "Co-President, Trading", group: "co-president", order: 1 };
    const dir: Person = { slug: "dir-one", name: "Dir One", role: "Director of Education", group: "director", order: 1 };
    const { container } = renderTeam({ people: [dir, pres, co] });
    expect(eyebrows()).toEqual(["§ 01 — Co-Presidents", "§ 02 — Executive board", "§ 03 — Directors", "§ 04 — Track leads"]);
    // No class year or major: the card shows no meta line.
    expect((container.querySelector("#co-one") as HTMLElement).textContent).not.toContain("·");
    expect(screen.getByText("Director of Education")).toBeInTheDocument();
  });

  it("falls back to an initials tile without a headshot", () => {
    const { container } = renderTeam({ people: [lead] });
    expect((container.querySelector("#tom-trader") as HTMLElement).textContent).toContain("TT");
  });

  it("shows an exec who leads a track once, with a Led by line in their track", () => {
    const { container } = renderTeam({ people: [pres, lead] });
    expect(container.querySelectorAll("#ada-lovelace")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Led by Ada Lovelace, President/ })).toHaveAttribute("href", "#ada-lovelace");
    expect(screen.getAllByText("Lead to be announced.")).toHaveLength(1);
  });

  it("shows placements sorted at five or more firms", () => {
    renderTeam({ people: [] }, firms(5));
    expect(eyebrows().at(-1)).toBe("§ 03 — Placements");
    const region = screen.getByRole("region", { name: "Where members have gone." });
    expect(within(region).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Firm A",
      "Firm B",
      "Firm C",
      "Firm D",
      "Firm E",
    ]);
  });
});
