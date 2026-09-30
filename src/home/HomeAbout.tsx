import { SectionHeader } from '../components/SectionHeader'
import '../styles/about.css'

/**
 * Section 3 — About.
 *
 * Carries id="about" so the hero chevron can target it. Uses the shared
 * section header; the two stats sit under the subtext in the right column.
 */
export function HomeAbout() {
  return (
    <section id="about" className="tac-section tac-section--warm tac-block">
      <div className="tac-container">
        <SectionHeader
          number="01"
          label="About"
          heading="A community of quantitative thinkers."
          subtext="We help students learn what quants do, meet like-minded peers, and connect with the industry."
        >
          <dl className="tac-about__stats">
            <div className="tac-about__stat">
              <dt className="tac-about__stat-num">7th</dt>
              <dd className="tac-about__stat-label">semester of operation</dd>
            </div>
            <div className="tac-about__stat">
              <dt className="tac-about__stat-num">40+</dt>
              <dd className="tac-about__stat-label">members and alumni</dd>
            </div>
          </dl>
        </SectionHeader>
      </div>
    </section>
  )
}
