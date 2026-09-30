import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../styles/hero.css'

/**
 * Section 2 — Hero.
 *
 * Full-bleed navy field: the section itself is solid navy, the photograph sits
 * behind an 80% navy scrim as a CSS background layer (never an <img>), so a
 * missing file degrades to flat navy with no broken-image icon.
 *
 * Deliberately NOT wrapped in <Reveal>: this is above the fold and must paint
 * on first frame.
 */
export function HomeHero() {
  const [markFailed, setMarkFailed] = useState<boolean>(false)

  return (
    <section className="tac-hero">
      {/* Photograph, then scrim. Both decorative background layers. */}
      <div className="tac-hero__image" aria-hidden="true" />
      <div className="tac-hero__scrim" aria-hidden="true" />

      <div className="tac-hero__inner tac-container">
        {markFailed ? (
          <div className="tac-hero__mark-fallback" aria-hidden="true">
            TC
          </div>
        ) : (
          <img
            className="tac-hero__mark"
            src="/images/logo/logo-mark-white.svg"
            alt=""
            width={88}
            height={88}
            onError={() => setMarkFailed(true)}
          />
        )}

        <h1 className="tac-hero__title">Traders at Carolina</h1>

        <p className="tac-hero__subtext">
          UNC Chapel Hill’s undergraduate quantitative finance club.
        </p>

        <div className="tac-hero__actions">
          <Link className="tac-btn tac-hero__btn tac-hero__btn--solid" to="/events">
            UPCOMING EVENTS
          </Link>
          <Link className="tac-btn tac-hero__btn tac-hero__btn--outline" to="/join">
            JOIN US
          </Link>
        </div>
      </div>

      <a className="tac-hero__chevron" href="#about" aria-label="Scroll to About">
        <ChevronDown size={24} strokeWidth={1.5} aria-hidden="true" />
      </a>
    </section>
  )
}
