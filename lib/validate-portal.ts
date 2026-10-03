import type { ContentLink, PortalContent } from "@/content/types";
import { assertNoProblems } from "@/lib/validation";

/** Internal only: a path ("/…", never "//host") or an on-page anchor ("#…"). */
const isInternalHref = (href: string) => /^\/(?!\/)/.test(href) || href.startsWith("#");

/** Dotted paths of every blank string in the content, e.g. "interviewPrep.lookFor[1]". */
function blankStrings(value: unknown, path: string): string[] {
  if (typeof value === "string") return value.trim() ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((item, i) => blankStrings(item, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => blankStrings(item, path ? `${path}.${key}` : key));
  }
  return [];
}

const sizeProblem = (label: string, count: number, min: number, max: number) =>
  count < min || count > max ? [`${label} must have ${min}–${max} entries (got ${count})`] : [];

/** Every content/portal.ts problem (spec 09 §5.1); empty when valid. */
export function collectPortalProblems(portal: PortalContent): string[] {
  const problems = blankStrings(portal, "").map((path) => `${path} must not be empty`);
  const { lookFor, prepare } = portal.interviewPrep;
  problems.push(...sizeProblem("interviewPrep.lookFor", lookFor.length, 2, 5));
  problems.push(...sizeProblem("interviewPrep.prepare", prepare.length, 2, 5));
  problems.push(...sizeProblem("clubLinks", portal.clubLinks.length, 1, 4));

  // The repository is public: a member resource URL must never be committed here (spec 09 §5.1).
  const links: Array<[string, ContentLink]> = [
    ...prepare.flatMap((item, i): Array<[string, ContentLink]> => (item.link ? [[`interviewPrep.prepare[${i}].link`, item.link]] : [])),
    ...portal.clubLinks.map((link, i): [string, ContentLink] => [`clubLinks[${i}]`, link]),
  ];
  for (const [path, link] of links) {
    if (!isInternalHref(link.href)) problems.push(`${path} must be an internal link ("/…" or "#…"), got "${link.href}"`);
  }
  return problems;
}

/** Fails the build with every content/portal.ts problem listed at once. */
export function validatePortal(portal: PortalContent): void {
  assertNoProblems("content/portal.ts", collectPortalProblems(portal));
}
