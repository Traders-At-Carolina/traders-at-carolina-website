import type { Metadata } from "next";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";
import { site } from "@/content/site";
import { team } from "@/content/team";
import { trackLeadNames } from "@/lib/team";
import { validateMembership } from "@/lib/validate-membership";

// Track leads resolve against content/team.ts; an unknown leadSlug fails the build (spec 03 AC4).
const leadNames = trackLeadNames(team.people);

validateMembership(
  membership,
  team.people.map((p) => p.slug),
);

export const metadata: Metadata = {
  title: "Membership",
  alternates: { canonical: "/membership" },
  description: membership.header.lead,
};

export default function Page() {
  return <MembershipPage membership={membership} leadNames={leadNames} recruiting={site.recruiting} now={new Date()} />;
}
