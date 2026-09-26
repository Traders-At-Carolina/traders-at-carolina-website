import { ArrowDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { GalleryCarousel } from '../components/GalleryCarousel'
import { ContentUnavailable, CtaBand, PageMeta, SectionHeading, TextLink } from '../components/ui'
import { learningTracks, pillars } from '../data/siteContent'
import {
  getPublishedGallery,
  getPublishedOrganizations,
  getPublishedStats,
  getPublishedEvents,
  getPublishedRecruitmentCycle,
  splitEventsByDate,
} from '../data/selectors'

export function HomePage() {
  const stats = getPublishedStats()
  const { upcoming } = splitEventsByDate(getPublishedEvents())
  const gallery = getPublishedGallery()
  const placements = getPublishedOrganizations().filter((organization) => organization.category === 'placement')
  const publicRecruitment = getPublishedRecruitmentCycle()
  const recruitmentStatus = publicRecruitment?.manualOverride ?? publicRecruitment?.status ?? 'upcoming'

  return (
    <>
      <PageMeta
        title="Quantitative Finance at UNC"
        description="Meet Traders at Carolina, explore quantitative finance programming, and learn how to join."
      />
      <section className="home-hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-copy">
            <h1>Traders <span>at Carolina</span></h1>
            <p className="hero-statement">
              A quantitative finance club at UNC-Chapel Hill for students who want to understand markets by building,
              testing, and learning together.
            </p>
            <div className="button-row">
              <Link className="button button-light" to="/membership">
                Explore membership
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button button-ghost-light" to="/events">
                View upcoming events
              </Link>
            </div>
          </div>
          <div className="hero-status">
            <span className={`status-dot status-${recruitmentStatus}`} aria-hidden="true" />
            <div>
              <strong>{publicRecruitment?.season ?? 'Recruitment update pending'}</strong>
              <span>{publicRecruitment ? 'Dates will be published when confirmed.' : 'No recruitment cycle is published.'}</span>
            </div>
          </div>
        </div>
        <a className="hero-scroll" href="#club-introduction">
          <span>Discover the club</span>
          <ArrowDown size={18} aria-hidden="true" />
        </a>
      </section>

      <section className="stats-band" aria-label="Club facts">
        <div className="container">
          {stats.length ? (
            <dl className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.id}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                  {stat.context ? <span>{stat.context}</span> : null}
                </div>
              ))}
            </dl>
          ) : (
            <div className="data-pending-row">
              <strong>Club facts are being verified.</strong>
              <span>Founding year, active membership, leadership, and placement figures will publish here.</span>
            </div>
          )}
        </div>
      </section>

      <section id="club-introduction" className="section section-intro-story">
        <div className="container split-story">
          <div>
            <h2>Learn to ask better questions of markets.</h2>
          </div>
          <div className="story-body">
            <p>
              Traders at Carolina brings together students interested in the ideas, tools, and judgment behind
              quantitative finance. The club is built around doing the work: learning collaboratively, applying what
              we learn, and sharing the result.
            </p>
            <TextLink to="/about">Meet the team and our approach</TextLink>
          </div>
        </div>
      </section>

      <section className="section pillar-section">
        <div className="container">
          <SectionHeading
            title="Learn. Compete. Connect."
            description="Three ways to turn curiosity into practice—and practice into a community."
          />
          <div className="pillar-list">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="pillar-row">
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
                <span>{pillar.detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section learning-section">
        <div className="container learning-layout">
          <SectionHeading
            title="Build a repeatable way of thinking."
            description="Member development connects technical work to the decisions and communication that make it useful."
          />
          <div className="learning-grid">
            {learningTracks.map((track) => (
              <article key={track.title}>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
              </article>
            ))}
          </div>
          <TextLink to="/membership">See the member experience</TextLink>
        </div>
      </section>

      <section className="section events-preview">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading
              title="What’s happening next"
              description="Public workshops, competitions, and member programming are published as soon as details are confirmed."
            />
            <TextLink to="/events">All events</TextLink>
          </div>
          {upcoming.length ? (
            <div className="event-grid">
              {upcoming.slice(0, 3).map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <ContentUnavailable
              icon="calendar"
              title="The next event is being confirmed"
              description="There are no published events yet. Join the interest list and we’ll share new public programming when it is available."
              action={<TextLink to="/join#interest-form">Get event updates</TextLink>}
            />
          )}
        </div>
      </section>

      <section className="section gallery-section">
        <div className="container">
          <SectionHeading
            title="Club life, in the room"
            description="A future gallery of meetings, workshops, competitions, and the people who make them matter."
          />
          <GalleryCarousel items={gallery} />
        </div>
      </section>

      <section className="section proof-section">
        <div className="container">
          <SectionHeading
            title="Where members take their experience"
            description="Approved placement logos will be shown as member outcomes—not presented as sponsors or endorsements."
          />
          {placements.length ? (
            <div className="logo-grid">
              {placements.map((organization) => (
                <a key={organization.id} href={organization.url} target="_blank" rel="noreferrer">
                  {organization.logo ? <img src={organization.logo} alt={organization.name} /> : organization.name}
                </a>
              ))}
            </div>
          ) : (
            <ContentUnavailable
              title="Verified placement information is coming"
              description="No employer logos are published until their context and permission are confirmed."
            />
          )}
        </div>
      </section>

      <CtaBand
        title="Curious enough to keep going?"
        description="Learn how membership works, follow the next recruitment cycle, and tell us what you want to explore."
        primaryLabel="Explore joining"
        primaryTo="/join"
        secondaryLabel="See membership"
        secondaryTo="/membership"
      />
    </>
  )
}
