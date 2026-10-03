# Spec 04 — Team (Leadership & Placements)

**Status:** Approved · **Date:** 2026-10-01 · **Route:** `/team` · **Depends on:** [Spec 00](00-vision-and-style.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there.

> **Revision (2026-10-01):** `/team` now shows Executive board (heavy black type), Co-Presidents, then Directors (square 1:1 headshots, role set large above the name), in that order. The Track leads section (§4.3) and the "Led by" dual-role line were removed; the Placements section follows the leadership tiers. Headshots are now full colour, smaller and all one size (fixed-width cards: 192px from 640px up, a two-up grid at about 160px on phones; the co-presidents are no larger than the other tiers), headshots have rounded corners, section spacing is tighter, and cards are centered with centered text. Where this note conflicts with §2–§4 below, this note wins. See `components/team/TeamPage.tsx`.

> **Revision (2026-10-02):** A firm field (§4.6) now follows the leadership tiers: the firms from `content/placement-wall.ts`, floating loose in a bounded field that can be dragged and flicked. It takes the next § number (§ 04 with all three tiers), so § Placements moves to § 05. The header strip (§4.1) stays, so the same firms appear twice on the page on purpose. The §2 table below is updated to the current page.

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
| Where have members worked? | Header strip and firm field |
| Where do members end up? | Placements (when data exists) |
| How do I join them? | Footer CTA zone |

---

## 2. Page structure

| # | Section | Background | Motif (00 §3) |
|---|---|---|---|
| — | `SiteHeader` | bone | — |
| — | `PageHeader` | bone + grid | Placement strip + grid (one composition, §4.1) |
| 01 | Executive board | bone | — (photos) |
| 02 | Co-Presidents | bone | — (photos) |
| 03 | Directors | bone | — (photos) |
| 04 | Firm field *(when `placement-wall.ts` is non-empty)* | bone | Firm field (§4.6) |
| 05 | Placements *(at 5+ firms)* | graphite | — |
| — | Team note *(when `team.note` is set)* | bone | — |
| — | `SiteFooter` | black | — |

Tiers with nobody in them are omitted and the § numbers after them close up, so the firm field and Placements always take the next numbers in order.

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
  - The footer's placement strip (spec 07 §3.3) is hidden on `/team`, because this header already shows the same firms.
  - The strip stays when the firm field (§4.6) is shown lower on the page. Both read `content/placement-wall.ts`, and the repeat is deliberate: the strip is header art, the field is a section to play with.

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

**Visibility:** the section renders only when `content/placements.ts` has **5 or more** firms. Below that, it's omitted entirely, including its eyebrow number, with no leftover space. Adding the fifth firm makes it appear with no code change. It follows the firm field (§4.6) and takes the number after it (§ 05 with all three tiers and the field), or the number after the last tier when the field is absent.

**Content**
- `SectionHeader`: eyebrow `§ 03 — PLACEMENTS`, H2 (working copy: "Where members have gone."), and a lead: "Firms where Traders at Carolina members and alumni have interned or worked full-time."
- **Firm names only** (00 §7.5): Georgia, H3 size, typeset, alphabetical. No people, roles, years or counts.
- No logos.
- Firm names are plain text, not links.

**Layout**
- White background section.
- **Grid:** 3 columns at ≥ 1024px, 2 at 768–1023px, 1 below that.
- `rule` hairlines between rows, 20px vertical padding per row.

### 4.5 Apply band (removed 2026-10-02)

The closing Apply call to action now lives in the footer on every page (spec 07). Team no longer renders `CTABand`.

### 4.6 Firm field (§ 04), added 2026-10-02

The firms from the header strip, floating loose in a field below the leadership tiers. The header strip (§4.1) stays as it is; lower on the page there is room to play with the same firms. Numbered §4.6 so existing references to §4.4 and §4.5 stay valid; on the page it comes before § Placements.

**Visibility and order**
- Renders when `content/placement-wall.ts` is non-empty. With an empty list the section is omitted entirely, including its eyebrow number.
- Sits directly after the last leadership tier and takes the next § number (§ 04 with all three tiers). § Placements (§4.4) follows it, and the team note stays last.

**Content**
- Heading: the same centered heading as the leadership tiers (`TierHeader` in `components/team/LeadershipTier.tsx`): eyebrow `§ 04 — Where we've worked` in sentence case, H2 in heavy Chivo, "Where our members have worked", without a period, like the tier titles. No lead.
- **Firms:** `content/placement-wall.ts`, the same list as the header strip and the footer strip (spec 07 §3.3). Adding an entry there updates all three.

**Layout and look**
- Bone section, not graphite, so it doesn't run into the graphite § Placements band below it.
- The field spans the container width: 420px tall from 768px up, 320px below, with `rule` hairlines top and bottom. No graph-paper grid (00 §7.3).
- Each firm is a bare mark with its name as a caption beneath: the mark in the firm's own colours at about 32px tall (the one exception to 00 §7.5's monochrome marks), the caption in `ink-2`. No circle, tile or border. Collisions use an invisible circle sized to the cell.
- Marks must be the full-colour versions made for light backgrounds, since they sit on bone. AWS uses `aws-on-light.png` (dark text); the white-text `aws.png` stays for the dark headshot badge.
- **Growth:** the field keeps its base height until the cells' circles would cover more than 30% of its area, then grows taller to stay at 30%.
- Unlike the header strip, the field also shows below 768px.

