# Spec 05 — Apply

**Status:** Approved · **Date:** 2026-10-01 · **Route:** `/apply` · **Depends on:** [Spec 00](00-vision-and-style.md), [Spec 01 §5](01-home.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

---

## 1. Goal

Turn a student who's interested into an applicant, or into someone notified about the next cycle, with no confusion about **whether applications are open, what happens after applying, and when.**

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| Can I apply right now? By when? | Status header |
| What happens after I apply? | Process and dates |
| Am I eligible? Do I need experience? How do interviews work? | FAQ |
| Applications are closed. How do I hear about the next cycle? | Status header (closed), Apply band |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` + status block | bone + grid | Random walk + grid (one composition) |
| 01 | Process and dates | bone | — |
| 02 | FAQ | white | — |
| — | Apply band (`CTABand`) | navy | — |
| — | `SiteFooter` | black | — |

**Exception to spec 00:** `PageHeader` (00 §10) normally has no actions. On `/apply` only, it gets a **status block** with a button (§4.1). This is the one page where the primary action belongs in the header.

---

## 3. Application state (single source of truth)

Every Apply button on the site (header, hero, band, footer) derives from one helper in `lib/applications.ts`:

```ts
type ApplicationState =
  | { status: "open"; deadline?: Date }
  | { status: "closed"; nextOpen?: Date };

getApplicationState(now: Date): ApplicationState
```

**Logic**
1. If `applicationsOpen` is `false`, the state is `closed`.
2. If `applicationsOpen` is `true` and `applyDeadline` is set and `now` is after `applyDeadline` (America/New_York), the state is `closed`.
3. Otherwise the state is `open`.

**When it's evaluated**
- **At build time on every page.** Spec 01 §5 behavior uses this helper rather than reading `applicationsOpen` directly.
- **Again in the browser on `/apply` only.** A small client island re-evaluates with the visitor's clock after mount. If the result differs from the build-time render (for example, the deadline passed after the last deploy), it swaps the status block and the Apply band to the closed state. If the results match, nothing re-renders, so there's no flash.

**Operational note for officers (also in the README at implementation time):** at the deadline, also set the Google Form to "Not accepting responses". Other pages update on the next deploy. The form's own setting guarantees no late submissions.

---

## 4. Sections

### 4.1 Page header with status block

`PageHeader` content changes by state. The random walk (`size="header"`, 3 paths) stays on the right on desktop and is hidden below 768px.

| Element | Open | Closed |
|---|---|---|
| Eyebrow | `APPLY · {CYCLE LABEL}`, e.g. `APPLY · SPRING 2027` | `APPLY` |
| H1 | "Applications are open." | "Applications are closed." |
| Status line (Public Sans 500, navy, tabular) | "Due {Fri, Feb 6} at {11:59 PM} ET". Omitted if there's no deadline | "The next cycle opens {Mon, Jan 12}." If there's no date: "We recruit each fall and spring." |
| Lead (`ink-2`) | "The application takes about {n} minutes. Every application is read by the board." | "Leave your email and we'll tell you when applications open." |
| Button | `primary` "Apply ↗", opens `applyUrl` in a new tab | `primary` "Get notified ↗", opens `interestFormUrl` in a new tab |
| Secondary (`TextLink`) | "Review the process →" (anchor to `#process`) | "Read the FAQ →" (anchor to `#faq`) |

- **Closed with no `interestFormUrl`:** hide the button. The secondary link becomes "Email us →" (`mailto:` the contact email).
- **Layout:** status line, lead and actions stack beneath the H1 in columns 1–7. On mobile the button is full width.
- The status block is a `<section aria-live="polite">`, so a client-side state swap is announced.

### 4.2 Process and dates (§ 01)

- `SectionHeader`: eyebrow `§ 01 — PROCESS AND DATES`, H2 (working copy: "What happens after you apply."), and a lead: "We recruit each fall and spring. Here's how the {cycle label} cycle works."
  - When closed, the lead reads: "We recruit each fall and spring. Here's how a typical cycle works."
- `id="process"` on the section.
- Three stages, as an `<ol>`, each a row:

| # | Stage (H3) | Description (body, 1–2 sentences, working copy) | Date column |
|---|---|---|---|
| 01 | Application | A short written application covering your background, interest in quant, and the track you're considering. | `applyDeadline` → "Due Feb 6" |
| 02 | Interview | A conversation with members of the board — part behavioral, part problem-solving. No prep beyond the FAQ is expected. | `interviewWindow` → "Feb 10–14" |
| 03 | Decision | Everyone who interviews hears back by email. | `decisionDate` → "By Feb 20" |

**Date column rules**
- Public Sans 500, navy, tabular.
- **When closed, or when a date is missing:** show the generic timing from content instead (for example "Week 2", "Week 3"). If there's no generic value either, leave the cell empty without breaking the layout.
- Dates are always formatted from ISO values, never typed as display strings.

**Layout**
- **Desktop:** numeral in column 1, stage title in columns 2–4, description in columns 5–9, date in columns 10–12 (right-aligned). Rows are divided by hairlines, with `rule-strong` above the first row.
- **Mobile:** numeral and title on one line, then the date (caption, navy), then the description.

### 4.3 FAQ (§ 02)

- `SectionHeader`: eyebrow `§ 02 — FAQ`, H2 (working copy: "Common questions."), no lead.
- White background. `id="faq"` on the section.
- **Accordion:** native `<details>`/`<summary>`, one per question. Rules:
  - All closed by default.
  - Multiple can be open at once.
  - The question is in Georgia at H3 size, with a `+`/`−` indicator on the right (Public Sans, navy, `aria-hidden`).
  - Answers are body text, max 68ch, `ink-2`.
  - Rows are divided by hairlines.
  - Uses the default `details` keyboard behavior, with a visible focus ring on the summary.

**Required questions (in order; working answers for the club to finalize)**

| # | Question | Working answer focus |
|---|---|---|
| 1 | Do I need finance or coding experience? | No. Tracks list recommended background (link to `/membership#trading`), but none of it is required. Curiosity and effort matter most. |
| 2 | Which years and majors can apply? | The club's actual eligibility (e.g. all UNC undergraduates, any major). |
| 3 | How selective is it, and what are you looking for? | The honest selectivity framing the club is comfortable with, plus the 3–4 qualities reviewers value. No acceptance-rate numbers unless the club chooses to publish them. |
| 4 | How do interviews work, and how should I prepare? | Format, length and who conducts them. Light preparation tips, such as reviewing basic probability and thinking about why quant. |

- Additional questions may be appended through content. There's no maximum, but the section should stay scannable (recommended ≤ 8).
- After the list: a caption line, "Still have questions? Email {contact email}", with the email as a `TextLink`.

### 4.4 Apply band

- `CTABand`, using the same state as the status block (§3).
- **Open:** H2 "Ready when you are.", lead "Applications close {Fri, Feb 6}." (omitted with no deadline), button `inverse` "Apply ↗".
- **Closed:** H2 "Applications are closed for now.", button `inverse` "Get notified ↗" (`interestFormUrl`). With no interest form, it shows the "Email us →" mailto link instead.
- This is the page's single navy band.

---

## 5. Data

### `content/site.ts` (recruiting fields; this spec is authoritative)

```ts
// Recruiting
applicationsOpen: boolean;
applyUrl: string;                       // Google Form
interestFormUrl?: string;               // Google Form for "Get notified"
cycleLabel?: string;                    // "Spring 2027"
applyDeadline?: string;                 // ISO "YYYY-MM-DDTHH:mm", America/New_York
interviewWindow?: { start: string; end: string };   // ISO "YYYY-MM-DD"
decisionDate?: string;                  // ISO "YYYY-MM-DD"
nextApplicationOpenDate?: string;       // ISO "YYYY-MM-DD"; used when closed
applicationMinutes?: number;            // "about {n} minutes"

// Contact (also used by the footer)
contactEmail: string;
```

### `content/apply.ts` (new)

```ts
export const apply = {
  stages: Array<{
    title: string;
    description: string;
    genericTiming?: string;   // shown when closed or when a dated value is missing, e.g. "Week 2"
  }>,                         // exactly 3: Application, Interview, Decision
  faq: Array<{ question: string; answer: string }>,  // first 4 per §4.3, in order
};
```

- Answers support inline links (a minimal Markdown subset: links and emphasis only), so FAQ #1 can link to Membership.
- Each date-bearing stage maps to a fixed field in a fixed order: Application → `applyDeadline`, Interview → `interviewWindow`, Decision → `decisionDate`.

### Build-time validation
- `applicationsOpen: true` requires a valid `applyUrl` (https, `docs.google.com/forms` or `forms.gle`).
- Each ISO field must parse as a date. `interviewWindow.end` must not be before `start`.
- `apply.stages` must have exactly 3 entries, and `apply.faq` must have at least 4.

---

## 6. Content the club must supply

- [ ] Google Form URL for applications, plus a second short Google Form for "Get notified" (name and email).
- [ ] The current or next cycle: label, deadline (date and time), interview window, decision date, and the next open date when closed.
- [ ] Roughly how long the application takes, in minutes.
- [ ] Stage descriptions (or approve the working copy), and generic timing for each stage.
- [ ] FAQ answers for the four required questions: real eligibility, the selectivity framing you're comfortable with, the qualities you look for, and the interview format.
- [ ] Contact email.

---

## 7. SEO and metadata

- `title`: "Apply" → "Apply · Traders at Carolina".
- `description`, by state at build time:
  - open: "Applications for {cycle label} are open through {deadline}."
  - closed: "Learn how to join Traders at Carolina and get notified when applications open."
- Add `FAQPage` JSON-LD generated from `apply.faq`.
- One `<h1>` (the status headline). Sections use `<h2>`, stages use `<h3>`, and FAQ questions are `<summary>` elements styled as H3.

---

## 8. Cross-spec sync (applied with this spec)

- **00 §10:** Apply config now lives in this spec's §5. `applyDeadline` is an ISO date-time in America/New_York.
- **01 §5:** Home buttons use `getApplicationState()` (§3), not `applicationsOpen` directly. The closed band button "Get notified" still links to `/apply`, where the interest form lives.

---

## 9. Acceptance criteria

1. With `applicationsOpen: true` and a future deadline, the header shows the open state, and Apply opens `applyUrl` in a new tab with `rel="noopener noreferrer"`.
2. With `applicationsOpen: false`, both the header and the band show the closed state, and "Get notified" opens `interestFormUrl`. Without an interest form, the "Email us →" mailto link appears instead.
3. With `applicationsOpen: true` but a deadline in the past *at build time*, every page renders the closed state.
4. With the deadline passing *after* the build, `/apply` swaps to the closed state in the browser, the change is announced via `aria-live`, and there's no layout shift beyond the swapped text.
5. All dates render from ISO values in America/New_York with the formats shown in §4. No typed display strings appear in content.
6. The process rows show generic timing when closed or when a date is missing, with no broken columns.
7. FAQ items are keyboard-operable (`Enter`/`Space` on the summary), with a visible focus ring. `FAQPage` JSON-LD validates in Google's Rich Results Test.
8. Each validation rule in §5 fails `next build` with a clear message.
9. Lighthouse (mobile) ≥ 95 in all categories. The client island adds no more than about 2 KB of gzipped JavaScript.
10. No hard-coded hex values or font stacks. Only spec-00 tokens.
