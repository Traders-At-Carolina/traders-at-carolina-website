import type { Metadata } from "next";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";
import { site } from "@/content/site";
import { validateMembership } from "@/lib/validate-membership";

// Track leads resolve against content/team.ts once the Team page (spec 04) exists; until then none are known.
const leadNames: Record<string, string> = {};

validateMembership(membership, Object.keys(leadNames));

export const metadata: Metadata = {
  title: "Membership",
  description: membership.header.lead,
};

export default function Page() {
  return <MembershipPage membership={membership} leadNames={leadNames} recruiting={site.recruiting} now={new Date()} />;
}
