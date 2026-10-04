import type { CompanyMark, TeamContent } from "@/content/types";
import awsLogo from "@/public/images/companies/aws.png";
import citadelLogo from "@/public/images/companies/citadel.png";
import infragridLogo from "@/public/images/companies/infragrid.png";
import estherYu from "@/public/images/team/esther-yu.jpg";
import isaacNobles from "@/public/images/team/isaac-nobles.jpg";
import jackZaptin from "@/public/images/team/jack-zaptin.jpg";
import jasonPereira from "@/public/images/team/jason-pereira.jpg";
import jinghanHe from "@/public/images/team/jinghan-he.jpg";
import rahulBammidi from "@/public/images/team/rahul-bammidi.jpg";
import sutharsikaKumar from "@/public/images/team/sutharsika-kumar.jpg";
import viktoryaHunanyan from "@/public/images/team/viktorya-hunanyan.jpg";

/**
 * Leadership: executive board, co-presidents and directors (docs/specs/04-team.md). Officers edit this file each year.
 *
 * Add a person:
 *   import janeDoe from "@/public/images/team/jane-doe.jpg";
 *   {
 *     slug: "jane-doe", name: "Jane Doe", role: "President", group: "exec", order: 1,
 *     classYear: 2027, major: "Mathematics", headshot: janeDoe, alt: "Portrait of Jane Doe",
 *     linkedin: "https://www.linkedin.com/in/…",
 *   }
 * - group: "exec" | "co-president" | "director" (shown in that order on /team; "track-lead" is reserved for /membership links and is not shown).
 * - classYear and major are optional; the meta line under the name shows whatever is set.
 * - track ("trading" | "research" | "development"): set only to link a person from /membership "Led by".
 * - company: the placement company's icon (public/images/companies), transparent background, drawn directly on the headshot on hover; any aspect ratio fits the box.
 * - placement: one line, only with the person's consent: a past or incoming role ("Previously at Citadel") or a notable result.
 */
const citadel: CompanyMark = { name: "Citadel", logo: citadelLogo };
// White-text version: the logo sits straight on the photo, not on a white tile.
const aws: CompanyMark = { name: "AWS", logo: awsLogo };
const infragrid: CompanyMark = { name: "Infragrid", logo: infragridLogo };

export const team: TeamContent = {
  note: "Behind every education session, mock trade and firm conversation is this team. The co-presidents set the direction for the trading and technology sides of the club, and the executive board keeps it running day to day. The directors turn that direction into practice: Education builds the curriculum members learn from, Technology builds and maintains the tools they work with, and Industry Relations connects them with the firms they hope to join. Together, they carry out the club's mission of preparing UNC students for careers in quantitative trading, research and engineering.",
  people: [
    {
      slug: "rahul-bammidi",
      name: "Rahul Bammidi",
      role: "Co-President, Trading",
      group: "co-president",
      order: 1,
      headshot: rahulBammidi,
      alt: "Portrait of Rahul Bammidi",
    },
    {
      slug: "sutharsika-kumar",
      name: "Sutharsika Kumar",
      role: "Co-President, Technology",
      group: "co-president",
      order: 2,
      headshot: sutharsikaKumar,
      alt: "Portrait of Sutharsika Kumar",
      placement: "Previously at Infragrid",
      company: infragrid,
    },
    {
      slug: "jack-zaptin",
      name: "Jack Zaptin",
      role: "Executive Board Member",
      group: "exec",
      order: 1,
      headshot: jackZaptin,
      alt: "Portrait of Jack Zaptin",
      placement: "Previously at Citadel",
      company: citadel,
    },
    {
      slug: "esther-yu",
      name: "Esther Yu",
      role: "Executive Board Member",
      group: "exec",
      order: 2,
      headshot: estherYu,
      alt: "Portrait of Esther Yu",
      placement: "1st place, Citadel Challenge",
      company: citadel,
    },
    {
      slug: "jason-pereira",
      name: "Jason Pereira",
      role: "Director of Technology",
      group: "director",
      order: 1,
      headshot: jasonPereira,
      alt: "Portrait of Jason Pereira",
      placement: "Previously at AWS",
      company: aws,
    },
    {
      slug: "isaac-nobles",
      name: "Isaac Nobles",
      role: "Director of Education",
      group: "director",
      order: 2,
      headshot: isaacNobles,
      alt: "Portrait of Isaac Nobles",
    },
    {
      slug: "viktorya-hunanyan",
      name: "Viktorya Hunanyan",
      role: "Director of Education",
      group: "director",
      order: 3,
      headshot: viktoryaHunanyan,
      alt: "Portrait of Viktorya Hunanyan",
    },
    {
      slug: "jinghan-he",
      name: "Jinghan He",
      role: "Director of Industry Relations",
      group: "director",
      order: 4,
      headshot: jinghanHe,
      alt: "Portrait of Jinghan He",
    },
  ],
};
