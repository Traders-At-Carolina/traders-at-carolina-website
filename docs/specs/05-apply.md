# Spec 05 — Apply

**Status:** Approved · **Date:** 2026-10-01 · **Revised:** 2026-10-02 (conversion pass) · **Route:** `/apply` · **Depends on:** [Spec 00](00-vision-and-style.md), [Spec 01 §5](01-home.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

---

## 1. Goal

Turn a student who's interested into an applicant, or into someone notified about the next cycle, with no confusion about **whether applications are open, what happens after applying, and when.**

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| Can I apply right now? By when? | Status header |
| Why is it worth applying? | What you get |
| What happens after I apply? | Process and dates |
| Am I eligible? Do I need experience? How do interviews work? | FAQ |
| Applications are closed. How do I hear about the next cycle? | Status header (closed), Apply band |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` + status block | bone + grid | Random walk + grid (one composition) |
| 01 | What you get | bone | — |
| 02 | Process and dates | bone | — |
| 03 | FAQ | graphite | — |
| — | Apply band (`CTABand`) | navy | — |
| — | `SiteFooter` | black | — |

**Conversion rule (2026-10-02 revision):** every section ends at, or sits next to, the one action for the current state: "Apply" while open, "Keep me posted" while closed. The closed state leads with that action, not with the fact that applications are closed, and no two sections repeat the same "closed" message.

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

| Element | Open | Closed (with interest form) |
|---|---|---|
| Eyebrow | `APPLY · {CYCLE LABEL}`, e.g. `APPLY · SPRING 2027` | `APPLY` |
| H1 | "Applications are open." | "Be first to know when applications open." |
| Status line (Public Sans 500, navy, tabular) | "Due {Fri, Feb 6} at {11:59 PM} ET". Omitted if there's no deadline | "Applications are closed · The next cycle opens {Mon, Jan 12}." If there's no date: "Applications are closed · We recruit each fall and spring." |
| Lead (`ink-2`) | "The application takes about {n} minutes." Omitted without `applicationMinutes` | "Leave your email and we'll let you know as soon as the next cycle opens." |
| Button | `primary` "Apply ↗", opens `applyUrl` in a new tab | `primary` "Keep me posted ↗", opens `interestFormUrl` in a new tab |
| Secondary (`TextLink`) | "Review the process →" (anchor to `#process`) | None, so nothing competes with the one action |
| Note (caption, `ink-3`) | "No experience needed to apply" | "Name and email only · No experience needed to apply" |

- **Closed with no `interestFormUrl`:** H1 "Applications are closed.", the status line without the "Applications are closed ·" prefix, no lead, no button. The secondary link is "Email us →" (`mailto:` the contact email), or "Read the FAQ →" without one.
- **Layout:** status line, lead, actions and note stack beneath the H1 in columns 1–7. On mobile the button is full width.
- The status block is wrapped in `aria-live="polite"`, so a client-side state swap is announced.

### 4.2 What you get (§ 01)

- `SectionHeader`: eyebrow `§ 01 — WHAT YOU GET`, H2 (working copy: "Everything you need to break into quant."), no lead. `id="what-you-get"`.
- Exactly three benefits from `apply.benefits`, as columns divided by hairlines on desktop (the Membership "How it works" pattern) and stacked on mobile. Each has an H3 title, 1–2 sentences of body, and an optional `TextLink` into Membership or About.
- After the columns: the page's primary action for the current state as a `secondary` button ("Apply ↗" / "Keep me posted ↗"; the email/FAQ fallback when closed with no interest form). It switches live at the deadline like the header.
- **Planned:** a static row of firm marks ("Where our leadership has worked") reusing the Team page's company marks, shown only when that list is non-empty.

### 4.3 Process and dates (§ 02)

- `SectionHeader`: eyebrow `§ 02 — PROCESS AND DATES`, H2 (working copy: "What happens after you apply."), and a lead: "We recruit each fall and spring. Here's how the {cycle label} cycle works."
  - When closed, the lead reads: "We open applications each fall and spring. Here's how a typical cycle works."
- `id="process"` on the section.
- Three stages as an `<ol>` stepped timeline. Each stage shows a caption line (numeral, then the date column value, then "OPEN NOW" on the current stage), the H3 title, an effort line (caption, `ink-3`) and the description.

| # | Stage (H3) | Effort (working copy) | Date |
|---|---|---|---|
| 01 | Application | "About {applicationMinutes} minutes" when set, else `effort` from content | `applyDeadline` → "Due Feb 6" |
| 02 | Interview | `effort` from content, e.g. "One conversation" | `interviewWindow` → "Feb 10–14" |
| 03 | Decision | `effort` from content, e.g. "By email" | `decisionDate` → "By Feb 20" |

**Date rules**
- Public Sans 500, navy, tabular.
- **When closed, or when a date is missing:** show the generic timing from content instead (for example "Week 2"). With no generic value either, show only the numeral.
- Dates are always formatted from ISO values, never typed as display strings.

**Layout**
- **Desktop:** three columns on a horizontal hairline rail (`rule-strong`) with an 11px ring node at the start of each column. While open, the Application node is filled navy and its caption adds "OPEN NOW".
- **Mobile:** a vertical rail on the left joining the nodes, with each stage's content to its right.

### 4.4 FAQ (§ 03)

- Graphite (00 §6). `id="faq"` on the section.
- **Desktop:** two columns under one full-width hairline. Eyebrow `§ 03 — FAQ`, H2 "Common questions." and the "Still have questions? Email {contact email}" caption in columns 1–4, sticky while scrolling. The accordion is in columns 6–12. **Mobile:** stacked, with the accordion under the heading.
- **Accordion:** native `<details>`/`<summary>`, one per question. Rules:
  - All closed by default.
  - Multiple can be open at once.
  - The question is in Georgia at H3 size, with a `+`/`−` indicator on the right (Public Sans, navy, `aria-hidden`).
  - Answers are body text, max 68ch, `ink-2`.
  - Rows are divided by hairlines.
  - Uses the default `details` keyboard behavior, with a visible focus ring on the summary.

**Questions (in order; working answers for the club to finalize)**

| # | Question | Answer focus |
|---|---|---|
| 1 | Do I need finance or coding experience? | No. Tracks list recommended background (link to `/membership#trading`), but none of it is required. Curiosity and effort matter most. |
| 2 | Which years and majors can apply? | The club's actual eligibility. |
| 3 | How do interviews work, and how should I prepare? | Format, length and who conducts them, plus light prep tips. |
| 4 | How selective is it, and what are you looking for? | The selectivity framing the club is comfortable with, plus the qualities reviewers value. No acceptance-rate numbers unless the club publishes them. |
| 5 | What's the time commitment? | Weekly expectations, linking to `/membership#expectations`. |

- **Drafts:** an item with `draft: true` renders in development and on Vercel preview deployments, never on production (`VERCEL_ENV === "production"`). This lets officers review working answers on a preview link before publishing.
- Additional questions may be appended through content. Recommended ≤ 8.

### 4.5 Apply band

- `CTABand`, using the same state as the status block (§3).
- **Open:** H2 "Ready when you are.", lead "Applications close {Fri, Feb 6}." (omitted with no deadline), button `inverse` "Apply ↗".
- **Closed with interest form:** H2 "Don't miss the next cycle.", lead "Applications open {Mon, Jan 12}. We'll email you when they do." or, with no future date, "We'll email you when applications open.", button `inverse` "Keep me posted ↗".
- **Closed with no interest form:** H2 "Applications are closed for now.", with the "Email us" / "Read the FAQ" fallback.
- This is the page's single navy band.

### 4.6 Measurement

Analytics are defined in [spec 06 §7](06-admin.md). Every Apply and "Keep me posted" action on this page carries the §7.1 tracking attributes, with placements `apply-header`, `apply-benefits` and `band`, so the dashboard can compare clicks by section.

---

## 5. Data

### `content/site.ts` (recruiting fields; this spec is authoritative)

```ts
// Recruiting
applicationsOpen: boolean;
applyUrl: string;                       // Google Form
interestFormUrl?: string;               // Google Form for "Keep me posted"
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
  benefits: Array<{ title: string; body: string; link?: { label: string; href: string } }>, // exactly 3
  stages: Array<{
    title: string;
    description: string;
    effort?: string;          // "One conversation"; Application uses applicationMinutes when set
    genericTiming?: string;   // shown when closed or when a dated value is missing, e.g. "Week 2"
  }>,                         // exactly 3: Application, Interview, Decision
  faq: Array<{ question: string; answer: string; draft?: boolean }>,  // per §4.4, in order
};
```

- Answers support inline links (a minimal Markdown subset: links and emphasis only), so FAQ #1 can link to Membership.
- Each date-bearing stage maps to a fixed field in a fixed order: Application → `applyDeadline`, Interview → `interviewWindow`, Decision → `decisionDate`.

### Build-time validation
- `applicationsOpen: true` requires a valid `applyUrl` (https, `docs.google.com/forms` or `forms.gle`).
- Each ISO field must parse as a date. `interviewWindow.end` must not be before `start`.
- `apply.benefits` and `apply.stages` must each have exactly 3 entries. Benefit links start with `/`, `#` or `https://`.
- `apply.faq` must have at least 1 published (non-draft) entry. The spec target is 4 or more once the club confirms the drafts.

---

## 6. Content the club must supply

- [ ] Google Form URL for applications, plus a second short Google Form for "Keep me posted" (name and email).
- [ ] The current or next cycle: label, deadline (date and time), interview window, decision date, and the next open date when closed.
- [ ] Roughly how long the application takes, in minutes.
- [ ] Stage descriptions (or approve the working copy), and generic timing for each stage.
- [ ] FAQ answers (drafts are in `content/apply.ts`): real eligibility, the selectivity framing you're comfortable with, the qualities you look for, the interview format, and the weekly time commitment.
- [ ] Confirm what the "Keep me posted" list receives, so the header and band promise is accurate.
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
- **01 §5:** Home buttons use `getApplicationState()` (§3), not `applicationsOpen` directly. The closed band button "Keep me posted" still links to `/apply`, where the interest form lives.

---

## 9. Acceptance criteria

1. With `applicationsOpen: true` and a future deadline, the header shows the open state, and Apply opens `applyUrl` in a new tab with `rel="noopener noreferrer"`.
2. With `applicationsOpen: false`, the header leads with "Be first to know when applications open.", the header has exactly one link ("Keep me posted"), and the band reads "Don't miss the next cycle." Every "Keep me posted" opens `interestFormUrl`. Without an interest form, the "Email us →" mailto link appears instead.
3. With `applicationsOpen: true` but a deadline in the past *at build time*, every page renders the closed state.
4. With the deadline passing *after* the build, `/apply` swaps to the closed state in the browser, the change is announced via `aria-live`, and there's no layout shift beyond the swapped text.
5. All dates render from ISO values in America/New_York with the formats shown in §4. No typed display strings appear in content.
6. The process timeline shows generic timing when closed or when a date is missing, with no broken columns. While open, the Application stage reads "OPEN NOW" with a filled node.
7. FAQ items are keyboard-operable (`Enter`/`Space` on the summary), with a visible focus ring. `FAQPage` JSON-LD validates in Google's Rich Results Test.
8. Each validation rule in §5 fails `next build` with a clear message.
9. Lighthouse (mobile) ≥ 95 in all categories. The client island adds no more than about 2 KB of gzipped JavaScript.
10. No hard-coded hex values or font stacks. Only spec-00 tokens.
11. Draft FAQ answers render on preview deployments and never on production.
12. Every Apply and Keep me posted action on `/apply` carries the spec 06 §7.1 tracking attributes with its placement.
