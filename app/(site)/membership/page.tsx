import type { Metadata } from "next";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";
import { getMembershipPhotos, getPeople, getTracks } from "@/lib/data/public";
import { trackLeadNames } from "@/lib/team";
import { validateMembership } from "@/lib/validate-membership";

export const metadata: Metadata = {
  title: "Membership",
  alternates: { canonical: "/membership" },
  description: membership.header.lead,
};

/** Tracks, track leads and photo bands come from the admin (spec 06 §6.6, §6.9); the rest is content/membership.ts. */
export default async function Page() {
  const [photos, tracks, people] = await Promise.all([getMembershipPhotos(), getTracks(), getPeople()]);
  const content = { ...membership, photos, tracks };
  // Track leads resolve against visible officers; an unknown lead fails this regeneration, not the live page (03 AC4).
  validateMembership(
    content,
    people.map((p) => p.slug),
  );
  return <MembershipPage membership={content} leadNames={trackLeadNames(people)} />;
}
