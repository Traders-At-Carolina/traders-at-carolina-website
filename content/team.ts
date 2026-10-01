import type { TeamContent } from "@/content/types";
import estherYu from "@/public/images/team/esther-yu.jpg";
import isaac from "@/public/images/team/isaac.jpg";
import jasonPereira from "@/public/images/team/jason-pereira.jpg";
import jinghan from "@/public/images/team/jinghan.jpg";
import rahulBammidi from "@/public/images/team/rahul-bammidi.jpg";
import sutharsikaKumar from "@/public/images/team/sutharsika-kumar.jpg";
import viktorya from "@/public/images/team/viktorya.jpg";

/**
 * Exec board and track leads (docs/specs/04-team.md). Officers edit this file each year.
 *
 * Add a person:
 *   import janeDoe from "@/public/images/team/jane-doe.jpg";
 *   {
 *     slug: "jane-doe", name: "Jane Doe", role: "President", group: "exec", order: 1,
 *     classYear: 2027, major: "Mathematics", headshot: janeDoe, alt: "Portrait of Jane Doe",
 *     linkedin: "https://www.linkedin.com/in/…",
 *   }
 * - group: "co-president" | "exec" | "director" | "track-lead" (shown in that order on /team).
 * - classYear and major are optional; the meta line under the name shows whatever is set.
 * - Track leads: group "track-lead" plus track ("trading" | "research" | "development").
 * - An exec who also leads a track: keep group "exec" and add track; they appear once, under the board.
 * - placement: only with the person's consent.
 */
export const team: TeamContent = {
  people: [
    {
      slug: "rahul-bammidi",
      name: "Rahul Bammidi",
      role: "Co-President, Trading",
      group: "co-president",
      track: "trading",
      order: 1,
      headshot: rahulBammidi,
      alt: "Portrait of Rahul Bammidi",
    },
    {
      slug: "sutharsika-kumar",
      name: "Sutharsika Kumar",
      role: "Co-President, Technology",
      group: "co-president",
      track: "development",
      order: 2,
      headshot: sutharsikaKumar,
      alt: "Portrait of Sutharsika Kumar",
    },
    {
      slug: "jack-zaptin",
      name: "Jack Zaptin",
      role: "Executive Board",
      group: "exec",
      order: 1,
    },
    {
      slug: "esther-yu",
      name: "Esther Yu",
      role: "Executive Board",
      group: "exec",
      order: 2,
      headshot: estherYu,
      alt: "Portrait of Esther Yu",
    },
    {
      slug: "jason-pereira",
      name: "Jason Pereira",
      role: "Director of Technology",
      group: "director",
      order: 1,
      headshot: jasonPereira,
      alt: "Portrait of Jason Pereira",
    },
    {
      slug: "isaac",
      name: "Isaac",
      role: "Director of Education",
      group: "director",
      order: 2,
      headshot: isaac,
      alt: "Portrait of Isaac",
    },
    {
      slug: "viktorya",
      name: "Viktorya",
      role: "Director of Education",
      group: "director",
      order: 3,
      headshot: viktorya,
      alt: "Portrait of Viktorya",
    },
    {
      slug: "jinghan",
      name: "Jinghan",
      role: "Director of Industry Relations",
      group: "director",
      order: 4,
      headshot: jinghan,
      alt: "Portrait of Jinghan",
    },
  ],
};
