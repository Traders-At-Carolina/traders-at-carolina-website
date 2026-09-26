import { events, galleryItems, organizations, recruitmentCycle, siteStats, teamMembers } from './siteContent'
import type { ClubEvent, PublicationStatus } from '../types/content'

const isPublished = <T extends { publicationStatus: PublicationStatus }>(item: T) =>
  item.publicationStatus === 'published'

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order

export const getPublishedStats = () => siteStats.filter(isPublished).sort(byOrder)

export const getPublishedTeam = () =>
  teamMembers.filter((member) => isPublished(member) && member.active).sort(byOrder)

export const getPublishedOrganizations = () =>
  organizations.filter((organization) => isPublished(organization) && organization.approved).sort(byOrder)

export const getPublishedGallery = () => galleryItems.filter(isPublished).sort(byOrder)

export const getPublishedEvents = () => events.filter(isPublished).sort(byOrder)

export const getPublishedRecruitmentCycle = () => {
  if (!isPublished(recruitmentCycle)) return null
  return {
    ...recruitmentCycle,
    milestones: recruitmentCycle.milestones.filter(isPublished).sort(byOrder),
  }
}

export const splitEventsByDate = (source: ClubEvent[], now = new Date()) => {
  const published = source.filter(isPublished)
  const upcoming = published
    .filter((event) => new Date(event.endsAt ?? event.startsAt) >= now && event.status !== 'complete')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = published
    .filter((event) => new Date(event.endsAt ?? event.startsAt) < now || event.status === 'complete')
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return { upcoming, past }
}
