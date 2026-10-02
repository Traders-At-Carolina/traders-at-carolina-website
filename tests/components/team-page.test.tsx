import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { TeamPage } from "@/components/team/TeamPage";
import type { CompanyMark, Person, Placement, Recruiting, TeamContent } from "@/content/types";

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

const mark = (name: string): CompanyMark => ({ name, logo: { ...image, src: `/images/companies/${name}.png` } as StaticImageData });

describe("TeamPage", () => {
  it("shows each company the team has worked at in the header, once, instead of the random walk", () => {
    const people: Person[] = [
      { ...pres, company: mark("Citadel") },
      { ...co, company: mark("Citadel") },
      { ...dir, company: mark("AWS") },
    ];
    const { container } = renderTeam({ people });
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByText("Where we've worked")).toBeInTheDocument();
    // Each mark carries its name as a visible caption (Infragrid's mark is a bare square); the image itself is decorative.
    const cells = within(header).getAllByRole("listitem");
    expect(cells.map((cell) => cell.textContent)).toEqual(["Citadel", "AWS"]);
    expect(header.querySelectorAll("img[alt='']")).toHaveLength(2);
    expect(header.querySelector("svg")).not.toBeInTheDocument();
  });

  it("leaves the header art out when nobody has a company", () => {
    const { container } = renderTeam({ people: [pres] });
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).queryByText("Where we've worked")).not.toBeInTheDocument();
    expect(header.querySelector("svg")).not.toBeInTheDocument();
  });

  it("shows an honest empty state with no people, and hides placements", () => {
    const { container } = renderTeam({ people: [] });
    expect(screen.getByText("Board profiles will be posted here soon.")).toBeInTheDocument();
    expect(eyebrows()).toEqual(["§ 01 — Operations"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });

  it("renders person cards with colour headshots, anchors and LinkedIn links", () => {
    const { container } = renderTeam({ academicYear: "2026–27", people: [pres] });
    expect(screen.getByRole("heading", { name: "Leadership, 2026–27" })).toBeInTheDocument();
    const card = container.querySelector("#ada-lovelace") as HTMLElement;
    expect(within(card).getByRole("img", { name: "Portrait of Ada Lovelace" }).className).not.toContain("grayscale");
    expect(within(card).getByText("'27 · Mathematics")).toBeInTheDocument();
    const linkedin = within(card).getByRole("link", { name: "Ada Lovelace on LinkedIn" });
    expect(linkedin).toHaveAttribute("target", "_blank");
  });

  it("orders tiers executive board, co-presidents, directors, with no track leads section", () => {
    renderTeam({ people: [dir, co, pres] });
    // Eyebrows say what each tier does rather than repeating its heading.
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Leadership", "§ 03 — Programs"]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent).slice(0, 3)).toEqual([
      "Executive Board",
      "Co-Presidents",
      "Directors",
    ]);
    expect(screen.queryByText(/track leads/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Your first point of contact.")).not.toBeInTheDocument();
  });

  it("uses the same role-then-name treatment for every tier, with the name as the prominent line", () => {
    const { container } = renderTeam({ people: [pres, co, dir] });
    for (const slug of ["ada-lovelace", "co-one", "dir-one"]) {
      const card = container.querySelector(`#${slug}`) as HTMLElement;
      expect(card.querySelector("p")?.className).toContain("text-caption");
      expect(card.querySelector("h3")?.className).toContain("text-h3");
    }
  });

  it("puts a decorative company icon on the headshot only for people with a company", () => {
    const logo = { src: "/images/companies/x.png", width: 192, height: 192 } as StaticImageData;
    const { container } = renderTeam({
      people: [{ ...dir, placement: "Previously at AWS", company: { name: "AWS", logo } }, { ...co }],
    });
    const badge = container.querySelector("#dir-one .group > span[aria-hidden='true']") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.className).toContain("group-hover:opacity-100");
    expect(badge.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("#co-one .group > span[aria-hidden='true']")).toBeNull();
  });

  it("shows a person's placement line when set", () => {
    const { container } = renderTeam({ people: [{ ...dir, placement: "Previously at AWS" }] });
    expect(container.querySelector("#dir-one")).toHaveTextContent("Previously at AWS");
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
