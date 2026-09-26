import { ExternalLink } from 'lucide-react'
import { DisclosureList, PageHero, PageMeta, SectionHeading } from '../components/ui'
import { InterestForm } from '../components/InterestForm'
import { membershipFaq, siteSettings } from '../data/siteContent'
import { getPublishedRecruitmentCycle } from '../data/selectors'

const statusCopy = {
  upcoming: {
    label: 'Recruitment is upcoming',
    description: 'Dates have not been published. The interest form remains open for updates.',
  },
  open: {
    label: 'Applications are open',
    description: 'Review the timeline and submit your application before the published deadline.',
  },
  closed: {
    label: 'Applications are closed',
    description: 'The interest form remains open for the next confirmed recruitment cycle.',
  },
}

const processSteps = [
  {
    title: 'Stay informed',
    description: 'Submit the interest form so confirmed dates, public events, and application information can reach you.',
  },
  {
    title: 'Explore the club',
    description: 'Read about membership and attend programming marked Public before deciding whether to apply.',
  },
  {
    title: 'Review the full process',
    description: 'When recruitment opens, eligibility, expectations, milestones, and the application link will publish together.',
  },
]

export function JoinPage() {
  const publicRecruitment = getPublishedRecruitmentCycle()
  const resolvedStatus = publicRecruitment?.manualOverride ?? publicRecruitment?.status ?? 'upcoming'
  const recruitment = statusCopy[resolvedStatus]
  const milestones = publicRecruitment?.milestones ?? []
  const socials = [
    { label: 'Discord', url: siteSettings.discordUrl },
    { label: 'LinkedIn', url: siteSettings.linkedinUrl },
    { label: 'Instagram', url: siteSettings.instagramUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url))

  return (
    <>
      <PageMeta
        title="Join"
        description="Follow the Traders at Carolina recruitment timeline and submit your interest in joining."
      />
      <PageHero
        title="Your first step is simply to stay curious."
        description="Recruitment details will be published as a complete, transparent process. Until then, tell us what you want to learn and we’ll keep you close to the next update."
        variant="blue"
      />

      <section className="recruitment-status-section">
        <div className="container recruitment-status">
          <span className={`status-dot status-${resolvedStatus}`} aria-hidden="true" />
          <div>
            <h2>{recruitment.label}</h2>
            <p>{recruitment.description}</p>
          </div>
          {resolvedStatus === 'open' && publicRecruitment?.applicationUrl ? (
            <a className="button" href={publicRecruitment.applicationUrl} target="_blank" rel="noreferrer">
              Apply now
              <ExternalLink size={17} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Recruitment timeline"
            description="Milestones will appear in chronological order once the cycle is confirmed."
          />
          {milestones.length ? (
            <ol className="timeline-list">
              {milestones.map((milestone) => (
                <li key={milestone.id}>
                  <span>{milestone.date ?? 'Date pending'}</span>
                  <h3>{milestone.label}</h3>
                  <p>{milestone.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="timeline-pending">
              <span>Timeline pending</span>
              <p>Interest form → public programming → confirmed recruitment details → application</p>
            </div>
          )}
        </div>
      </section>

      <section className="section process-section">
        <div className="container process-layout">
          <SectionHeading
            title="What happens next"
            description="No hidden dates and no application without the information needed to make a considered choice."
          />
          <ol>
            {processSteps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="interest-form" className="section form-section">
        <div className="container form-layout">
          <div className="form-intro">
            <h2>Tell us what you want to explore.</h2>
            <p>
              This form remains available in every recruitment state. It is not an application and does not imply
              admission or membership.
            </p>
          </div>
          <InterestForm />
        </div>
      </section>

      <section className="section social-section">
        <div className="container social-layout">
          <SectionHeading title="Follow the conversation" description="Official social links will be published after verification." />
          {socials.length ? (
            <div className="social-links">
              {socials.map((social) => (
                <a key={social.label} href={social.url} target="_blank" rel="noreferrer">
                  {social.label}
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : (
            <p className="content-note">Discord, LinkedIn, and Instagram URLs have not been supplied.</p>
          )}
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-layout">
          <SectionHeading title="Before you apply" />
          <DisclosureList items={membershipFaq} />
        </div>
      </section>
    </>
  )
}
