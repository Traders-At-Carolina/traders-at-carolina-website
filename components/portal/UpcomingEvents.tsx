import { EventCard } from "@/components/EventCard";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { ClubEvent } from "@/content/types";
import { eventTypeLabel } from "@/lib/events";

type UpcomingEventsProps = {
  index: number;
  title: string;
  /** Already filtered to upcoming events and sorted, soonest first. */
  events: ClubEvent[];
  /** One line shown when nothing is scheduled. */
  empty: string;
};

/** Club events the viewer may see, soonest first, labelled by type; one line when nothing is scheduled (spec 09 §4.4). */
export function UpcomingEvents({ index, title, events, empty }: UpcomingEventsProps) {
  return (
    <Section id="upcoming" labelledBy="upcoming-title">
      <SectionHeader index={index} eyebrow="Upcoming" title={title} id="upcoming-title" />
      <Reveal className="mt-12 md:mt-16">
        {events.length > 0 ? (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={`${event.startsAt}-${event.title}`}>
                <EventCard event={event} label={eventTypeLabel(event.type)} showDescription />
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-prose text-body text-ink-2">{empty}</p>
        )}
      </Reveal>
    </Section>
  );
}
