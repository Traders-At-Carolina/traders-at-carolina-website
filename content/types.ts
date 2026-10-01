import type { StaticImageData } from "next/image";

/** Recruiting configuration. Full field definitions: docs/specs/05-apply.md §5. */
export type Recruiting = {
  applicationsOpen: boolean;
  /** Google Form URL. Required (https, Google Forms) when applications are open. */
  applyUrl: string;
  /** Google Form for "Get notified" when applications are closed. */
  interestFormUrl?: string;
  /** e.g. "Spring 2027" */
  cycleLabel?: string;
  /** ISO "YYYY-MM-DDTHH:mm" (or "YYYY-MM-DD" = 23:59), America/New_York. */
  applyDeadline?: string;
  /** ISO "YYYY-MM-DD" dates. */
  interviewWindow?: { start: string; end: string };
  /** ISO "YYYY-MM-DD" */
  decisionDate?: string;
  /** ISO "YYYY-MM-DD"; shown when applications are closed. */
  nextApplicationOpenDate?: string;
  /** Approximate minutes to complete the application. */
  applicationMinutes?: number;
};

export type Site = {
  name: string;
  /** Canonical origin, no trailing slash. */
  url: string;
  /** One-line mission statement (footer, default meta description). */
  mission: string;
  contactEmail?: string;
  social: { instagram?: string; linkedin?: string };
  /** UNC student-organization disclaimer, if required (00 §14). */
  disclaimer?: string;
  recruiting: Recruiting;
};

export type ContentLink = { label: string; href: string };

export type HomePhoto = {
  /** Static import from public/images/events, e.g. `import p from "@/public/images/events/x.jpg"`. */
  src: StaticImageData;
  alt: string;
  /** Editorial caption, e.g. "Mock trading night, Spring 2026". */
  caption: string;
  ratio: "3:2" | "4:5";
};

/** Home page content. Field definitions: docs/specs/01-home.md §6. */
export type HomeContent = {
  hero: {
    headline: string;
    /** Substring of `headline` rendered in italic. */
    headlineEmphasis?: string;
    subhead: string;
  };
  /** H2 copy for each section. */
  headings: { pillars: string; numbers: string; inside: string };
  /** Exactly three: Preparation, Engagement, Opportunity. */
  pillars: Array<{ title: string; body: string; link: ContentLink }>;
  /** Real, defensible numbers only. Missing values are omitted from the page. */
  stats: { members?: number; foundedYear?: number; partnerFirms?: number };
  /** 0 (section hidden) or 2–3 photos. */
  photos: HomePhoto[];
  upcoming?: {
    title: string;
    /** ISO "YYYY-MM-DDTHH:mm", America/New_York. */
    date: string;
    location: string;
    link?: ContentLink;
  };
};

export type Partner = {
  name: string;
  /** The club's actual relationship term, e.g. "Sponsor since 2024", "Event partner". */
  relationship?: string;
  /** Optional https link to the firm's site. */
  url?: string;
};

export type Advisor = { name: string; title: string; department: string; note?: string };

/** About page content. Field definitions: docs/specs/02-about.md §5. */
export type AboutContent = {
  header: { h1: string; lead: string };
  /** H2 copy for each section. `advisorsOnly` is used when there are advisors but no partners. */
  headings: { mission: string; story: string; principles: string; partners: string; advisorsOnly: string };
  mission: { statement: string; body: string };
  vision: { statement: string; body: string };
  story: {
    /** 0 (section hidden unless 3+ milestones) or 2–4 paragraphs. Third person. */
    paragraphs: string[];
    quote?: { text: string; name: string; role: string; classYear?: number };
  };
  /** 3–4 principles. */
  principles: Array<{ title: string; body: string }>;
  /** Only firms that have agreed to be listed. */
  partners: Partner[];
  advisors: Advisor[];
};

export type TrackId = "trading" | "research" | "development";

export type Expectation = { value: string; detail: string };

/** Membership page content. Field definitions: docs/specs/03-membership.md §5. */
export type MembershipContent = {
  header: { h1: string; lead: string };
  headings: { how: string; tracks: string; activities: string; expectations: string };
  /** Exactly 3: Apply, Choose a track, Build with your track. */
  steps: Array<{ title: string; body: string }>;
  /** Shown under the steps when set, e.g. "Members can switch tracks at the start of each semester." */
  switchingPolicy?: string;
  /** Exactly 3, in Trading, Research, Development order. */
  tracks: Array<{
    id: TrackId;
    /** e.g. "Quantitative trading" (rendered uppercase). */
    roleLabel: string;
    name: string;
    description: string;
    /** 2–4 items. Recommended, never required. */
    recommendedBackground: string[];
    /** Slug of a person in content/team.ts (spec 04). */
    leadSlug?: string;
  }>;
  activities: Array<{
    name: string;
    description: string;
    /** Real cadence, e.g. "Weekly" or "Thursdays, 7–8:30 PM". Left blank until confirmed. */
    frequency?: string;
    tracks: "all" | TrackId[];
  }>;
  /** Rows without a confirmed value are omitted; prerequisites is always shown. */
  expectations: {
    timeCommitment?: Expectation;
    attendance?: Expectation;
    prerequisites: Expectation;
  };
};

/** Club history milestone (00 §12, 02 §5). The list appears once there are 3+ entries. */
export type TimelineEntry = { year: number; title: string; description?: string };
