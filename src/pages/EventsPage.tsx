import { EventCard } from '../components/EventCard'
import { ContentUnavailable, PageHero, PageMeta, SectionHeading, TextLink } from '../components/ui'
import { getPublishedEvents, splitEventsByDate } from '../data/selectors'

export function EventsPage() {
  const { upcoming, past } = splitEventsByDate(getPublishedEvents())
  const featured = upcoming.find((event) => event.featured) ?? upcoming[0]
  const remainingUpcoming = upcoming.filter((event) => event.id !== featured?.id)

  return (
    <>
      <PageMeta
        title="Competitions & Events"
        description="Find public workshops, competitions, recruiting events, and member programming from Traders at Carolina."
      />
      <PageHero
        title="The work gets real when it enters the room."
        description="Explore workshops, speakers, competitions, recruiting programs, and community events. Every listing states who can attend and what action is required."
        variant="light"
      />

      <section className="section featured-event-section">
        <div className="container">
          <SectionHeading title="Next on the calendar" />
          {featured ? (
            <EventCard event={featured} featured />
          ) : (
            <ContentUnavailable
              icon="calendar"
              title="No upcoming event is published"
              description="The next workshop, competition, or public program will appear here as soon as its date and audience are confirmed."
              action={<TextLink to="/join#interest-form">Get event updates</TextLink>}
            />
          )}
        </div>
      </section>

      <section className="section section-contrast">
        <div className="container">
          <SectionHeading
            title="Upcoming events"
            description="Listings remain visible when full or canceled so visitors always have an accurate picture of the calendar."
          />
          {remainingUpcoming.length ? (
            <div className="event-grid">
              {remainingUpcoming.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <ContentUnavailable
              icon="calendar"
              title="Nothing else is scheduled yet"
              description="There are no additional published events. Check back after the next programming update."
            />
          )}
        </div>
      </section>

      <section className="section archive-section">
        <div className="container">
          <SectionHeading
            title="Past events"
            description="An archive of verified event summaries, outcomes, and photo recaps."
          />
          {past.length ? (
            <div className="archive-list">
              {past.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <ContentUnavailable
              title="The event archive is being assembled"
              description="Past events will be added when their dates, descriptions, and outcomes have been verified."
            />
          )}
        </div>
      </section>

      <section className="event-closing">
        <div className="container">
          <h2>Want to know when the next public event lands?</h2>
          <TextLink to="/join#interest-form">Join the interest list</TextLink>
        </div>
      </section>
    </>
  )
}
