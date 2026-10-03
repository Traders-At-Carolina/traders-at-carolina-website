/**
 * An image the site can render: a static import today, an uploaded image once spec 06 lands.
 * Same shape as next/image's StaticImageData, so static imports satisfy it. Without `blurDataURL` the image renders without a blur placeholder.
 */
export type ImageAsset = { src: string; width: number; height: number; blurDataURL?: string };

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
  /** Static import from public/images/events, e.g. `import p from "@/public/images/events/x.jpg"`, or an uploaded image (spec 06). */
  src: ImageAsset;
  alt: string;
  /** Editorial caption, e.g. "Mock trading night, Spring 2026". */
  caption: string;
  ratio: "3:2" | "4:5";
};

/** Home page content. Field definitions: docs/specs/01-home.md §6. */
export type HomeContent = {
  hero: {
    /** Line above the headline, rendered as the "§ 01 — …" eyebrow. */
    eyebrow: string;
    headline: string;
    /** Substring of `headline` rendered in italic. */
    headlineEmphasis?: string;
    subhead: string;
    /** Caption under the hero's random-walk figure ("Fig. 1 — …"). */
    figureCaption: string;
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
  /**
   * Official mark from the firm's own site or media kit, in public/images/sponsors, with a transparent
   * background. Rendered as a single-color mask, so only its shape matters. width/height set the aspect ratio.
   */
  logo?: ImageAsset;
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
    /** One line on who the track suits, completing "Good fit if you…". */
    goodFit?: string;
    /** A representative problem a member works on, so visitors can feel the track. */
    sampleProblem?: string;
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
  /** 0 (hidden) or 3 photos: the first runs wide under "How it works", the other two pair up after Activities. */
  photos?: HomePhoto[];
};

/** A company's official mark on a transparent background, static-imported from public/images/companies. */
export type CompanyMark = { name: string; logo: ImageAsset };

/** Exec board member or track lead. Field definitions: docs/specs/04-team.md §5. */
export type Person = {
  /** Unique kebab-case id; used as the /team#anchor and by membership leadSlug. */
  slug: string;
  name: string;
  /** e.g. "President", "Trading Lead". */
  role: string;
  /** Tier on /team: executive board, then co-presidents, then directors. "track-lead" only links from /membership. */
  group: "co-president" | "exec" | "director" | "track-lead";
  /** Required for track leads; set on an exec who also leads a track. */
  track?: TrackId;
  /** Sort order within the group (President first by convention). */
  order: number;
  /** e.g. 2027 → rendered "'27". Optional; the meta line shows whatever is set. */
  classYear?: number;
  major?: string;
  /** Static import from public/images/team, e.g. `import jane from "@/public/images/team/jane-doe.jpg"`. */
  headshot?: ImageAsset;
  /** Required when headshot is set, e.g. "Portrait of Jane Doe". */
  alt?: string;
  /** One line, only with the person's consent: a role ("Previously at Citadel") or a result ("1st place, Citadel Challenge"). */
  placement?: string;
  /** The placement company's square icon, shown on the headshot on hover. */
  company?: CompanyMark;
  /** Full https URL. */
  linkedin?: string;
};

export type TeamContent = {
  /** e.g. "2026–27"; shown in the Executive board heading. */
  academicYear?: string;
  /** Closing note at the bottom of /team; hidden when empty. */
  note?: string;
  people: Person[];
};

/** A firm where members or alumni have interned or worked full-time. Names only (spec 04 §4.4). */
export type Placement = { firm: string };

/** Apply page content. Field definitions: docs/specs/05-apply.md §5. */
export type ApplyContent = {
  /** Exactly 3 reasons to join, shown under the header. */
  benefits: Array<{ title: string; body: string; link?: { label: string; href: string } }>;
  /** Exactly 3, in order: Application, Interview, Decision. */
  stages: Array<{
    title: string;
    description: string;
    /** How much it asks of the applicant, e.g. "One conversation". The Application stage uses applicationMinutes when set. */
    effort?: string;
    /** Shown when applications are closed or a date is missing, e.g. "Week 2". */
    genericTiming?: string;
  }>;
  /**
   * Answers support [links](/path) and *emphasis* only. `draft` answers show in development and
   * preview deployments for officers to review, and stay off production until the flag is removed.
   */
  faq: Array<{ question: string; answer: string; draft?: boolean }>;
};

/** Club history milestone (00 §12, 02 §5). The list appears once there are 3+ entries. */
export type TimelineEntry = { year: number; title: string; description?: string };
