# Spec 02 — About & History

**Status:** Approved · **Date:** 2026-09-30 · **Route:** `/about` · **Depends on:** [Spec 00](00-vision-and-style.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

---

## 1. Goal

Give visitors who want more than the Home page a clear sense of **why the club exists, where it came from, how it operates and who backs it.**

- **Students:** can I trust this club with my time? Do its values match mine?
- **Firms and recruiters:** is this a serious, well-run organization worth partnering with?
- **Alumni and faculty:** is the club's story told accurately, and is it continuing?

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| What is the club trying to do, now and long term? | Mission and vision |
| How did it start? | Our story |
| What's it like to be part of it? | Principles |
| Who supports it? | Partners and advisors |
| How do I join? | Apply band |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` | bone + grid | Random walk + grid (one composition) |
| 01 | Mission and vision | bone | — |
| 02 | Our story | bone | — |
| 03 | Principles | bone | — |
| 04 | Partners and advisors | white | — |
| — | Apply band (`CTABand`) | navy | — |
| — | `SiteFooter` | black | — |

---

## 3. Sections

### 3.1 Page header

- `PageHeader` (00 §10).
- **Eyebrow:** `ABOUT`, with no § number. Numbering starts with the first content section.
- **H1:** working copy "Built by students, for the long game."
- **Lead:** one sentence, max about 30 words. Working copy: "Traders at Carolina is a student-run community preparing UNC students for quantitative trading, research and engineering careers."
- **Art:** small `RandomWalk` (`size="header"`, 3 paths, `trend="up"`) on the right on desktop: paths start low on the left and drift upward, like a rising equity curve; the highlighted (navy) path climbs the steepest. Hidden below 768px.

### 3.2 Mission and vision (§ 01)

**Content**
- `SectionHeader`: eyebrow `§ 01 — MISSION AND VISION`, H2 (working copy: "Why we exist."), no lead.
- Two blocks:

| Block | Label (eyebrow style, no §) | Statement (H3, Georgia) | Body |
|---|---|---|---|
| Mission | `MISSION` | One sentence on what the club does today (preparation, engagement, opportunity) | 1–2 sentences, max about 50 words |
| Vision | `VISION` | One sentence on the long-term aim: a genuinely useful resource for students pursuing QT, QR and SWE at trading firms | 1–2 sentences, max about 50 words |

**Layout**
- **Desktop:** two equal columns divided by a vertical hairline.
- **Mobile:** stacked, divided by a horizontal hairline.

### 3.3 Our story (§ 02)

**Content**
- `SectionHeader`: eyebrow `§ 02 — OUR STORY`, H2 (working copy: "How it started."), no lead.
- **Founding story:** 2–4 paragraphs of body prose (max about 350 words total). It covers who founded the club, when, why, and how it has grown since.
- **Pull quote (optional):** one founder or early-member quote, max about 30 words.
  - Georgia italic at H2 size, preceded by a 48px navy hairline.
  - Attribution in caption role: "— Name, role, class year".
- **Milestones list (conditional):** renders only when `content/timeline.ts` has **3 or more** entries.
  - Each row has a year (Public Sans 500, navy, tabular, fixed 6ch column), a title (body, 500 weight), and an optional one-line description (`ink-2`).
  - Rows are separated by `rule` hairlines and sorted by year, oldest first.
  - Fewer than 3 entries means the list is omitted entirely, not shown half-empty.

**Layout**
- **Desktop:**
  - The story prose spans columns 1–7 (max 68ch).
  - The pull quote, if present, sits in columns 9–12, aligned to the top of the second paragraph.
  - The milestones list spans columns 1–7 below the prose, with 48px above it.
- **Mobile:** prose, then the pull quote (full width, with 32px vertical margin), then milestones.

**Note:** the club currently has a founding story only. The milestones list is built now and hidden by its threshold, so adding entries later needs no code change.

### 3.4 Principles (§ 03)

**Content**
- `SectionHeader`: eyebrow `§ 03 — PRINCIPLES`, H2 (working copy: "How we operate."), no lead.
- 3–4 principles, each with a numeral (`01`–`04`, caption role, navy, tabular), an H3 title, and one sentence of body.
- Working examples (the club finalizes these):

| # | Title | Sentence |
|---|---|---|
| 01 | Rigor over résumé lines | We value understanding a problem over listing that we attended a session on it. |
| 02 | Beginners welcome, standards high | No prior finance background is required; real effort is. |
| 03 | Learn in public | Members teach, present and review each other's work. |
| 04 | Give back | Members who place help the next class prepare. |

**Layout**
- **Desktop:** a 2 × 2 grid divided by hairlines (a vertical hairline between the columns and a horizontal one between the rows). With exactly 3 principles, use a single row of three columns instead.
- **Mobile:** stacked, divided by hairlines.
- No cards or boxes.

### 3.5 Partners and advisors (§ 04)

**Content**
- `SectionHeader`: eyebrow `§ 04 — PARTNERS AND ADVISORS`, H2 (working copy: "Who supports us."), and an optional one-sentence lead.
- **Partners:** typeset firm names (00 §7.5).
  - Format: H3 size in Georgia, each with an optional caption beneath (for example "Sponsor since 2024" or "Event partner").
  - Sorted alphabetically.
  - Each name may link to the firm's site (`TextLink` without an arrow, opens in a new tab). Default is no link.
  - No logos.
- **Advisors (optional):** for each faculty or industry advisor, show the name (H3), then title and department (caption), then an optional one-line note (`ink-2`).
  - No headshots here. Headshots belong to Team (spec 04).

**Layout**
- White background section.
- **Desktop:**
  - The partners grid is 3 columns at ≥ 1024px and 2 columns at 768–1023px, with `rule` hairlines between rows.
  - Advisors sit below the partners under a sub-label `ADVISORS` (eyebrow style, no §), in a 2-column row.
- **Mobile:** a single column.

**States**

| Partners | Advisors | Result |
|---|---|---|
| ≥ 1 | ≥ 1 | Full section as above |
| ≥ 1 | 0 | Partners only; advisors sub-block omitted |
| 0 | ≥ 1 | Eyebrow becomes `§ 04 — ADVISORS`, H2 "Our advisors." |
| 0 | 0 | Section omitted; numbering stays sequential (no gap) |

### 3.6 Apply band

- `CTABand` with the shared Apply behavior from spec 01 §5 (open/closed copy and buttons are identical across pages).
- H2 working copy (open): "Want to be part of the next chapter?"
- This is the page's single navy band.

---

## 4. Copy guidelines (About-specific)

- Follow the house voice (00 §2): specific, understated, no superlatives.
- Write the founding story in third person ("Traders at Carolina was founded in…"), not "we". "We" is fine in the mission, vision and principles.
- Name founders only with their consent. Class years are fine.
- Never call a partnership more than it is. Use the club's actual relationship term (sponsor, event partner, host).

---

## 5. Data

### `content/about.ts` (new)

```ts
export const about = {
  header: { h1: string; lead: string },
  mission: { statement: string; body: string },
  vision: { statement: string; body: string },
  story: {
    paragraphs: string[];                 // 2–4 items
    quote?: { text: string; name: string; role: string; classYear?: number };
  },
  principles: Array<{ title: string; body: string }>,   // 3–4 items
  partners: Array<{ name: string; relationship?: string; url?: string }>,
  advisors: Array<{ name: string; title: string; department: string; note?: string }>,
};
```

### `content/timeline.ts` (defined in 00 §12; shape finalized here)

```ts
export const timeline: Array<{
  year: number;            // e.g. 2021
  title: string;           // short, e.g. "First mock trading competition"
  description?: string;    // one line
}> = [];
```

### Cross-page rule
- Home's "Partner firms" stat (spec 01 §3.3) is **derived** from `about.partners.length` when `home.stats.partnerFirms` is not set explicitly. That way the count and the list never disagree.

---

## 6. Content the club must supply

- [ ] Final H1 and lead (or approve the working copy).
- [ ] Mission and vision statements, plus 1–2 supporting sentences each.
- [ ] Founding story: who founded the club, when, why, and how it has grown. 2–4 short paragraphs.
- [ ] Optional: a founder quote, with permission and attribution.
- [ ] Principles: approve, edit or replace the four working examples.
- [ ] Partner firms: name, relationship type and optional URL for each. Confirm each firm is comfortable being listed.
- [ ] Optional: advisors (name, title, department).
- [ ] Optional, later: dated milestones (the list appears automatically at 3+).

---

## 7. SEO and metadata

- `title`: "About" → renders as "About · Traders at Carolina" through the template.
- `description`: the page lead.
- One `<h1>` (from `PageHeader`). Sections use `<h2>`; mission/vision statements, principles, partner names and advisor names use `<h3>`.
- The pull quote uses `<figure>` with `<blockquote>` and a `<figcaption>`.
- The milestones list uses an `<ol>`.

---

## 8. Acceptance criteria

1. The page renders the sections in §2 order with the listed backgrounds. There's exactly one navy band.
2. With fewer than 3 timeline entries, no milestones list or leftover spacing renders. Adding a third entry makes it appear with no code change.
3. Removing `story.quote` reflows the story to prose only, with no empty column on desktop.
4. Each of the four partners/advisors states in §3.5 renders as specified, including the section being omitted when both lists are empty.
5. Section numbering is always sequential (§ 01…§ 04, or §01–§03 when partners and advisors are omitted).
6. Partner names render as text only (no images). External links open in a new tab with `rel="noopener noreferrer"`.
7. Home's partner stat equals `about.partners.length` unless overridden.
8. Lighthouse (mobile) ≥ 95 in all categories. Keyboard order matches visual order, with a visible focus ring.
9. No hard-coded hex values or font stacks. Only spec-00 tokens.
