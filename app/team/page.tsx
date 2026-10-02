import type { Metadata } from "next";
import { TeamPage } from "@/components/team/TeamPage";
import { placements } from "@/content/placements";
import { placementWall } from "@/content/placement-wall";
import { team } from "@/content/team";
import { validateTeam } from "@/lib/validate-team";

validateTeam(team, placements);

export const metadata: Metadata = {
  title: "Team",
  description: "Traders at Carolina is run by students. Meet the executive board, co-presidents and directors.",
};

export default function Page() {
  return <TeamPage team={team} placements={placements} wall={placementWall} />;
}
