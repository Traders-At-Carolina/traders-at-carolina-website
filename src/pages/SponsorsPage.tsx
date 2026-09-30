import { ImageOrPlaceholder } from '../components/ImageOrPlaceholder'
import { Reveal } from '../components/Reveal'
import { SectionHeader } from '../components/SectionHeader'
import { PageMeta } from '../components/ui'
import { sponsorsContent, type Sponsor } from '../data/sponsors'
import '../styles/sponsors.css'

function SponsorTile({ sponsor }: { sponsor: Sponsor }) {
  const logo = (
    <ImageOrPlaceholder
      className="tac-sponsor__logo"
      src={sponsor.logo}
      alt={sponsor.name}
      placeholder="[Sponsor logo]"
    />
  )

  return sponsor.url ? (
    <a className="tac-sponsor" href={sponsor.url} target="_blank" rel="noopener">
      {logo}
    </a>
  ) : (
    <div className="tac-sponsor">{logo}</div>
  )
}

export function SponsorsPage() {
  const { year, contactEmail, tiers } = sponsorsContent
  const visibleTiers = tiers.filter((tier) => tier.sponsors.length > 0)

  return (
    <>
      <PageMeta
        title="Sponsors"
        description="The industry sponsors who support Traders at Carolina."
      />

      <section className="tac-section tac-section--white tac-block">
        <div className="tac-container">
          <SectionHeader
            number="01"
            label="Sponsors"
            heading="Our sponsors."
            subtext={`Thank you to our ${year} industry sponsors.`}
            headingLevel="h1"
          />

          <div className="tac-tiers">
            {visibleTiers.map((tier) => (
              <Reveal as="section" key={tier.name} className="tac-tier">
                <h2 className="tac-tier__name">{tier.name}</h2>
                <ul className="tac-tier__logos">
                  {tier.sponsors.map((sponsor, index) => (
                    <li key={`${sponsor.name}-${index}`}>
                      <SponsorTile sponsor={sponsor} />
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="tac-body tac-sponsors__cta">
              Interested in sponsoring?{' '}
              <a className="tac-sponsors__cta-link" href={`mailto:${contactEmail}`}>
                Get in touch
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
