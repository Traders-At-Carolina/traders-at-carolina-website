import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { PortalPage } from "@/components/portal/PortalPage";
import { apply } from "@/content/apply";
import { events } from "@/content/events";
import { membership } from "@/content/membership";
import { portal } from "@/content/portal";
import { site } from "@/content/site";
import { requireViewer } from "@/lib/auth/viewer";
import { getPeople, getTracks } from "@/lib/data/public";
import {
  myRequest,
  portalAnnouncements,
  portalEvents,
  portalLinks,
  portalResources,
  portalSettings,
  recruitingTimeline,
} from "@/lib/data/portal";
import { audienceViewer } from "@/lib/members/audience";
import { requestMembership } from "@/lib/members/requests";
import { trackLeadNames } from "@/lib/team";
import { validateEvents } from "@/lib/validate-events";
import { validatePortal } from "@/lib/validate-portal";

validatePortal(portal);
validateEvents(events);


export const metadata: Metadata = {
  title: "Portal",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: false },
};

/**
 * The signed-in landing page (spec 09). Rendered per request: requireViewer() reads the session and sends signed-out
 * visitors to sign-in before anything renders. Every getter filters for this viewer on the server (spec 06 §8).
 */
export default async function Page() {
  const viewer = await requireViewer();
  const audience = audienceViewer(viewer.isMember);
  const [settings, upcoming, resources, announcements, links, timeline, request, people, tracks] = await Promise.all([
    portalSettings(),
    portalEvents(audience),
    portalResources(audience),
    portalAnnouncements(audience),
    portalLinks(audience),
    recruitingTimeline(),
    viewer.isMember ? null : myRequest(viewer.userId),
    getPeople(),
    getTracks(),
  ]);
  return (
    <PortalPage
      viewer={viewer}
      portal={portal}
      membership={{ ...membership, tracks }}
      apply={apply}
      site={site}
      timeline={timeline}
      events={upcoming}
      resources={resources}
      announcements={announcements}
      links={links}
      settings={settings}
      request={request}
      requestAction={requestMembership}
      leadNames={trackLeadNames(people)}
      now={new Date()}
      account={<UserButton />}
    />
  );
}
