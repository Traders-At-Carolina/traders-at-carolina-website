import { ArrowUpRight, Calendar, MapPin } from 'lucide-react'
import type { ClubEvent, EventAudience, EventStatus } from '../types/content'

const audienceLabels: Record<EventAudience, string> = {
  public: 'Public',
  members: 'Members only',
  'application-required': 'Application required',
}

const statusLabels: Record<EventStatus, string> = {
  open: 'Registration open',
  full: 'Event full',
  canceled: 'Canceled',
  complete: 'Complete',
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

export function EventCard({ event, featured = false }: { event: ClubEvent; featured?: boolean }) {
  const canRegister = event.status === 'open' && Boolean(event.registrationUrl)

  return (
    <article className={`event-card ${featured ? 'event-card-featured' : ''}`}>
      {event.image ? (
        <img className="event-card-image" src={event.image} alt="" loading="lazy" />
      ) : (
        <div className="event-card-image event-card-image-fallback" aria-hidden="true">
          <span>{event.type}</span>
        </div>
      )}
      <div className="event-card-body">
        <div className="tag-row">
          <span className="tag">{audienceLabels[event.audience]}</span>
          <span className={`tag tag-${event.status}`}>{statusLabels[event.status]}</span>
        </div>
        <h3>{event.title}</h3>
        <p>{event.summary}</p>
        <dl className="event-meta">
          <div>
            <dt>
              <Calendar size={17} aria-hidden="true" />
              <span className="sr-only">Date</span>
            </dt>
            <dd>{formatDate(event.startsAt)}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={17} aria-hidden="true" />
              <span className="sr-only">Location</span>
            </dt>
            <dd>{event.location}</dd>
          </div>
        </dl>
        {event.outcome ? <p className="event-outcome">{event.outcome}</p> : null}
        {canRegister ? (
          <a className="text-link" href={event.registrationUrl} target="_blank" rel="noreferrer">
            Register
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  )
}
