# Spec 03 — Membership

**Status:** Approved · **Date:** 2026-09-30 · **Route:** `/membership` · **Depends on:** [Spec 00](00-vision-and-style.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

---

## 1. Goal

Show a prospective member **exactly what membership involves**: how the club is organized, which track fits them, what they'll do each week, and what's expected of them. A student should finish the page knowing which track they'd pick and whether they can commit to it.

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| How does joining work? | How it works |
| Which track is right for me, and which career does it lead to? | Tracks |
| What would I actually do, and how often? | What we do |
| How much time does it take? Am I qualified? | Expectations |
| What would the interview feel like? | Try a problem |
| How do I apply? | Footer CTA zone |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` | bone + grid | Order-book depth chart + grid (one composition) |
| 01 | How it works | bone | — |
| 02 | Tracks | bone | — |
| 03 | Try a problem (§3.7) | graphite | — |
| 03 | What we do | bone | — |
| 04 | Expectations | white | — |
| — | `SiteFooter` | black | — |

Questions about the application process (deadlines, interviews, selectivity) belong in the FAQ on `/apply` (spec 05), not here.

---

## 3. Sections

### 3.1 Page header

- `PageHeader` (00 §10).
- **Eyebrow:** `MEMBERSHIP`, with no § number.
- **H1:** working copy "Three tracks. One standard."
- **Lead:** max about 30 words. Working copy: "Members join one of three tracks — Trading, Research or Development — and build skills that map directly to roles at quantitative trading firms."
- **Art:** an order-book depth chart (`DepthChart`, 00 §7.6) in place of the `RandomWalk`, passed through `PageHeader`'s `art` prop: bids and asks stepping out from the spread, a nod to the market-making games at the heart of the club. Unlabeled and decorative; hidden below 768px.

### 3.2 How it works (§ 01)

**Content**
- `SectionHeader`: eyebrow `§ 01 — HOW IT WORKS`, H2 (working copy: "From application to your first project."), no lead.
- Three steps, each with a numeral (`01`–`03`, caption role, navy, tabular), an H3 title and one sentence:

| # | Title | Working sentence |
|---|---|---|
| 01 | Apply | Submit a short application during the recruiting window. |
| 02 | Choose a track | Pick Trading, Research or Development based on the role you're working toward. |
| 03 | Build with your track | Attend track sessions, work on projects and prepare alongside peers. |

- **Switching note:** one caption line under the steps, from `membership.switchingPolicy`. Working copy: "Members can switch tracks at the start of each semester." If the field is empty, the line is omitted.

**Layout**
- **Desktop:** three columns divided by vertical hairlines, with a `→` glyph in `ink-3` between steps. The glyph is decorative and carries `aria-hidden`.
- **Mobile:** stacked, divided by horizontal hairlines, with no arrows.
- Markup: an `<ol>`.

### 3.3 Tracks (§ 02)

This is the main section of the page.

**Content**
- `SectionHeader`: eyebrow `§ 02 — TRACKS`, H2 (working copy: "Pick the role you're preparing for."), optional lead.
- Exactly three track blocks, in this order: **Trading**, **Research**, **Development**. Each block has:

| Element | Style | Content |
|---|---|---|
| Role label | Eyebrow style (no §), navy | `QUANTITATIVE TRADING` / `QUANTITATIVE RESEARCH` / `SOFTWARE ENGINEERING` |
| Track name | H3, Georgia | "Trading", "Research", "Development" |
| Description | Body | 2–3 sentences on what members in this track do (max about 60 words) |
| Recommended background | Caption-sized label `RECOMMENDED BACKGROUND` + a list | 2–4 items |
| Track lead (optional) | Caption | "Led by {Name}", linking to `/team#{slug}` |

- **Working content** (the club finalizes it):

| Track | Description focus | Recommended background |
|---|---|---|
| Trading | Market-making games, decision-making under uncertainty, expected value, and fast mental math | Probability, mental math, comfort with quick estimation |
| Research | Statistics, modeling and research projects on market data | Statistics, linear algebra, Python or R |
| Development | Building backtesters, trading simulators and infrastructure for the club | Python or C++, data structures and algorithms |

- **Framing rule:** the list is always labeled "Recommended background", never "requirements". Directly beneath the three tracks, a caption reads: "None of these are required to join." This must match the expectations in §3.5.

**Layout**
- **Desktop (≥ 1024px):** three equal columns divided by vertical hairlines, with each column top-aligned. Recommended-background lists align to a shared baseline where possible (the description area has a min-height to absorb copy length).
- **Tablet (768–1023px):** stacked full-width blocks. Inside each block, the description sits in columns 1–7 and the recommended background in columns 8–12.
- **Mobile:** stacked, divided by horizontal hairlines.
- Each block is an `<article>` with `id="trading"`, `id="research"` or `id="development"`, so other pages can deep-link to `/membership#research`.

### 3.4 What we do (§ 03)

**Content**
- `SectionHeader`: eyebrow `§ 03 — WHAT WE DO`, H2 (working copy: "The work, week to week."), no lead.
- Four activities, in this order:

| Activity | Description focus | Frequency (example) | Tracks |
|---|---|---|---|
| Education sessions | Probability, statistics, market microstructure, mental math | Weekly | All tracks |
| Mock trading and games | Market-making games and trading simulations | Biweekly | All tracks |
| Interview prep | Mock interviews, problem sets, résumé reviews | Weekly during recruiting season | All tracks |
| Firm events and competitions | Speaker events, firm info sessions, external competitions | Each semester | All tracks |

- Frequency and track values come from content, so the examples above are not final.

**Layout:** a table-style list, not cards.
- **Desktop columns:**
  - Activity name (H3, columns 1–4)
  - description (body, `ink-2`, columns 5–9)
  - frequency (Public Sans 500, navy, tabular, columns 10–11)
  - tracks (caption, column 12)
- Rows are divided by `rule` hairlines, with a `rule-strong` line above the first row. There's a visually quiet header row in caption style with the labels Activity / Description / Frequency / Tracks.
- **Mobile:** each activity is a stacked block (name, then a meta line "Weekly · All tracks" in caption style, then the description), divided by hairlines.
- Markup: a semantic `<table>` on desktop is acceptable. A `<dl>`-based structure is also fine as long as the column headers are exposed to screen readers. The mobile and desktop layouts come from one DOM structure (CSS only), with no duplicated content.

### 3.5 Expectations (§ 04)

**Content**
- `SectionHeader`: eyebrow `§ 04 — EXPECTATIONS`, H2 (working copy: "What we ask of members."), no lead.
- A definition list (`<dl>`) with exactly three entries:

| Term (H3) | Value | Detail (body, `ink-2`) |
|---|---|---|
| Time commitment | "About {n} hours a week" (Public Sans 500, navy, tabular) | One sentence, for example the weekly meeting plus track work |
| Attendance | "{n} of {m} sessions" or the club's actual rule | One sentence on what happens if a member falls below it |
| Prerequisites | "None required" | "Each track lists recommended background. Curiosity and consistent effort matter more." |

**Layout**
- White background section.
- **Desktop:** each entry is a row: term in columns 1–4, value in columns 5–7, detail in columns 8–12. Rows are divided by hairlines.
- **Mobile:** stacked term, then value, then detail.

### 3.6 Apply band (removed 2026-10-02)

The closing Apply call to action now lives in the footer on every page (spec 07). Membership no longer renders `CTABand`.

### 3.7 Try a problem (§ 03, added 2026-10-02)

Two short games that let a visitor feel the thinking the club trains, then point them at the interview. Sits directly after Tracks; later sections renumber (`numberSections`).

**Content**
- `SectionHeader`: eyebrow `§ 03 — TRY A PROBLEM`, H2 from `headings.games` (working copy: "Two short problems, before you apply."), lead: "The kind of question you'll work through out loud in an interview. Nothing to sign up for; your best score stays in this browser."
- Graphite section. One card (columns 5–12 beside the header from 1024px, full width below, 16px corners, `rule` hairline, a faint bone tint over the graphite) with a two-tab segmented control: **Mental math sprint** and **Fermi markets**. A bone pill slides under the active tab; switching resets the game left behind.
- **Rounding exception (00 §10):** the games are the one place outside the header's Apply button with rounded corners: the card (16px), the tab track (12px), and the buttons, tabs and answer input inside it (10px, `shape="rounded"`). The slider thumb is round.
- **Buttons on graphite:** `surface-graphite` remaps navy to bone, so the games use the `light` (bone fill, graphite text) and `light-outline` button variants.

**Mental math sprint** (`lib/games/mental-math.ts`): Zetamac's default rules, so scores compare with the drill trading candidates practise on. 120 seconds; each question is +, −, × or ÷ at random: + is (2–100) + (2–100), × is (2–12) × (2–100), and − and ÷ are those run backwards (whole, non-negative answers). Set in Zetamac's own type ("Helvetica Neue", Arial, Helvetica, sans-serif, the `font-zetamac` token) with the problem and answer box on one line, "780 ÷ 12 = [ ]", as Zetamac lays it out; the box is four digits wide (the largest answer is 1,200). A correct answer submits itself; Enter on a wrong one clears it with "Not quite. Try again or skip." beside the Skip button. A hairline timer drains across the top over a "N correct · Ns left" line.

**Fermi markets** (`lib/games/fermi.ts`): 3 questions drawn from a bank of 40 big-number questions (populations, distances, counts, combinatorics). The visitor quotes a spread, Low and High (shorthand like `250k`, `3.5m`, `2e9` accepted), like making a two-sided market. The spread draws live as a bone band on a log-scale number line labelled in powers of ten (1, 1K, 1M…). Before the reveal the line fits only the visitor's numbers (one order of magnitude of padding each side), so its scale never hints at the answer; on lock-in it rescales to take in the answer and the answer's marker drops in. A missed spread turns from a filled band to an outline (no colour signal). Inside the spread scores `100 − 25 × log₁₀(high ÷ low)`, never below 5 (10× wide → 75, 100× → 50); a miss scores 0. Year-stamped answers (populations, GDP, store counts) should be refreshed before each recruiting season.

**Result:** the score in the display size, the best score saved in this browser (`localStorage`, never required), one calm sentence tying the game to the interview, then "See how interviews work →" (`/apply#process`, `light`), `ApplyButton` (`light-outline`) and "Play again". This is the section's only link to the interview process.

*Revised 2026-10-03:* section moved from white to graphite; card, tabs and controls rounded; the "In the interview" aside removed; the sprint switched from a 60-second ramp to 120-second Zetamac rules; Guess the probability replaced by Fermi markets.

**Fixed height, one screen:** the section uses compact padding and, from 1024px, sets the header in columns 1–4 beside the card (columns 5–12), so the whole band fits a 1280×720 or 1024×768 screen. The card holds one height in every state and on both tabs: the tallest state, a revealed Fermi answer, plus headroom (game panel 37rem below 768px, 33rem to 1279px, 31rem from 1280px). Start screens centre their content, the sprint centres the problem, and results centre as one group with their buttons directly under the note. Phones scroll within the section.

**Motion and access:** panels and new prompts fade up 8px over 400ms; the tab underline and answer marker ease out; none of it runs under reduced motion. Tabs follow the WAI-ARIA pattern (arrows, Home, End); focus moves to the input on start and to the result at the end; a polite live region announces ten seconds left. No colour signals right or wrong (00 §7).

---

## 4. Copy guidelines (Membership-specific)

- Be concrete about time and frequency. "Weekly, Thursdays 7–8:30 PM" beats "regular meetings".
- Track descriptions describe **what members do**, not what they'll become. Avoid promising placements.
- Keep jargon explained: the first use of "market making" on this page gets a short gloss ("quoting prices to both buy and sell").
- The attendance rule must be stated factually and without a threatening tone.

---

## 5. Data

### `content/membership.ts` (new)

```ts
type TrackId = "trading" | "research" | "development";

export const membership = {
  header: { h1: string; lead: string },
  steps: Array<{ title: string; body: string }>,          // exactly 3
  switchingPolicy?: string,
  tracks: Array<{
    id: TrackId;
    roleLabel: string;               // "QUANTITATIVE TRADING"
    name: string;                    // "Trading"
    description: string;
    recommendedBackground: string[]; // 2–4 items
    leadSlug?: string;               // matches a slug in content/team.ts (spec 04)
  }>,                                // exactly 3, in Trading, Research, Development order
  activities: Array<{
    name: string;
    description: string;
    frequency: string;               // free text: "Weekly", "Each semester"
    tracks: "all" | TrackId[];
  }>,
  expectations: {
    timeCommitment: { value: string; detail: string };
    attendance:     { value: string; detail: string };
    prerequisites:  { value: string; detail: string };
  },
};
```

- `leadSlug` resolves against `content/team.ts`. An unknown slug fails the build, so links never 404 silently. The lead's name is read from team data, not duplicated here.
- `tracks: "all"` renders "All tracks". Otherwise track names are joined with " · ".

---

## 6. Content the club must supply

- [ ] Final H1 and lead (or approve the working copy).
- [ ] The track-switching policy, if any.
- [ ] For each track: a 2–3 sentence description, 2–4 recommended-background items, and an optional track lead.
- [ ] For each activity: a description, its real frequency (day and time if fixed), and which tracks it applies to.
- [ ] Time commitment in hours per week.
- [ ] The attendance rule, and what happens if a member falls below it.
- [ ] Confirmation that there are no hard prerequisites.

---

## 7. SEO and metadata

- `title`: "Membership" → "Membership · Traders at Carolina".
- `description`: the page lead.
- One `<h1>`. Sections use `<h2>`; step titles, track names, activity names and expectation terms use `<h3>` (or `<dt>` for expectations, styled as H3).
- Track anchors (`#trading`, `#research`, `#development`) are stable and documented, since spec 01 and spec 04 may link to them.

---

## 8. Acceptance criteria

1. Sections render in §2 order with the listed backgrounds. There is no navy band on the page; the footer's CTA zone supplies it (spec 07).
2. Exactly three tracks render in Trading → Research → Development order, each reachable at `/membership#{id}` with the heading visible below the sticky header (use `scroll-margin-top`).
3. The words "required" or "requirements" never appear in the track blocks. The "None of these are required to join." caption is present.
4. A `leadSlug` that doesn't exist in `content/team.ts` fails `next build` with a clear error.
5. The activities list renders as aligned columns at ≥ 1024px and as stacked blocks below that, from the same DOM. Column headers are announced by screen readers.
6. Removing `switchingPolicy` removes the caption line with no leftover spacing.
7. Lighthouse (mobile) ≥ 95 in all categories. Keyboard order matches visual order, with a visible focus ring.
8. No hard-coded hex values or font stacks. Only spec-00 tokens.
