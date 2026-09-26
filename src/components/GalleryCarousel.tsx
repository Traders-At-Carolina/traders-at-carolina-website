import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { GalleryItem } from '../types/content'
import { ContentUnavailable } from './ui'

export function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused || items.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [items.length, paused])

  if (!items.length) {
    return (
      <ContentUnavailable
        title="Club photography is being curated"
        description="Meeting, competition, workshop, and community photos will appear after member-approved assets are supplied."
      />
    )
  }

  const showPrevious = () => setActiveIndex((index) => (index - 1 + items.length) % items.length)
  const showNext = () => setActiveIndex((index) => (index + 1) % items.length)
  const activeItem = items[activeIndex]

  return (
    <div
      ref={regionRef}
      className="gallery-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Club life photos"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') showPrevious()
        if (event.key === 'ArrowRight') showNext()
      }}
      tabIndex={0}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Photo {activeIndex + 1} of {items.length}: {activeItem.caption}
      </div>
      <figure>
        <img src={activeItem.image} alt={activeItem.alt} />
        <figcaption>
          <span>{activeItem.caption}</span>
          <span>
            {activeIndex + 1} / {items.length}
          </span>
        </figcaption>
      </figure>
      <div className="carousel-controls">
        <button type="button" onClick={showPrevious} aria-label="Previous photo">
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          <span>{paused ? 'Play' : 'Pause'}</span>
        </button>
        <button type="button" onClick={showNext} aria-label="Next photo">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
