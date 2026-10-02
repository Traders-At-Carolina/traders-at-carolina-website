# Spec 04 — Team (Leadership & Placements)

**Status:** Approved · **Date:** 2026-10-01 · **Route:** `/team` · **Depends on:** [Spec 00](00-vision-and-style.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

> **Revision (2026-10-01):** `/team` now shows Executive board (heavy black type), Co-Presidents, then Directors (square 1:1 headshots, role set large above the name), in that order. The Track leads section (§4.3) and the "Led by" dual-role line were removed; the Placements section follows the leadership tiers. Headshots are now full colour, smaller and all one size (fixed-width cards: 192px from 640px up, a two-up grid at about 160px on phones; the co-presidents are no larger than the other tiers), headshots have rounded corners, section spacing is tighter, and cards are centered with centered text. Where this note conflicts with §2–§4 below, this note wins. See `components/team/TeamPage.tsx`.

---

## 1. Goal

Put faces and names to the club, and show where its members go.

- **Students** see who runs the club, whom to contact for each track, and that the leaders are peers they can relate to.
- **Firms and recruiters** see a capable, organized leadership team and, once data exists, the firms members have joined.

### Visitor questions this page answers

| Question | Answered by |
|---|---|
| Who runs the club? | Executive board |
| Who leads the track I'm interested in? | Track leads |
| Where do members end up? | Placements (when data exists) |
| How do I join them? | Apply band |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` | bone + grid | Random walk + grid (one composition) |
| 01 | Executive board | bone | — (photos) |
| 02 | Track leads | bone | — (photos) |
| 03 | Placements *(conditional)* | white | — |
| — | Apply band (`CTABand`) | navy | — |
| — | `SiteFooter` | black | — |

---

## 3. Components

### 3.1 `PersonCard` (defined here; referenced in 00 §10)

| Element | Style | Source |
|---|---|---|
| Headshot | 4:5, `object-fit: cover`, `filter: grayscale(1)`, square corners (00 §8.3) | `headshot`, `alt` |
| Role | Eyebrow style (no §), navy | `role`, e.g. `PRESIDENT` |
| Name | H3, Georgia | `name` |
| Meta | Caption, `ink-3`, tabular year | `'{YY} · {major}`, e.g. "'27 · Math and Computer Science" |
| Placement (optional) | Caption, `ink-2` | `placement`, e.g. "Incoming QT intern, Firm X" |
| LinkedIn (optional) | Lucide `linkedin` icon, 20px, in a 44×44 tap target | `linkedin` URL |

**Rules**
- The card has no border or background. It sits directly on the section canvas. The headshot spans the full card width, and the text sits below it with 16px of spacing.
- The whole card is **not** a link. Only the LinkedIn icon is interactive. It opens in a new tab with `rel="noopener noreferrer"` and `aria-label="{Name} on LinkedIn"`.
- **Missing headshot:** render a 4:5 `white` tile with a 1px `rule` border, showing the person's initials centered in Georgia at H1 size in navy. Never show a broken image or a generic silhouette.
- **Long values:** names and majors wrap. They never truncate.
- **Anchor:** the card root has `id="{slug}"` and `scroll-margin-top` set to clear the sticky header.

### 3.2 Grid

| Breakpoint | Columns | Gap |
|---|---|---|
| ≥ 1280px | 4 | 24px column, 48px row |
| 768–1279px | 3 | 24px column, 48px row |
| < 768px | 2 | 16px column, 32px row |

---

## 4. Sections

### 4.1 Page header

- `PageHeader` (00 §10).
- **Eyebrow:** `TEAM`, with no § number.
- **H1:** working copy "The people running the desk."
- **Lead:** max about 30 words. Working copy: "Traders at Carolina is run by students. Meet the executive board and the leads for each track."
- **Art:** `PlacementWall` in place of the usual `RandomWalk`, hidden below 768px.
  - Eyebrow "Where we've worked", then a slow looping strip of firm marks that fades out at both edges.
  - **Firms:** `content/placement-wall.ts`, in display order: Citadel, JPMorgan Chase, AWS, Infragrid. It is separate from people (`person.company`, used for the headshot hover badge) and from `content/placements.ts` (§4.4).
  - Marks render as flat ink silhouettes with the firm name beneath as a caption, because some marks say nothing alone (Infragrid's is a bare square). The image itself is decorative (`alt=""`).
  - **Motion:** the strip drifts left at about 24px/s, driven from JS (`components/team/PlacementWall.tsx`). The list is repeated once and the offset wraps at one list's width, so the loop is seamless in both directions. The repeat is `aria-hidden`. Edges fade with a CSS mask.
  - **Drag:** the strip can be dragged or flicked left or right with a mouse, pen or finger. A flick keeps its momentum and eases out; the drift then resumes. The cursor is `grab` / `grabbing`. Horizontal drags move the strip and vertical drags still scroll the page (`touch-action: pan-y`). The drift pauses while the pointer rests on the strip.
  - **Reduced motion:** no drift, drag, mask or repeat; the firms show as a centered, wrapped static row.
  - **Keyboard and assistive tech:** the strip is not keyboard-operable. Every firm is in the accessible list once, with its name, so nothing depends on dragging.
  - With an empty list, the art column is left out and the header is text only. It never falls back to the `RandomWalk`.
  - Separate from § 03 Placements (§4.4), which stays text-only and threshold-gated.

### 4.2 Executive board (§ 01)

- `SectionHeader`: eyebrow `§ 01 — EXECUTIVE BOARD`, H2 (working copy: "Leadership, {academic year}." for example "Leadership, 2026–27."), no lead.
- `PersonCard`s for every person with `group: "exec"`, ordered by the `order` field (President first by convention).
- The academic year comes from `team.academicYear`, so the heading updates each year.

### 4.3 Track leads (§ 02)

- `SectionHeader`: eyebrow `§ 02 — TRACK LEADS`, H2 (working copy: "Your first point of contact."), and a lead: "Each track has a lead who runs its sessions and projects."
- Track leads are grouped **by track** in the fixed order Trading → Research → Development. Each group has:
  - a group label in eyebrow style with no §, for example `TRADING`, followed by a `TextLink` "About the track →" to `/membership#trading`
  - `PersonCard`s for each person with `group: "track-lead"` and a matching `track` (one or more per track)
- **Layout:**
  - **Desktop:** the three groups sit in three columns divided by vertical hairlines, each group's cards stacked within its column. Each card is one column wide. A track with two leads stacks two cards.
  - **Tablet and mobile:** groups stack, each group's cards following the grid in §3.2, with hairlines between groups.
- **Dual roles:** a person who is on the exec board and also leads a track appears **once**, under the Executive board. In their track group, a compact line replaces the card: "Led by {Name}, {Role} →", linking to `#{slug}`.
- **Empty track:** if a track has no lead, its group shows the caption "Lead to be announced." and the "About the track" link.

### 4.4 Placements (§ 03): conditional

**Visibility:** the section renders only when `content/placements.ts` has **5 or more** firms. Below that, it's omitted entirely, including its eyebrow number, with no leftover space. Adding the fifth firm makes it appear with no code change.

**Content**
- `SectionHeader`: eyebrow `§ 03 — PLACEMENTS`, H2 (working copy: "Where members have gone."), and a lead: "Firms where Traders at Carolina members and alumni have interned or worked full-time."
- **Firm names only** (00 §7.5): Georgia, H3 size, typeset, alphabetical. No people, roles, years or counts.
- No logos.
- Firm names are plain text, not links.

**Layout**
- White background section.
- **Grid:** 3 columns at ≥ 1024px, 2 at 768–1023px, 1 below that.
- `rule` hairlines between rows, 20px vertical padding per row.

### 4.5 Apply band

- `CTABand` with the shared Apply behavior from spec 01 §5.
- H2 working copy (open): "Want to see your name here next year?"
- This is the page's single navy band.

---

## 5. Data

### `content/team.ts` (defined in 00 §12; shape finalized here)

```ts
type TrackId = "trading" | "research" | "development";   // shared with spec 03

export const team = {
  academicYear: string;          // "2026–27"
  people: Array<{
    slug: string;                // unique, kebab-case; used as #anchor and by spec 03 leadSlug
    name: string;
    role: string;                // "President", "Trading Lead"
    group: "exec" | "track-lead";
    track?: TrackId;             // required when group = "track-lead"; optional for exec who also lead a track
    order: number;               // sort order within group
    classYear: number;           // 2027 → rendered "'27"
    major: string;
    headshot?: string;           // "/images/team/{slug}.jpg"
    alt?: string;                // required when headshot is set
    placement?: string;          // free text, e.g. "Incoming QT intern, Firm X"
    company?: { name: string; logo: StaticImageData };  // transparent mark from public/images/companies; feeds the header wall and the headshot hover badge
    linkedin?: string;           // full URL
  }>,
};
```

### `content/placements.ts` (defined in 00 §12; shape finalized here, replacing the earlier firm/role/year sketch)

```ts
export const placements: Array<{ firm: string }> = [];
```

### Build-time validation (fails `next build` with a clear message)
- Duplicate `slug`.
- `group: "track-lead"` without `track`.
- `headshot` set without a non-empty `alt`.
- Spec 03 `leadSlug` not found in `team.people`.
- Duplicate firm names in `placements` (case-insensitive).

### Cross-spec rules
- Spec 03 track-lead links (`/team#{slug}`) resolve to the person's card. If that person is an exec, this is the card under the Executive board.
- An exec with `track` set is treated as that track's lead for both spec 03 and the dual-role line in §4.3.

---

## 6. Content the club must supply

- [ ] Academic year label (e.g. "2026–27").
- [ ] For each exec board member and track lead:
  - name, role, class year, major
  - headshot (at least 1200px tall, roughly head-and-shoulders, any background, since grayscale evens it out)
  - LinkedIn URL (optional)
  - placement line (optional, with their consent)
- [ ] Which exec members, if any, also lead a track.
- [ ] Later: firm names for placements. The section appears at 5 firms.

---

## 7. SEO and metadata

- `title`: "Team" → "Team · Traders at Carolina".
- `description`: the page lead.
- One `<h1>`. Sections use `<h2>`, names use `<h3>`.
- Each person card is an `<article>`. The headshot `alt` describes the photo ("Portrait of {Name}"), and the name is not repeated as the only alt content when it adds nothing.
- The placements grid is a `<ul>`.

---

## 8. Acceptance criteria

1. Sections render in §2 order. With fewer than 5 placements, the section is absent and numbering ends at § 02. With 5 or more, it appears as § 03 on white.
2. Headshots render in grayscale at 4:5 with no layout shift (dimensions reserved). A missing headshot renders the initials tile.
3. `/team#{slug}` scrolls the matching card into view below the sticky header, for both exec and track-lead cards.
4. An exec who also leads a track appears exactly once on the page, and their track group shows the "Led by" line linking to them.
5. A track with no lead shows "Lead to be announced." with no empty grid cell.
6. Each validation case in §5 fails the build with a message naming the offending entry.
7. LinkedIn links have descriptive `aria-label`s, 44×44 tap targets, and open in a new tab.
8. Lighthouse (mobile) ≥ 95 in all categories, with images served via `next/image` as AVIF/WebP.
9. No hard-coded hex values or font stacks. Only spec-00 tokens.
10. The header strip lists each firm in `content/placement-wall.ts` once to assistive tech, with its name, and shows no `RandomWalk`. It loops seamlessly, can be dragged, and is static under `prefers-reduced-motion`. With an empty list, the art column is absent.
