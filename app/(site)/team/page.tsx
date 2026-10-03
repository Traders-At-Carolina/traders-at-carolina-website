import type { Metadata } from "next";
import { TeamPage } from "@/components/team/TeamPage";
import { team } from "@/content/team";
import { getPeople, getPlacements, getSeason } from "@/lib/data/public";
import { validateTeam } from "@/lib/validate-team";

export const metadata: Metadata = {
  title: "Team",
  alternates: { canonical: "/team" },
  description: "Traders at Carolina is run by students. Meet the executive board, co-presidents and directors.",
};

/** Officers, placements and the academic year come from the admin (spec 06 §6.3, §6.8); the note is content/team.ts. */
export default async function Page() {
  const [people, { firms, wall }, season] = await Promise.all([getPeople(), getPlacements(), getSeason()]);
  const content = { note: team.note, academicYear: season.academicYear, people };
  validateTeam(content, firms);
  return <TeamPage team={content} placements={firms} wall={wall} />;
}