**Motion**
- **First paint:** start positions come from a fixed seed (`lib/float-field.ts`) and are rendered on the server as percentages of the field, so there is no hydration mismatch and no jump when the script takes over. Seeded positions don't overlap in a 1200px-wide field at its height for that many firms (see Growth); at other widths the first frame pushes any overlaps apart.
- **Drift:** each firm has a seeded heading and a cruise speed of 10–18px/s, slower than the header strip. No rotation.
- **Collisions:** firms bounce softly off each other (equal mass, restitution 0.9, overlap resolved in the same frame) and off the field's edges. After a bump or a flick, each firm's speed eases back to its cruise speed, so the field never stalls or speeds up over time.
- **Drag and flick:** a firm can be grabbed with a mouse, pen or finger. It follows the pointer and pushes the others aside while held. On release it keeps the smoothed pointer velocity, capped at 1500px/s, which decays back to cruise. The cursor is `grab` / `grabbing` on the firms only.
- **Touch:** a drag that starts on a firm moves the firm (`touch-action: none` on the cells). A drag that starts on empty field scrolls the page (`touch-action: pan-y` on the field).
- **Hover:** the hovered firm holds still while the others keep drifting.
- **When it runs:** only while the field is on screen (IntersectionObserver). The frame step is clamped to 0.1s, so returning to a background tab doesn't make firms jump. A ResizeObserver keeps every firm inside the field when it resizes.
- **Pause (WCAG 2.2.2):** a caption-size text button just below the field's bottom hairline, right-aligned, with a 44px tap target. Its label names the action, "Pause motion" or "Play motion"; it has no `aria-pressed`, because the label already carries the state. While paused, the firms stop where they are and can't be dragged.
- Built with `requestAnimationFrame` and pointer events, following `PlacementWall`'s pattern. No animation or physics library (00 §9.2).

**Reduced motion**
- No drift, collisions, drag or pause button. The firms render as a centered, wrapped static row (the header strip's fallback), and the field drops its fixed height to fit the row.

**Accessibility**
- The field is a `<ul>` with one `<li>` per firm, inside the section labelled by its H2. Each firm appears once; the caption carries the name and the mark is decorative (`alt=""`).
- Dragging is decorative and not keyboard-operable; nothing depends on it. The pause button is the field's only focusable element.

**Files**
- `components/team/FirmField.tsx` (client component), `lib/float-field.ts` (seeded layout and a pure `step()` function), styles in `app/globals.css` next to `.logo-strip`.

**Open items**
- [x] **H2 copy.** Settled 2026-10-03: `content/placement-wall.ts` lists firms where club members have worked, not only the leadership, so the H2 is "Where our members have worked".
- [ ] **Follow-up, separate change:** the header strip (§4.1) also moves for more than 5 seconds with no pause control (WCAG 2.2.2).

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
11. With a non-empty `placement-wall.ts`, the firm field (§4.6) renders directly after the last leadership tier as the next § number, before § Placements and the team note. With an empty list it is absent and the numbering stays contiguous.
12. The field lists each firm once to assistive tech, with its name. First paint shows the seeded scatter with no hydration warning.
13. Firms drift, bounce off each other and the edges without overlapping, can be dragged and flicked, and settle back to cruise speed. On touch, a drag that starts on empty field scrolls the page.
14. The pause button stops and restarts all motion, and its label names the action it will take. The loop does not run while the field is off screen.
15. Under `prefers-reduced-motion`, the field is a static wrapped row with no transforms and no pause button.
