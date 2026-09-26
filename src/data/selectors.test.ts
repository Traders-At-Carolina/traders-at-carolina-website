import { describe, expect, it } from 'vitest'
import type { ClubEvent } from '../types/content'
import { splitEventsByDate } from './selectors'

const makeEvent = (overrides: Partial<ClubEvent>): ClubEvent => ({
  id: 'event',
  title: 'Test event',
  slug: 'test-event',
  type: 'workshop',
  startsAt: '2026-10-12T18:00:00-04:00',
  location: 'Campus',
  summary: 'Test summary',
  audience: 'public',
  status: 'open',
  featured: false,
  order: 0,
  publicationStatus: 'published',
  ...overrides,
})

describe('splitEventsByDate', () => {
  const now = new Date('2026-09-26T12:00:00-04:00')

  it('shows only published events', () => {
    const result = splitEventsByDate([
      makeEvent({ id: 'published' }),
      makeEvent({ id: 'draft', publicationStatus: 'draft' }),
      makeEvent({ id: 'archived', publicationStatus: 'archived' }),
    ], now)

    expect(result.upcoming.map((event) => event.id)).toEqual(['published'])
  })

  it('sorts upcoming events soonest first and past events newest first', () => {
    const result = splitEventsByDate([
      makeEvent({ id: 'later', startsAt: '2026-11-01T12:00:00-04:00' }),
      makeEvent({ id: 'sooner', startsAt: '2026-10-01T12:00:00-04:00' }),
      makeEvent({ id: 'older', startsAt: '2026-07-01T12:00:00-04:00' }),
      makeEvent({ id: 'newer', startsAt: '2026-09-01T12:00:00-04:00' }),
    ], now)

    expect(result.upcoming.map((event) => event.id)).toEqual(['sooner', 'later'])
    expect(result.past.map((event) => event.id)).toEqual(['newer', 'older'])
  })

  it('keeps future canceled and full events visible while archiving completed events', () => {
    const result = splitEventsByDate([
      makeEvent({ id: 'canceled', status: 'canceled' }),
      makeEvent({ id: 'full', status: 'full' }),
      makeEvent({ id: 'complete', status: 'complete' }),
    ], now)

    expect(result.upcoming.map((event) => event.id)).toEqual(['canceled', 'full'])
    expect(result.past.map((event) => event.id)).toEqual(['complete'])
  })
})
