import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { TeamPage } from "@/components/team/TeamPage";
import type { CompanyMark, Person, Placement, TeamContent } from "@/content/types";

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

const renderTeam = (team: TeamContent, placements: Placement[] = [], wall: CompanyMark[] = []) =>
  render(<TeamPage team={team} placements={placements} wall={wall} />);
const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);

const co: Person = { slug: "co-one", name: "Co One", role: "Co-President, Trading", group: "co-president", order: 1 };
const dir: Person = { slug: "dir-one", name: "Dir One", role: "Director of Education", group: "director", order: 1, headshot: image, alt: "Portrait of Dir One" };

const mark = (name: string): CompanyMark => ({ name, logo: { ...image, src: `/images/companies/${name}.png` } as StaticImageData });

describe("TeamPage", () => {
  it("shows the wall's firms in a looping header strip instead of the random walk", () => {
    const wall = ["Citadel", "JPMorgan Chase", "AWS", "Infragrid"].map(mark);
    const { container } = renderTeam({ people: [pres] }, [], wall);
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByText("Where we've worked")).toBeInTheDocument();
    // Each mark carries its name as a visible caption (Infragrid's mark is a bare square); the image itself is decorative.
    expect(within(header).getAllByRole("listitem").map((cell) => cell.textContent)).toEqual([
      "Citadel",
      "JPMorgan Chase",
      "AWS",
      "Infragrid",
    ]);
    // The strip loops by repeating the list (enough times to fill wide screens); the copies are hidden from assistive
    // tech so firms are announced once.
    const lists = Array.from(header.querySelectorAll("ul"));
    expect(lists.length).toBeGreaterThanOrEqual(2);
    expect(lists[0]).not.toHaveAttribute("aria-hidden");
    for (const copy of lists.slice(1)) expect(copy).toHaveAttribute("aria-hidden", "true");
    expect(header.querySelectorAll("img[alt='']")).toHaveLength(4 * lists.length);
    expect(header.querySelector("svg")).not.toBeInTheDocument();
  });

  it("leaves the header art out when the wall has no firms", () => {
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
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(0);
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

  it("sizes every headshot the same, whichever tier the person is in", () => {
    const { container } = renderTeam({ people: [pres, co, dir] });
    // The width class on each card's wrapper sets the headshot size; the photo itself is always square.
    const widths = ["ada-lovelace", "co-one", "dir-one"].map((slug) => (container.querySelector(`#${slug}`) as HTMLElement).parentElement?.className);
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toContain("sm:w-48");
    for (const slug of ["ada-lovelace", "co-one", "dir-one"]) {
      expect((container.querySelector(`#${slug} > div`) as HTMLElement).className).toContain("aspect-square");
    }
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

  it("renders a headshot that has no blur placeholder", () => {
    const plain = { src: "/images/team/plain.jpg", width: 800, height: 800 };
    const { container } = renderTeam({ people: [{ ...dir, headshot: plain }] });
    expect(container.querySelector("#dir-one img")).toHaveAttribute("alt", "Portrait of Dir One");
  });

  it("adds the firm field after the tiers as the next section, with each firm once", () => {
    renderTeam({ people: [dir, co, pres] }, [], ["Citadel", "AWS"].map(mark));
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Leadership", "§ 03 — Programs", "§ 04 — Where we've worked"]);
    const region = screen.getByRole("region", { name: "Where our members have worked" });
    expect(within(region).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Citadel", "AWS"]);
  });

  it("puts the firm field, then placements, after the team note at the end of the page", () => {
    renderTeam({ people: [pres], note: "The team runs the club." }, firms(5), [mark("Citadel")]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent).slice(-3)).toEqual([
      "How the team serves the mission",
      "Where our members have worked",
      "Where members have gone.",
    ]);
    // The note is unnumbered, so the field still takes the number after the tiers.
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Where we've worked", "§ 03 — Placements"]);
  });

  it("numbers placements after the firm field", () => {
    renderTeam({ people: [] }, firms(5), [mark("Citadel")]);
    expect(eyebrows()).toEqual(["§ 01 — Operations", "§ 02 — Where we've worked", "§ 03 — Placements"]);
  });

  it("leaves the firm field out when the wall has no firms", () => {
    renderTeam({ people: [pres] });
    expect(screen.queryByRole("region", { name: "Where our members have worked" })).not.toBeInTheDocument();
  });
});
