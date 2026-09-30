import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import '../styles/slider.css'

/**
 * A single photo in the strip.
 *
 * ADDING PHOTOS — no layout code needs to change:
 *   1. Drop the image file into `public/images/gallery/`.
 *   2. Add an entry to `public/images/gallery/gallery.json`, e.g.
 *        [{ "src": "/images/gallery/kickoff.jpg", "caption": "Kickoff night" }]
 * The strip picks them up on the next page load. While the folder is empty the
 * section renders six warm-gray placeholder cards so the layout still reads.
 */
export type GalleryPhoto = { src: string; caption: string }

const GALLERY_MANIFEST = '/images/gallery/gallery.json'
const GALLERY_DIR = '/images/gallery/'
const PLACEHOLDER_COUNT = 6

/** Bare filenames in the manifest are resolved against the gallery folder. */
function normalizeSrc(src: string): string {
  return src.startsWith('/') ? src : `${GALLERY_DIR}${src}`
}

/**
 * Turns whatever the manifest returned into a trustworthy photo list.
 * Anything unexpected — not an array, entries missing `src`/`caption`, wrong
 * types — is quietly dropped rather than thrown.
 */
function parseGallery(payload: unknown): GalleryPhoto[] {
  if (!Array.isArray(payload)) return []

  const photos: GalleryPhoto[] = []
  for (const entry of payload) {
    if (typeof entry !== 'object' || entry === null) continue
    const { src, caption } = entry as { src?: unknown; caption?: unknown }
    if (typeof src !== 'string' || src.trim() === '') continue
    if (typeof caption !== 'string') continue
    photos.push({ src: normalizeSrc(src.trim()), caption })
  }
  return photos
}

type SliderCard = {
  /** Index into the photo list (or the placeholder run). */
  index: number
  /** Text shown inside the placeholder block: "Photo 1" … "Photo 6". */
  label: string
  caption: string
  /** Absent for placeholder cards. */
  src?: string
}

function buildPlaceholderCards(): SliderCard[] {
  return Array.from({ length: PLACEHOLDER_COUNT }, (_unused, index) => ({
    index,
    label: `Photo ${index + 1}`,
    caption: '[Caption]',
  }))
}

/**
 * Section 4 — a full-bleed, continuously scrolling photo strip.
 *
 * The seamless loop is the photo list rendered twice inside one flex track,
 * animated `translateX(0)` -> `translateX(-50%)` over 60s. The second copy is
 * `aria-hidden` so captions are announced once. Hover (or keyboard focus)
 * pauses it; reduced motion stops it and the strip becomes scrollable instead.
 */
export function HomeSlider(): ReactElement {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [failedSrcs, setFailedSrcs] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    fetch(GALLERY_MANIFEST, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (active) setPhotos(parseGallery(payload))
      })
      .catch(() => {
        // Missing or malformed manifest is the normal empty state, not an
        // error worth surfacing: the placeholder cards already cover it.
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const usingPlaceholders = photos.length === 0
  const cards: SliderCard[] = usingPlaceholders
    ? buildPlaceholderCards()
    : photos.map((photo, index) => ({
        index,
        label: `Photo ${index + 1}`,
        caption: photo.caption,
        src: photo.src,
      }))

  /** A photo whose file failed to load falls back to the placeholder block. */
  function markFailed(src: string): void {
    setFailedSrcs((previous) => {
      if (previous.has(src)) return previous
      const next = new Set(previous)
      next.add(src)
      return next
    })
  }

  function renderCard(card: SliderCard, copy: 'a' | 'b'): ReactElement {
    const showImage = card.src !== undefined && !failedSrcs.has(card.src)

    return (
      <div className="tac-slider__item" key={`${copy}-${card.index}`}>
        {showImage && card.src !== undefined ? (
          <img
            className="tac-slider__media"
            src={card.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => {
              if (card.src !== undefined) markFailed(card.src)
            }}
          />
        ) : (
          <div className="tac-slider__placeholder">
            <span className="tac-slider__placeholder-text">{card.label}</span>
          </div>
        )}
        <p className="tac-slider__caption">{card.caption}</p>
      </div>
    )
  }

  return (
    <section
      className="tac-section tac-section--white tac-slider"
      aria-label="Club photos"
    >
      <div className="tac-slider__viewport">
        <div className="tac-slider__track">
          <div className="tac-slider__copy">
            {cards.map((card) => renderCard(card, 'a'))}
          </div>
          {/* Duplicate copy exists only to close the loop visually. */}
          <div className="tac-slider__copy" aria-hidden="true">
            {cards.map((card) => renderCard(card, 'b'))}
          </div>
        </div>
      </div>
    </section>
  )
}
