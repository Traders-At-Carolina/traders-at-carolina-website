import { Card } from "@/components/Card";
import { Eyebrow } from "@/components/Eyebrow";
import { TextLink } from "@/components/TextLink";
import type { ClubEvent } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatEventWhen } from "@/lib/events";

type EventCardProps = {
  event: ClubEvent;
  /** Label above the title: "Upcoming" on Home, the event's type in the portal. */
  label: string;
  /** The portal shows the description; Home's narrow column leaves it out. */
  showDescription?: boolean;
};

/** One event: label, title, when, location, optional description and link (spec 01 §3.4, 09 §4.4). */
export function EventCard({ event, label, showDescription = false }: EventCardProps) {
  return (
    <Card className="h-full">
      <Eyebrow>{label}</Eyebrow>
      <h3 className="mt-3 text-h3">{event.title}</h3>
      <p className="mt-3 text-body tabular">
        <time dateTime={parseEasternDateTime(event.startsAt).toISOString()}>{formatEventWhen(event)}</time>
      </p>
      {event.location ? <p className="mt-1 text-caption text-ink-3">{event.location}</p> : null}
      {showDescription && event.description ? <p className="mt-4 max-w-prose text-body text-ink-2">{event.description}</p> : null}
      {event.url ? (
        <p className="mt-5">
          <TextLink href={event.url} external arrow track={{ cta: "upcoming-event", target: event.title }}>
            Details
          </TextLink>
        </p>
      ) : null}
    </Card>
  );
}
