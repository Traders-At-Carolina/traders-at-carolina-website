import { Reveal } from '../components/Reveal'
import '../styles/about.css'

/**
 * Section 3 — About.
 *
 * Carries id="about" so the hero chevron can target it. Two-column grid:
 * a numbered section marker on the left (the marker pattern reused further
 * down the page) and the editorial block on the right. No rules, no
 * dividers — the warm-gray field is the only separator.
 */
export function HomeAbout() {
  return (
    <section id="about" className="tac-section tac-section--warm tac-about">
      <div className="tac-container tac-about__grid">
        <Reveal className="tac-about__marker">
          <span className="tac-about__marker-num">01</span>
          <span className="tac-about__marker-label">About</span>
        </Reveal>

        <Reveal className="tac-about__content" delay={80}>
          <h2 className="tac-h-lg tac-about__heading">
            A community of quantitative thinkers.
          </h2>

          <p className="tac-body tac-about__lede">
            We help students learn what quants do, meet like-minded peers, and connect
            with the industry.
          </p>

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
        </Reveal>
      </div>
    </section>
  )
}
