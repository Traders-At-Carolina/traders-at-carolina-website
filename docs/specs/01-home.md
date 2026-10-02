# Spec 01 — Home

**Status:** Approved · **Date:** 2026-09-30 · **Route:** `/` · **Depends on:** [Spec 00](00-vision-and-style.md)

All tokens, type roles, motifs and components named here are defined in spec 00. Section references like (00 §7.2) point there.

---

## 1. Goal

Within about 10 seconds, a first-time visitor should know:
1. **What** Traders at Carolina is: UNC's quantitative finance club.
2. **Who** it's for: students aiming at quant trading, quant research or SWE at trading firms, including beginners.
3. **How to join**: Apply, from the first screen.

A recruiter or firm visitor should also leave with a sense of an active, serious club: real numbers and real photos.

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| What is this club? | Hero |
| What would I actually do here? | What we do |
| Is it real and established? | By the numbers, Inside the club |
| What's next? How do I join? | Hero CTA, Upcoming card, Apply band |

---

## 2. Page structure

| # | Section | Background | Motif used (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| 01 | Hero | bone + grid | Random walk + grid (one composition) |
| 02 | What we do | bone | — |
| 03 | By the numbers | white | Stat row |
| 04 | Inside the club | bone | — (photos) |
| — | Apply band (`CTABand`) | navy | — |
| — | `SiteFooter` | black | — |

