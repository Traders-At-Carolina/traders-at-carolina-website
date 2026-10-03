import { Fragment, type ReactNode } from "react";
import { Process } from "@/components/apply/Process";
import { Button } from "@/components/Button";
import { EventCard } from "@/components/EventCard";
import { Activities } from "@/components/membership/Activities";
import { Tracks } from "@/components/membership/Tracks";
import { PageHeader } from "@/components/PageHeader";
import { AccountBar } from "@/components/portal/AccountBar";
import { Announcements } from "@/components/portal/Announcements";
import { InterviewPrep } from "@/components/portal/InterviewPrep";
import { Learning } from "@/components/portal/Learning";
import { MemberTools } from "@/components/portal/MemberTools";
import { RequestAccess } from "@/components/portal/RequestAccess";
import { ResourceList } from "@/components/portal/ResourceList";
import { UpcomingEvents } from "@/components/portal/UpcomingEvents";
import { TextLink } from "@/components/TextLink";
import type { ApplyContent, ClubEvent, MembershipContent, PortalContent, Site } from "@/content/types";
import { ctaFromLabel } from "@/lib/analytics/attributes";
import { applyPrimaryAction, processLead, stageDates, stageEfforts } from "@/lib/apply";
import { getApplicationState } from "@/lib/applications";
import type { Viewer } from "@/lib/auth/viewer";
import type {
  AccessRequest,
  PortalAnnouncement,
  PortalLink,
  PortalResource,
  PortalSettings,
  RecruitingTimeline,
  ResourceSection,
} from "@/lib/data/portal";
import { eventTypeLabel } from "@/lib/events";
import { numberSections } from "@/lib/home";
import type { RequestResult } from "@/lib/members/requests";
import { portalApplyAction, portalSections, upcomingForViewer, type PortalSectionKey } from "@/lib/portal";

/** Everything comes from the spec 06 §8 getters, already filtered for this viewer on the server. */
type PortalPageProps = {
  viewer: Viewer;
  portal: PortalContent;
  membership: MembershipContent;
  apply: ApplyContent;
  site: Pick<Site, "mission" | "contactEmail">;
  /** recruitingTimeline(): shown to non-members only. */
  timeline: RecruitingTimeline;
  /** portalEvents(viewer): upcoming, soonest first. */
  events: ClubEvent[];
  resources: Record<ResourceSection, PortalResource[]>;
  announcements: PortalAnnouncement[];
  links: PortalLink[];
  settings: PortalSettings;
  /** myRequest(userId), for non-members. */
  request: AccessRequest | null;
  /** The requestMembership server action; Request access shows only with it, for non-members, while requests are open. */
  requestAction?: (input: { note?: string }) => Promise<RequestResult>;
  /** slug → name for track leads (content/team.ts). */
  leadNames: Record<string, string>;
  /** Request time; injectable for tests. */
  now: Date;
  /** Clerk's UserButton, injected by the route so this component never touches Clerk. */
  account?: ReactNode;
};

/**
 * Composes /portal (spec 09 §3): members get their resources first; everyone else gets the recruiting timeline and
 * interview prep first. Sections are numbered in the order they render. Rendered per request, so the application
 * state is current and needs no DeadlineSwitch.
 */
export function PortalPage(props: PortalPageProps) {
  const { viewer, portal, membership, apply, site, timeline, events, resources, announcements, links, settings, request, requestAction } = props;
  const keys = portalSections(viewer);
  const n = numberSections(keys);
  const { headings } = portal;
  const { recruiting } = timeline;
  const state = getApplicationState(props.now, recruiting);
  const action = portalApplyAction(applyPrimaryAction(state, recruiting, site.contactEmail));
  const trackNames = Object.fromEntries(membership.tracks.map((t) => [t.id, t.name]));
  const canRequest = !viewer.isMember && settings.acceptRequests && requestAction !== undefined;

  const sections: Record<PortalSectionKey, () => ReactNode> = {
    recruiting: () => (
      <Process
        index={n.recruiting}
        eyebrow="Recruiting"
        title={headings.recruiting}
        id="recruiting"
        stages={apply.stages}
        dates={stageDates(state, recruiting)}
        efforts={stageEfforts(apply.stages, recruiting)}
        lead={processLead(state, recruiting.cycleLabel)}
        current={state.status === "open" ? 0 : undefined}
        action={
          <>
            <Button href={action.href} external={action.external} variant="secondary" track={{ cta: ctaFromLabel(action.label), placement: "portal" }}>
              {action.label}
            </Button>
            {timeline.events.length > 0 ? (
              <div className="mt-12 md:mt-16">
                <h3 className="text-h3">Recruiting events</h3>
                <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {timeline.events.map((event) => (
                    <li key={`${event.startsAt}-${event.title}`}>
                      <EventCard event={event} label={eventTypeLabel(event.type)} showDescription />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {resources.recruiting.length > 0 ? (
              <div className="mt-12 md:mt-16">
                <h3 className="text-h3">Recruiting resources</h3>
                <ResourceList resources={resources.recruiting} trackNames={trackNames} className="mt-4" />
              </div>
            ) : null}
          </>
        }
      />
    ),
    prep: () => (
      <InterviewPrep index={n.prep} title={headings.prep} prep={portal.interviewPrep} resources={resources["interview-prep"]} trackNames={trackNames} />
    ),
    events: () => <UpcomingEvents index={n.events} title={headings.events} events={upcomingForViewer(events, viewer)} empty={portal.eventsEmpty} />,
    tracks: () => <Tracks index={n.tracks} title={headings.tracks} tracks={membership.tracks} leadNames={props.leadNames} />,
    club: () => (
      <Activities
        index={n.club}
        eyebrow="The club"
        title={headings.club}
        lead={site.mission}
        activities={membership.activities}
        tracks={membership.tracks}
        footer={
          <nav aria-label="More about the club" className="mt-10">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {portal.clubLinks.map((link) => (
                <li key={link.href}>
                  <TextLink href={link.href} arrow>
                    {link.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        }
      />
    ),
    learning: () => (
      <Learning
        index={n.learning}
        title={headings.learning}
        lead={portal.learning.lead}
        empty={portal.learning.empty}
        learning={resources.learning}
        other={resources.other}
        trackNames={trackNames}
      />
    ),
    tools: () => <MemberTools index={n.tools} title={headings.tools} tools={portal.tools} links={links} />,
  };

  return (
    <>
      <PageHeader
        eyebrow="Portal"
        title={viewer.firstName ? `Welcome, ${viewer.firstName}.` : "Welcome."}
        lead={viewer.isMember ? (settings.welcomeMember ?? portal.header.memberLead) : (settings.welcomeVisitor ?? portal.header.visitorLead)}
        seed={909}
      >
        <AccountBar viewer={viewer} account={props.account} />
        {canRequest ? (
          <div className="mt-6">
            <RequestAccess copy={portal.requestAccess} request={request} action={requestAction} />
          </div>
        ) : null}
      </PageHeader>
      <Announcements announcements={announcements} />
      {keys.map((key) => (
        <Fragment key={key}>{sections[key]()}</Fragment>
      ))}
    </>
  );
}
