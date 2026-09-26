import { Link } from 'react-router-dom'
import { ContentUnavailable, CtaBand, PageHero, PageMeta, SectionHeading } from '../components/ui'
import { getPublishedOrganizations, getPublishedTeam } from '../data/selectors'

const values = [
  {
    title: 'Curiosity before certainty',
    description: 'Start with the question, then earn the conclusion through evidence and critique.',
  },
  {
    title: 'Technical work with context',
    description: 'A model matters when its assumptions, limits, and decisions are understood.',
  },
  {
    title: 'Contribution over spectatorship',
    description: 'The community gets stronger when members build, teach, ask, and share.',
  },
]

export function AboutPage() {
  const team = getPublishedTeam()
  const placements = getPublishedOrganizations().filter((organization) => organization.category === 'placement')

  return (
    <>
      <PageMeta
        title="About & Team"
        description="Learn why Traders at Carolina exists, how the club approaches quantitative finance, and who leads it."
      />
      <PageHero
        title="Quantitative finance, learned in community."
        description="Traders at Carolina gives UNC students a place to study how markets work, practice technical problem-solving, and learn alongside people who take the questions seriously."
        variant="blue"
      />

      <section className="section">
        <div className="container editorial-grid">
          <h2>Why the club exists</h2>
          <div className="long-copy">
            <p>
              Quantitative finance sits at the intersection of markets, mathematics, computation, and decision-making.
              It can be difficult to explore alone—and easy to reduce to jargon from a distance.
            </p>
            <p>
              The club creates a shared place to learn the fundamentals, test ideas in practice, and understand how the
              field connects to real research, competition, and professional work.
            </p>
            <p className="content-note">
              The verified founding year and historical milestones will be added when supplied by club leadership.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-contrast">
        <div className="container distinction-layout">
          <div>
            <h2>More than a market conversation.</h2>
            <p>
              A general investing club may focus on what to buy or where markets could go. Traders at Carolina focuses
              on the systems underneath those questions: how a claim is modeled, how evidence is tested, and how risk
              changes a decision.
            </p>
          </div>
          <div className="values-list">
            {values.map((value) => (
              <article key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Executive board"
            description="The people responsible for programming, membership, partnerships, and the club’s next chapter."
          />
          {team.length ? (
            <div className="team-grid">
              {team.map((member) => (
                <article key={member.id} className="team-member">
                  {member.headshot ? <img src={member.headshot} alt={`Portrait of ${member.name}`} /> : <div className="portrait-fallback" aria-hidden="true" />}
                  <div>
                    <h3>{member.name}</h3>
                    <strong>{member.role}</strong>
                    {member.academicDetails ? <p>{member.academicDetails}</p> : null}
                    {member.profileUrl ? <a href={member.profileUrl}>View profile</a> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ContentUnavailable
              title="Leadership profiles are being updated"
              description="Names, roles, headshots, and academic details will publish only after the current board approves them."
            />
          )}
        </div>
      </section>

      <section className="section proof-section">
        <div className="container">
          <SectionHeading
            title="Member placements"
            description="A record of where members take their experience, separated clearly from sponsorships and partnerships."
          />
          {placements.length ? (
            <div className="logo-grid">
              {placements.map((organization) => <span key={organization.id}>{organization.name}</span>)}
            </div>
          ) : (
            <ContentUnavailable
              title="Placement records are awaiting approval"
              description="No company names or logos will appear until their relationship to member outcomes is verified."
            />
          )}
        </div>
      </section>

      <section className="section section-centered-link">
        <div className="container centered-choice">
          <Link className="choice-link" to="/membership">
            <span>For students</span>
            <strong>See the member experience →</strong>
          </Link>
          <Link className="choice-link" to="/partners">
            <span>For organizations</span>
            <strong>Work with the club →</strong>
          </Link>
        </div>
      </section>

      <CtaBand
        title="Find your place in the work."
        description="Explore what members learn, how the community operates, and when the next recruitment cycle begins."
        primaryLabel="Explore membership"
        primaryTo="/membership"
        secondaryLabel="Join updates"
        secondaryTo="/join"
      />
    </>
  )
}
