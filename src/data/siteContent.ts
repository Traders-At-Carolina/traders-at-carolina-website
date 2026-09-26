import type {
  ClubEvent,
  GalleryItem,
  Organization,
  RecruitmentCycle,
  SiteSettings,
  SiteStat,
  TeamMember,
} from '../types/content'

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About & Team', to: '/about' },
  { label: 'Membership', to: '/membership' },
  { label: 'Events', to: '/events' },
  { label: 'Partners', to: '/partners' },
]

export const siteStats: SiteStat[] = []
export const teamMembers: TeamMember[] = []
export const organizations: Organization[] = []
export const events: ClubEvent[] = []
export const galleryItems: GalleryItem[] = []

export const recruitmentCycle: RecruitmentCycle = {
  season: 'Next recruitment cycle',
  status: 'upcoming',
  milestones: [],
  interestFormEnabled: true,
  publicationStatus: 'published',
}

export const siteSettings: SiteSettings = {}

export const pillars = [
  {
    title: 'Learn',
    description:
      'Build a working vocabulary across markets, quantitative reasoning, data, and research—not just finance headlines.',
    detail: 'Workshops · peer teaching · applied projects',
  },
  {
    title: 'Compete',
    description:
      'Practice making decisions under constraints through trading, investing, modeling, and research challenges.',
    detail: 'Team preparation · case work · feedback',
  },
  {
    title: 'Connect',
    description:
      'Meet students with shared curiosity and build relationships with alumni and professionals across the field.',
    detail: 'Community · speakers · industry access',
  },
]

export const learningTracks = [
  {
    title: 'Markets & modeling',
    description: 'Translate market questions into assumptions, models, tests, and decisions.',
  },
  {
    title: 'Data & code',
    description: 'Use data thoughtfully and develop repeatable technical research habits.',
  },
  {
    title: 'Risk & judgment',
    description: 'Reason about uncertainty, tradeoffs, and the limits of a result.',
  },
  {
    title: 'Research & communication',
    description: 'Explain a thesis clearly, defend it with evidence, and improve it through critique.',
  },
]

export const membershipFormats = [
  'Technical workshops',
  'Applied projects',
  'Competitions',
  'Speaker events',
  'Peer learning',
  'Community events',
]

export const memberJourney = [
  {
    title: 'Explore',
    description: 'Attend public programming and learn how the club approaches quantitative finance.',
  },
  {
    title: 'Build',
    description: 'Develop technical fluency through workshops, project teams, and deliberate practice.',
  },
  {
    title: 'Contribute',
    description: 'Share research, support a team, teach a topic, or help shape club programming.',
  },
  {
    title: 'Lead',
    description: 'Create opportunities for the next group of members and strengthen the wider community.',
  },
]

export const membershipFaq = [
  {
    question: 'Do I need prior quantitative finance experience?',
    answer:
      'Confirmed eligibility requirements will be published before recruitment. The public experience is designed to help interested students understand the work before applying.',
  },
  {
    question: 'When does recruitment open?',
    answer:
      'Recruitment dates have not yet been published. Submit the interest form to receive updates when the next cycle is confirmed.',
  },
  {
    question: 'Can I attend an event before applying?',
    answer:
      'Events marked Public are open to prospective members. Each event card clearly identifies its audience and registration status.',
  },
]

export const collaborationFormats = [
  {
    title: 'Technical workshops',
    description: 'Bring a real method, system, or problem into the room and work through it with students.',
  },
  {
    title: 'Industry talks & panels',
    description: 'Share how quantitative work happens in practice, including the judgment behind the models.',
  },
  {
    title: 'Recruiting & networking',
    description: 'Meet students in a focused setting built around substantive conversation.',
  },
  {
    title: 'Trading or modeling challenges',
    description: 'Create a bounded problem that gives teams a meaningful way to demonstrate how they think.',
  },
  {
    title: 'Sponsorships',
    description: 'Support sustained programming while building a credible, long-term campus relationship.',
  },
]
