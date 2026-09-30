import { EmailLink, LinkedInLink } from '../components/Icons'
import { ImageOrPlaceholder } from '../components/ImageOrPlaceholder'
import { Reveal } from '../components/Reveal'
import { SectionHeader } from '../components/SectionHeader'
import { PageMeta } from '../components/ui'
import { generalMembers, leadership } from '../data/members'
import '../styles/members.css'

export function MembersPage() {
  return (
    <>
      <PageMeta
        title="Members"
        description="The executive board and members of Traders at Carolina."
      />

      <section className="tac-section tac-section--white tac-block">
        <div className="tac-container">
          <SectionHeader
            number="01"
            label="Leadership"
            heading="Executive board."
            subtext="The students who run Traders at Carolina."
            headingLevel="h1"
          />

          <ul className="tac-leaders">
            {leadership.map((person, index) => (
              <Reveal as="li" key={`${person.name}-${index}`} className="tac-leader">
                <div className="tac-leader__photo">
                  <ImageOrPlaceholder src={person.photo} alt={person.name} placeholder="[Photo]" />
                </div>
                <h2 className="tac-leader__name">{person.name}</h2>
                <p className="tac-leader__role">{person.role || '[Role]'}</p>
                {person.linkedin || person.email ? (
                  <div className="tac-leader__links">
                    {person.linkedin ? <LinkedInLink href={person.linkedin} name={person.name} /> : null}
                    {person.email ? <EmailLink email={person.email} name={person.name} /> : null}
                  </div>
                ) : null}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="tac-section tac-section--warm tac-block">
        <div className="tac-container">
          <SectionHeader
            number="02"
            label="Members"
            heading="Our members."
            subtext="Connect with us on LinkedIn."
          />

          <ul className="tac-members">
            {generalMembers.map((person, index) => (
              <Reveal as="li" key={`${person.name}-${index}`} className="tac-member">
                <div className="tac-member__photo">
                  <ImageOrPlaceholder
                    src={person.photo}
                    alt={person.name}
                    placeholder="[Photo]"
                    tone="white"
                  />
                </div>
                <div className="tac-member__row">
                  <h2 className="tac-member__name">{person.name}</h2>
                  {person.linkedin ? <LinkedInLink href={person.linkedin} name={person.name} size={20} /> : null}
                </div>
                <p className="tac-member__year">
                  {person.year ? `Class of ${person.year}` : '[Class of 20XX]'}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
