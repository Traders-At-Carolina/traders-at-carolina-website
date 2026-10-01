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