Only these sections appear on Home. No placement section (data isn't available yet; see §7) and no partner-firm names list.

---

## 3. Sections

### 3.1 Hero (§ 01)

**Content**
- **Eyebrow:** `hero.eyebrow`, shown as `§ 01 — UNC'S PREMIER QUANTITATIVE FINANCE CLUB` and set slightly larger than the standard eyebrow (13–14px).
- **Headline:** the club name, "Traders *at* Carolina", in the **Hero** role (00 §5.2). This is an exception to the Display role and is used only here. It's the largest text on the page, and the italic "at" mirrors the wordmark.
- **Subhead:** Lead role, max about 25 words. Working copy: "Rigor, practiced together. We teach the probability, markets and interview craft behind trading and research careers — no finance background required."
- **Primary action:** the Apply `Button` (`primary`), with behavior per §5.
- **Secondary action:** `TextLink` "How membership works →" to `/membership`.
- **Art — "Fig. 1":** `HeroFigure`, a captioned figure of five random walks over the graph-paper grid, presented like a figure in a paper:
  - Five paths from one origin at the left edge, mid-height (00 §7.2 strokes), 96 steps, seed `2026` on first render.
  - A dashed navy mean line (E[X] = 0) and a navy-tinted ±σ√t band.
  - L-shaped hairline axes (`rule-strong`) with a `0` tick at the origin.
  - A `<figcaption>`: `hero.figureCaption` (working copy: "Fig. 1 — Five random walks from one origin. Same rules, different outcomes."), a small legend, the current seed, and a `secondary`-style `<button>` "Draw new paths".

**Layout**
- **Desktop (≥ 1024px):**
  - Two columns, vertically centered. The text block (eyebrow, headline, subhead, actions) sits on the **left** in columns 1–6, and the figure sits on the right in columns 7–12.
  - The plot is `clamp(300px, 46vh, 460px)` tall. Its caption row stacks when the figure is narrower than 42rem and splits into caption/legend left and seed/button right above that (container query).
  - The hero is `clamp(600px, 100svh − header, 820px)` tall, with the grid masked to fade at the edges. The whole hero, figure included, should fit in the first viewport at 1024 × 768.
- **Tablet (768–1023px):** single column. The text comes first, then the figure at 280px.
- **Mobile (< 768px):**
  - Single column: eyebrow, headline, subhead, then the actions stacked (Apply full width, link below).
  - The figure is full width at 200px, followed by the caption, legend, and the seed beside a full-width button.
  - No min-height. Content defines the height.

**Behavior**
- The paths draw in over 1.2s on load; the band fades in after them (00 §9.2). Under reduced motion everything renders complete.
- **Draw new paths** picks a random seed on click only (so server and client first renders match), replays the draw-in, and updates the seed text, which is the figure's only `aria-live="polite"` region.
- **Crosshair (fine pointers only):** a navy hairline follows the pointer to the nearest step, with a marker on each path and a readout of `t`, path 1, the mean, and the band half-width, all in σ units (Public Sans, tabular). It hides on pointer leave. Touch gets the button only.
- The SVG, crosshair and readout are `aria-hidden`; the caption and legend are real text.
- The headline is the page's only `<h1>`.
- The hero is the LCP element (text). The figure is inline SVG with no image request, and `Hero` stays a server component — only `HeroFigure` is a client island.

### 3.2 What we do (§ 02)

**Content**
- `SectionHeader`: eyebrow `§ 02 — WHAT WE DO`, H2 (working copy: "Three ways we build quants."), no lead.
- Three pillars, each with:
  - H3 title
  - body copy of 1–2 sentences, max about 40 words
  - a `TextLink`

| Pillar | Focus (copy to be finalized) | Link |
|---|---|---|
| Preparation | Education sessions, probability and mental math drills, interview prep | "See the curriculum →" `/membership` |
| Engagement | Mock trading, competitions, a community of peers | "How membership works →" `/membership` |
| Opportunity | Firm events, sponsor connections, recruiting support | "About the club →" `/about` |

**Layout**
- **Desktop:** three equal columns separated by vertical hairlines (`rule`). No cards and no boxes. Each pillar is prefixed by a small numeral (`01`, `02`, `03`) in caption role, navy, tabular.
- **Mobile:** stacked, separated by horizontal hairlines.

### 3.3 By the numbers (§ 03)

**Content**
- `SectionHeader`: eyebrow `§ 03 — BY THE NUMBERS`, H2 (working copy: "An established community at Carolina."), no lead.
- A `StatRow` with exactly these stats, each from `content/home.ts`:

| Stat | Example display | Label |
|---|---|---|
| Members | `120+` | Active members |
| Founded | `2019` | Founded |
| Partners | `8` | Partner firms |

**Rules**
- Stats must be real, defensible numbers. If a value is missing, that stat is omitted and the row reflows to two. Never use placeholder or rounded-up numbers.
- The "Founded" stat displays the year (Public Sans, lining figures), not "years active". That way it never goes stale.
- No partner names in this section.

**Layout**
- White background section.
- **Desktop:** three stats in one row, divided by vertical hairlines, left-aligned under the header.
- **Mobile:** stacked with horizontal hairlines.

### 3.4 Inside the club (§ 04)

**Content**
- `SectionHeader`: eyebrow `§ 04 — INSIDE THE CLUB`, H2 (working copy: "Thursday nights, and everything in between."), no lead.
- **Photos:** 2–3 event photos from `content/home.ts`, each with a caption (caption role, `ink-3`, for example "Mock trading night, Spring 2026") and alt text. Treatment per 00 §8.2.
- **Upcoming card (optional):** a `Card` with:
  - a label (eyebrow style, without the § number): `UPCOMING`
  - title (H3)
  - date (Public Sans, tabular; format `Thu, Oct 16 · 7:00 PM`)
  - location (caption)
  - an optional `TextLink` (for example an RSVP or the Instagram post)

**Layout**
- **Desktop with the Upcoming card:**
  - A 3:2 photo spans columns 1–6.
  - A 4:5 photo spans columns 7–9.
  - The Upcoming card spans columns 10–12, top-aligned.
- **Desktop without the Upcoming card:**
  - The 3:2 photo spans columns 1–7.
  - The 4:5 photo spans columns 8–12.
  - A third photo, if provided, comes first in a 3-up row of 3:2 images.
- **Mobile:**
  - The first photo is full width.
  - The Upcoming card (if present) comes next.
  - The remaining photos follow.

**States**
- The Upcoming card renders only when `upcoming` exists *and* its date is today or later at build time. A stale event never shows.
- Because pages are static, a past event disappears only after the next deploy. This is acceptable. Officers redeploy when they update content.

### 3.5 Apply band

- `CTABand` (00 §10).
- H2 working copy: "Ready to start?" (open) / "Applications are closed for now." (closed).
- Optional lead: one sentence in bone.
- Button behavior per §5.
- This is the page's single navy band.

---

## 4. Copy guidelines (Home-specific)

- All working copy above is placeholder text written in the house voice (00 §2). The club finalizes it before implementation is signed off, but it may ship as-is if approved.
- Name the three career paths (trading, research, engineering) at least once above the fold.
- Say clearly that beginners are welcome. This is the main barrier for first- and second-years.
- No superlatives ("premier", "best", "elite") unless a specific fact backs them up.

---

## 5. Apply behavior on this page

The hero button and the band button both use `getApplicationState()` (spec 05 §3), which combines `applicationsOpen` with `applyDeadline` at build time:

| State | Hero button | Band H2 | Band button |
|---|---|---|---|
| `open` | "Apply ↗", opens `applyUrl` in a new tab | "Ready to start?" | "Apply ↗", opens `applyUrl` |
| `closed` | "Applications open {Mon D}", links to `/apply` (`primary` style kept) | "Applications are closed for now." | "Get notified", links to `/apply` |

- `{Mon D}` comes from `nextApplicationOpenDate` (ISO date).
- If the state is closed *and* `nextApplicationOpenDate` is missing, the button reads "How to apply →" and links to `/apply`.
- What `/apply` shows in the closed state is defined in spec 05.

---

## 6. Data

### `content/site.ts` (fields this page adds or uses)

```ts
applyUrl: string;                    // Google Form URL
applicationsOpen: boolean;
nextApplicationOpenDate?: string;    // ISO "YYYY-MM-DD"; shown when closed
```

(The full recruiting field set, including `applyDeadline`, is defined in spec 05 §5.)

### `content/home.ts` (new)

```ts
export const home = {
  hero: { eyebrow: string; headline: string; headlineEmphasis?: string; subhead: string; figureCaption: string },
  pillars: [ { title, body, link: { label, href } } ×3 ],
  stats: {
    members?: number;          // rendered as "{n}+"
    foundedYear?: number;      // e.g. 2019
    partnerFirms?: number;     // defaults to about.partners.length (spec 02 §5)
  },
  photos: Array<{ src: string; alt: string; caption: string; ratio: "3:2" | "4:5" }>, // 2–3 items
  upcoming?: {
    title: string;
    date: string;              // ISO "YYYY-MM-DDTHH:mm" in America/New_York
    location: string;
    link?: { label: string; href: string };
  };
};
```

- `alt` is a required, non-empty string (00 §8.4).
- `headlineEmphasis` must be a substring of `headline`. It renders in italic.

---

## 7. Content the club must supply

- [ ] Final hero headline and subhead (or approve the working copy).
- [ ] Pillar copy for Preparation, Engagement and Opportunity: 1–2 sentences each, describing real activities.
- [ ] Active member count.
- [ ] Founding year.
- [ ] Number of partner firms.
- [ ] 2–3 event photos (landscape 3:2 and/or portrait 4:5, at least 2000px on the long edge), each with a caption.
- [ ] Optional: the next event (title, date and time, location, link).
- [ ] Recruiting status: open or closed, the Google Form URL, and the next open date if closed.

**Deferred:** a placements section on Home. Revisit once placement data exists (spec 04).

---

## 8. SEO and metadata

- `title`: "Traders at Carolina · Quantitative Finance at UNC". Home overrides the title template.
- `description`: the hero subhead.
- Open Graph image: the shared image (00 §12).
- One `<h1>` (the hero headline). Section headings are `<h2>`, pillar titles are `<h3>`.

---

## 9. Acceptance criteria

1. At 375px, 768px, 1280px and 1440px widths, the eyebrow, headline, subhead and Apply button are all visible without scrolling on the first screen.
2. The page renders sections in exactly the order in §2, with backgrounds as listed. There's exactly one navy band.
3. Toggling `applicationsOpen` (or setting `applyDeadline` in the past) in `content/site.ts` switches both the hero and band buttons per §5, with no other code changes.
4. Removing any stat from `content/home.ts` drops it from the row with no gap or leftover hairline.
5. Removing `upcoming`, or setting it to a past date, renders the photo-only layout in §3.4 with no empty card.
6. The random walk is identical across reloads and builds (fixed seed), has `aria-hidden="true"`, and renders fully drawn under `prefers-reduced-motion`.
7. All images have non-empty alt text. TypeScript fails the build if `alt` is missing.
8. Lighthouse (mobile) ≥ 95 in Performance, Accessibility, Best Practices and SEO. LCP < 2.0s and CLS < 0.05.
9. Keyboard-only: every link and button is reachable in visual order with a visible focus ring (00 §4.3).
10. No hard-coded hex values or font stacks in Home components. Only spec-00 tokens.
