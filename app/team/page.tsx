import type { Metadata } from "next";
import { TeamPage } from "@/components/team/TeamPage";
import { membership } from "@/content/membership";
import { placements } from "@/content/placements";
import { site } from "@/content/site";
import { team } from "@/content/team";
import { validateTeam } from "@/lib/validate-team";

validateTeam(team, placements);

export const metadata: Metadata = {
  title: "Team",
  description: "Traders at Carolina is run by students. Meet the executive board and the leads for each track.",
};

export default function Page() {
  return <TeamPage team={team} placements={placements} tracks={membership.tracks} recruiting={site.recruiting} now={new Date()} />;
}
