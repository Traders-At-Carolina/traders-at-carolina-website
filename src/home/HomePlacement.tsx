import { useEffect, useState, type ReactElement } from 'react'
import { ImageOrPlaceholder } from '../components/ImageOrPlaceholder'
import { Reveal } from '../components/Reveal'
import { SectionHeader } from '../components/SectionHeader'
import '../styles/placement.css'

type PlacementLogo = { src: string; name: string }

/**
 * Firm logos live in `public/images/placement/` and are listed in
 * `public/images/placement/placement.json` as `[{ "src", "name" }]`.
 * While the list is empty a blank warm-gray block is shown instead.
 */
const PLACEMENT_MANIFEST = '/images/placement/placement.json'
const PLACEMENT_DIR = '/images/placement/'

function parsePlacement(payload: unknown): PlacementLogo[] {
  if (!Array.isArray(payload)) return []
  const logos: PlacementLogo[] = []
  for (const entry of payload) {
    if (typeof entry !== 'object' || entry === null) continue
    const { src, name } = entry as { src?: unknown; name?: unknown }
    if (typeof src !== 'string' || src.trim() === '' || typeof name !== 'string') continue
    const path = src.trim()
    logos.push({ src: path.startsWith('/') ? path : `${PLACEMENT_DIR}${path}`, name })
  }
  return logos
}

/** Section 5 — where members end up. */
export function HomePlacement(): ReactElement {
  const [logos, setLogos] = useState<PlacementLogo[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch(PLACEMENT_MANIFEST, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => setLogos(parsePlacement(payload)))
      .catch(() => {
        // Missing manifest is the normal empty state; the blank block covers it.
      })
    return () => controller.abort()
  }, [])

  return (
    <section className="tac-section tac-section--white tac-block">
      <div className="tac-container">
        <SectionHeader
          number="02"
          label="Placement"
          heading="Where our members go."
          subtext="Our members and alumni go on to top trading and technology firms."
        />

        <Reveal className="tac-placement__logos">
          {logos.length > 0 ? (
            <ul className="tac-placement__logo-grid">
              {logos.map((logo) => (
                <li key={logo.src} className="tac-placement__logo-cell">
                  <ImageOrPlaceholder
                    className="tac-placement__logo"
                    src={logo.src}
                    alt={logo.name}
                    placeholder={logo.name}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="tac-placement__logos-empty" />
          )}
        </Reveal>
      </div>
    </section>
  )
}
