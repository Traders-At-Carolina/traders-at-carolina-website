import type { CompanyMark, Person, Placement } from "@/content/types";

/** The placements section appears once there are enough firms to be meaningful (spec 04 §4.4). */
export const PLACEMENT_THRESHOLD = 5;

const byOrder = (a: Person, b: Person) => a.order - b.order;

export function execMembers(people: Person[]): Person[] {
  return people.filter((p) => p.group === "exec").sort(byOrder);
}

export function coPresidents(people: Person[]): Person[] {
  return people.filter((p) => p.group === "co-president").sort(byOrder);
}

export function directors(people: Person[]): Person[] {
  return people.filter((p) => p.group === "director").sort(byOrder);
}

/** Meta line under a name, e.g. "'27 · Mathematics"; empty when neither is set. */
export function personMeta(person: Pick<Person, "classYear" | "major">): string {
  return [person.classYear ? shortClassYear(person.classYear) : "", person.major ?? ""].filter(Boolean).join(" · ");
}

/** Each company people have worked at, once, in the order they first appear (the Team header wall). */
export function companyMarks(people: Person[]): CompanyMark[] {
  const marks = new Map<string, CompanyMark>();
  for (const { company } of people) {
    if (company && !marks.has(company.name)) marks.set(company.name, company);
  }
  return [...marks.values()];
}

/** slug → name for everyone who leads a track, used by /membership "Led by" links (spec 04 §5). */
export function trackLeadNames(people: Person[]): Record<string, string> {
  return Object.fromEntries(people.filter((p) => p.track).map((p) => [p.slug, p.name]));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

/** 2027 → "'27" */
export function shortClassYear(year: number): string {
  return `'${String(year).slice(-2)}`;
}

export function showPlacements(placements: Placement[]): boolean {
  return placements.length >= PLACEMENT_THRESHOLD;
}

export function sortFirms(placements: Placement[]): string[] {
  return placements.map((p) => p.firm).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}
