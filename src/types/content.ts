export type PublicationStatus = 'draft' | 'published' | 'archived'

export interface SiteStat {
  id: string
  label: string
  value: string
  context?: string
  order: number
  publicationStatus: PublicationStatus
}

export interface TeamMember {
  id: string
  name: string
  role: string
  academicDetails?: string
  headshot?: string
  profileUrl?: string
  active: boolean
  order: number
  publicationStatus: PublicationStatus
}

export type OrganizationCategory = 'placement' | 'collaborator' | 'sponsor'

export interface Organization {
  id: string
  name: string
  logo?: string
  url?: string
  category: OrganizationCategory
  approved: boolean
  order: number
  publicationStatus: PublicationStatus
}

export type EventAudience = 'public' | 'members' | 'application-required'
export type EventStatus = 'open' | 'full' | 'canceled' | 'complete'
export type EventType = 'workshop' | 'speaker' | 'competition' | 'recruiting' | 'social'

export interface ClubEvent {
  id: string
  title: string
  slug: string
  type: EventType
  startsAt: string
  endsAt?: string
  location: string
  summary: string
  image?: string
  audience: EventAudience
  registrationUrl?: string
  status: EventStatus
  outcome?: string
  featured: boolean
  order: number
  publicationStatus: PublicationStatus
}

export interface GalleryItem {
  id: string
  image: string
  alt: string
  caption: string
  date?: string
  eventId?: string
  order: number
  publicationStatus: PublicationStatus
}

export type RecruitmentStatus = 'upcoming' | 'open' | 'closed'

export interface TimelineMilestone {
  id: string
  label: string
  date?: string
  description: string
  order: number
  publicationStatus: PublicationStatus
}

export interface RecruitmentCycle {
  season: string
  status: RecruitmentStatus
  opensAt?: string
  closesAt?: string
  nextImportantDate?: string
  milestones: TimelineMilestone[]
  applicationUrl?: string
  interestFormEnabled: boolean
  manualOverride?: RecruitmentStatus
  publicationStatus: PublicationStatus
}

export interface SiteSettings {
  contactEmail?: string
  partnershipEmail?: string
  schedulingUrl?: string
  discordUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
}

export interface InterestSubmission {
  id: string
  fullName: string
  email: string
  graduationYear: string
  academicProgram: string
  interests: string[]
  message?: string
  consent: boolean
  submittedAt: string
}
