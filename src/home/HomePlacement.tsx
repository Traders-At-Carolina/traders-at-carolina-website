import type { ReactElement } from 'react'
import { Reveal } from '../components/Reveal'
import '../styles/placement.css'

type PlacementLogo = { src: string; name: string }

/**
 * Firm logos, read from `public/images/placement/`.
 *
 * ADDING LOGOS: drop the file into `public/images/placement/` and add an entry
 * here, e.g. `{ src: '/images/placement/firm.svg', name: 'Firm' }`. The grid
 * appears automatically; while this list is empty a blank block is shown
 * instead. Do not add a firm until it is confirmed.
 */
const placementLogos: PlacementLogo[] = []

/**
 * Section 5 — where members end up. Two-column marker/content layout, no rule
 * line above the marker, square corners throughout.
 */
export function HomePlacement(): ReactElement {
  return (
    <section className="tac-section tac-section--white tac-placement">
      <div className="tac-container">
        <div className="tac-placement__grid">
          <Reveal>
            <span className="tac-eyebrow tac-placement__number">02</span>
            <span className="tac-label tac-placement__marker-label">
              Placement
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="tac-h-lg tac-placement__heading">
              Where our members go.
            </h2>
            <p className="tac-body tac-placement__lede">
              Our members and alumni go on to top trading and technology firms.
            </p>

            <div className="tac-placement__logos">
              {placementLogos.length > 0 ? (
                <ul className="tac-placement__logo-grid">
                  {placementLogos.map((logo) => (
                    <li key={logo.src}>
                      <img
                        className="tac-placement__logo"
                        src={logo.src}
                        alt={logo.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="tac-placement__logos-empty">
                  <span className="tac-placement__logos-empty-text">
                    [Firm logos]
                  </span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
