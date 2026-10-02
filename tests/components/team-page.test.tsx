import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { TeamPage } from "@/components/team/TeamPage";
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
const firms = (n: number): Placement[] => Array.from({ length: n }, (_, i) => ({ firm: `Firm ${String.fromCharCode(69 - i)}` }));

const renderTeam = (team: TeamContent, placements: Placement[] = []) =>
  render(<TeamPage team={team} placements={placements} recruiting={closed} now={now} />);
const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);

const co: Person = { slug: "co-one", name: "Co One", role: "Co-President, Trading", group: "co-president", order: 1 };
const dir: Person = { slug: "dir-one", name: "Dir One", role: "Director of Education", group: "director", order: 1, headshot: image, alt: "Portrait of Dir One" };

describe("TeamPage", () => {
  it("shows an honest empty state with no people, and hides placements", () => {
    const { container } = renderTeam({ people: [] });
    expect(screen.getByText("Board profiles will be posted here soon.")).toBeInTheDocument();
    expect(eyebrows()).toEqual(["§ 01 — Executive board"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });

  it("renders person cards with colour headshots, anchors and LinkedIn links", () => {
    const { container } = renderTeam({ academicYear: "2026–27", people: [pres] });
    expect(screen.getByRole("heading", { name: "Leadership, 2026–27." })).toBeInTheDocument();
    const card = container.querySelector("#ada-lovelace") as HTMLElement;
    expect(within(card).getByRole("img", { name: "Portrait of Ada Lovelace" }).className).not.toContain("grayscale");
    expect(within(card).getByText("'27 · Mathematics")).toBeInTheDocument();
    const linkedin = within(card).getByRole("link", { name: "Ada Lovelace on LinkedIn" });
    expect(linkedin).toHaveAttribute("target", "_blank");
  });

  it("orders tiers executive board, co-presidents, directors, with no track leads section", () => {
    renderTeam({ people: [dir, co, pres] });
    expect(eyebrows()).toEqual(["§ 01 — Executive board", "§ 02 — Co-Presidents", "§ 03 — Directors"]);
    expect(screen.queryByText(/track leads/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Your first point of contact.")).not.toBeInTheDocument();
  });

  it("sets the executive board in bold black", () => {
    const { container } = renderTeam({ people: [pres] });
    const name = within(container.querySelector("#ada-lovelace") as HTMLElement).getByRole("heading", { name: "Ada Lovelace" });
    expect(name.className).toContain("font-bold");
    expect(name.className).toContain("text-black");
  });

  it("renders directors with square headshots and the role leading", () => {
    const { container } = renderTeam({ people: [dir] });
    const card = container.querySelector("#dir-one") as HTMLElement;
    expect(card.querySelector(".aspect-square")).not.toBeNull();
    expect(card.textContent).toMatch(/^Director of EducationDir One/);
    // No class year or major: no meta line.
    expect(card.textContent).not.toContain("·");
    expect(card.className).toContain("text-center");
  });

  it("falls back to an initials tile without a headshot", () => {
    const { container } = renderTeam({ people: [co] });
    expect((container.querySelector("#co-one") as HTMLElement).textContent).toContain("CO");
  });

  it("shows placements sorted at five or more firms", () => {
    renderTeam({ people: [] }, firms(5));
    expect(eyebrows().at(-1)).toBe("§ 02 — Placements");
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
