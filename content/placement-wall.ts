import type { CompanyMark } from "@/content/types";
import aws from "@/public/images/companies/aws.png";
import citadel from "@/public/images/companies/citadel.png";
import infragrid from "@/public/images/companies/infragrid.png";
import jpmorganChase from "@/public/images/companies/jpmorgan-chase.svg";

/**
 * Firms shown in the scrolling strip in the /team header (docs/specs/04-team.md §4.1), in display order.
 * Separate from people (hover badges) and from content/placements.ts (the § 03 firm-name list).
 * To add a firm: put its official mark in public/images/companies and append an entry. Names are shown as captions.
 */
export const placementWall: CompanyMark[] = [
  { name: "Citadel", logo: citadel },
  { name: "JPMorgan Chase", logo: jpmorganChase },
  { name: "AWS", logo: aws },
  { name: "Infragrid", logo: infragrid },
];
