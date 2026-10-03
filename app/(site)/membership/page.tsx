import type { Metadata } from "next";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";
import { team } from "@/content/team";
import { getMembershipPhotos } from "@/lib/data/public";
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

/** Photo bands come from the admin photo library's Membership slots (spec 06 §6.6). */
export default async function Page() {
  return <MembershipPage membership={{ ...membership, photos: await getMembershipPhotos() }} leadNames={leadNames} />;
}
