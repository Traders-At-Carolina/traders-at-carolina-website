import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContentUnavailable, PageMeta, SectionHeading } from '../components/ui'
import { collaborationFormats, siteSettings } from '../data/siteContent'
import { getPublishedOrganizations, getPublishedStats } from '../data/selectors'

export function PartnersPage() {
  const partnerOrganizations = getPublishedOrganizations().filter(
    (organization) => organization.category === 'collaborator' || organization.category === 'sponsor',
  )
  const stats = getPublishedStats()
  const contactHref = siteSettings.schedulingUrl ?? (siteSettings.partnershipEmail ? `mailto:${siteSettings.partnershipEmail}` : undefined)

  return (
    <>
      <PageMeta
        title="Partners"
        description="Bring your team to campus and create substantive quantitative finance programming with Traders at Carolina."
      />
      <section className="partner-hero">
        <div className="container partner-hero-inner">
          <div>
            <h1>Bring your team to campus.</h1>
            <p>
              Work with curious UNC students through programming built around real methods, real questions, and
              substantive conversation.
            </p>
          </div>
          <div className="partner-signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="section partner-intro">
        <div className="container editorial-grid">
          <h2>A campus relationship with depth</h2>
          <div className="long-copy">
            <p>
              The best collaborations give students a clearer view of how quantitative work happens—and give
              practitioners a better way to meet the people doing the learning.
            </p>
            <p>
              We structure potential programs around useful exchange rather than passive brand exposure. The format can
              flex with your team, topic, and recruiting goals.
            </p>
          </div>
        </div>
      </section>

      <section className="section collaboration-section">
        <div className="container">
          <SectionHeading
            title="Ways to work together"
            description="Choose a format, or bring us a problem that deserves a different one."
          />
          <div className="collaboration-list">
            {collaborationFormats.map((format) => (
              <article key={format.title}>
                <h3>{format.title}</h3>
                <p>{format.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section partner-proof">
        <div className="container">
          <SectionHeading
            title="A clear view of the audience"
            description="Verified reach and engagement figures will be published here rather than estimated."
          />
          {stats.length ? (
            <dl className="stats-grid stats-grid-light">
              {stats.map((stat) => (
                <div key={stat.id}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>
              ))}
            </dl>
          ) : (
            <ContentUnavailable
              title="Audience figures are being verified"
              description="Membership, attendance, and engagement statistics will appear only after club leadership confirms them."
            />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Recent collaborators"
            description="Collaborators and sponsors are listed separately from member placements."
          />
          {partnerOrganizations.length ? (
            <div className="logo-rail" role="list" aria-label="Recent collaborators and sponsors">
              {partnerOrganizations.map((organization) => (
                <a key={organization.id} role="listitem" href={organization.url} target="_blank" rel="noreferrer">
                  {organization.logo ? <img src={organization.logo} alt={organization.name} /> : organization.name}
                </a>
              ))}
            </div>
          ) : (
            <ContentUnavailable
              title="Approved collaborators will appear here"
              description="No organization will be presented as a collaborator or sponsor until that relationship is confirmed."
            />
          )}
        </div>
      </section>

      <section className="partner-contact">
        <div className="container partner-contact-inner">
          <div>
            <h2>Start with the problem you want students to see.</h2>
            <p>Tell us what your team does, what you could bring to campus, and what a useful outcome looks like.</p>
          </div>
          {contactHref ? (
            <a className="button button-light" href={contactHref}>
              Start a conversation
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          ) : (
            <div className="contact-pending">
              <strong>Partnership contact is being verified.</strong>
              <span>The admin-managed email or scheduling link will activate this action.</span>
            </div>
          )}
        </div>
      </section>

      <section className="section section-centered-link">
        <div className="container centered-choice single-choice">
          <Link className="choice-link" to="/about">
            <span>Looking for member outcomes?</span>
            <strong>View placements in About & Team →</strong>
          </Link>
        </div>
      </section>
    </>
  )
}
