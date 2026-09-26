import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CtaBand, DisclosureList, PageHero, PageMeta, SectionHeading } from '../components/ui'
import { learningTracks, memberJourney, membershipFaq, membershipFormats, pillars } from '../data/siteContent'

export function MembershipPage() {
  return (
    <>
      <PageMeta
        title="Membership"
        description="Explore the Traders at Carolina member experience, learning areas, activities, and recruitment path."
      />
      <PageHero
        title="Bring your curiosity. Build the rest together."
        description="Membership is for UNC students who want to engage deeply with quantitative finance—whether they are arriving with experience or beginning with a serious question."
        variant="dark"
      >
        <Link className="button button-light" to="/join">
          Get recruitment updates
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </PageHero>

      <section className="section membership-intro">
        <div className="container editorial-grid">
          <h2>What membership means</h2>
          <div className="long-copy">
            <p>
              Membership is an active learning commitment. Students take part in programming, prepare with peers,
              contribute to shared work, and help turn a wide field into something the community can examine together.
            </p>
            <p>
              Exact eligibility, time expectations, and selection criteria will be published before applications open.
              The site will not ask students to apply without those details.
            </p>
          </div>
        </div>
      </section>

      <section className="section pillar-section">
        <div className="container">
          <SectionHeading
            title="The member experience"
            description="Learning, competition, and connection reinforce one another throughout the year."
          />
          <div className="pillar-list pillar-list-expanded">
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
        <div className="container">
          <SectionHeading
            title="What members develop"
            description="The intended curriculum balances technical fluency with the judgment to use it responsibly."
          />
          <div className="learning-grid learning-grid-wide">
            {learningTracks.map((track) => (
              <article key={track.title}>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section formats-section">
        <div className="container formats-layout">
          <div>
            <h2>How the work happens</h2>
            <p>Programming can take several forms while serving the same goal: moving from exposure to practice.</p>
          </div>
          <ul>
            {membershipFormats.map((format) => (
              <li key={format}>
                <Check size={19} aria-hidden="true" />
                {format}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section journey-section">
        <div className="container">
          <SectionHeading
            title="A member journey with room to grow"
            description="The route is not one-size-fits-all, but participation should deepen into contribution."
          />
          <ol className="journey-list">
            {memberJourney.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-layout">
          <SectionHeading title="Membership questions" />
          <DisclosureList items={membershipFaq} />
        </div>
      </section>

      <CtaBand
        title="Stay close to the next cycle."
        description="Recruitment dates are not published yet. Join the interest list now and return when the full timeline is live."
        primaryLabel="Join the interest list"
        primaryTo="/join#interest-form"
        secondaryLabel="Browse events"
        secondaryTo="/events"
      />
    </>
  )
}
