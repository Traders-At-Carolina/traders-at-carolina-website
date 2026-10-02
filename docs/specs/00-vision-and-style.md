# Spec 00 — Vision & Style

**Status:** Approved · **Date:** 2026-09-30 · **Applies to:** every page and shared component

This is the foundation spec for the Traders at Carolina website. Page specs (01–05) reference it by section number for tokens, typography, layout, motifs and shared components. When a page spec conflicts with this document, the page spec must call out the exception explicitly.

---

## 1. Purpose, audience, success

**What the club is.** Traders at Carolina is a quantitative finance club at UNC Chapel Hill. It focuses on preparation, engagement and opportunity for students pursuing quantitative careers.

**Long-term vision.** To become genuinely useful to students pursuing quantitative trading (QT), quantitative research (QR) and software engineering (SWE) at trading firms.

**Audiences**

| Priority | Who | What they need from the site |
|---|---|---|
| Primary | UNC students, from curious first-years to juniors who are ready to recruit | What the club does, whether it's for them, how to join |
| Secondary | Recruiters and firms | Evidence of rigor: placements, activities, leadership |
| Secondary | Alumni, faculty | History, continuity, ways to stay involved |

**What the site does today.** Explain the club, prove it's serious, and convert visitors to Apply.

**Later (not in scope now).** A resource hub: interview prep, reading lists, events. The information architecture (§11) reserves room for it, but nothing for it is built yet.

**Success criteria**

- A first-time visitor can tell what the club does and how to join within about 10 seconds of landing.
- Apply is reachable in one click from every page.
- Meets WCAG 2.2 AA.
- Lighthouse ≥ 95 in every category, LCP < 2.0s, CLS < 0.05.

---

## 2. Personality and voice

**Positioning:** *the prestige of an institution, the precision of a research desk.*

**Personality:** rigorous, understated, welcoming. Confident without hype.

**Voice rules**

- Write short, declarative sentences.
- Prefer specifics to adjectives: numbers, firm names, concrete activities ("weekly mock trading on Thursdays", not "exciting hands-on experiences").
- Explain jargon once rather than gatekeeping with it. A curious first-year should never feel locked out.
- No exclamation marks, emoji, hype phrases ("crush your interviews", "to the moon") or finance clichés (bulls, rockets, money imagery).
- Headings use sentence case. Eyebrow labels are the only all-caps text (§5).

**Name usage.** Write "Traders at Carolina" in running text. Logo lockups follow the existing logo files. The short form "T@C" is not used until it's confirmed as an established club convention (§14).

---

## 3. Visual direction: prestige editorial × research-desk language

The look combines the **prestige** of a financial journal with the **design language** of a quantitative research desk.

| From the editorial direction (prestige) | From the research-desk direction (language) |
|---|---|
| Bone canvas, serif-led hierarchy | Numbered section eyebrows (`§ 01 — ABOUT`) |
| Generous whitespace, asymmetric editorial columns | Hairline rules between sections and between stats |
| Large, regular-weight Georgia headlines | Tabular stat rows |
| Navy as the color of authority, used sparingly | Random-walk line art as the signature motif |
| Square corners, no shadows | Faint graph-paper grid, in heroes and page headers only |

**Restraint rules**

- At most **one motif per viewport**. The motifs are the random walk, the graph-paper grid and stat rows (§7.2–7.4). In `PageHeader`, the grid and the random walk form a single composition and count as one motif. In the Home hero, the 3D volatility surface (with its own floor grid) and the masked graph-paper grid behind it likewise count as one. Section eyebrows and hairline rules are structural, not motifs, so they appear everywhere.
- Never use stock tickers or marquees, candlestick charts, red/green up/down colors, terminal or monospace typography, or stock photography.

---

## 4. Color system

The four brand colors are the only hues on the site. Every other color is a tint, alpha or mix of those four.

### 4.1 Tokens

| Token | Value | Role |
|---|---|---|
| `bone` | `#ebeae4` | Primary page canvas |
| `white` | `#ffffff` | Raised surfaces (cards) and alternate sections |
| `navy` | `#233265` | Primary buttons, links, stat numbers, motif lines, the emphasis band |
| `black` | `#000000` | Headline and body text, footer background |
| `ink-2` | `#474644` | Secondary text: leads, descriptions (black at 70% over bone, as a solid color) |
| `ink-3` | `#636260` | Captions, metadata, fine print (black at 58% over bone, as a solid color) |
| `rule` | `rgb(0 0 0 / 0.15)` | Hairlines and card borders |
| `rule-strong` | `rgb(0 0 0 / 0.35)` | Emphasized dividers |
| `rule-inverse` | `rgb(235 234 228 / 0.2)` | Hairlines on navy or black |
| `navy-press` | `color-mix(in oklab, #233265 85%, black)` | Hover and pressed state for navy fills |
| `grid` | `rgb(35 50 101 / 0.06)` | Graph-paper texture |

Text colors are always **solid** values (`ink-2` and `ink-3`), never `opacity` or alpha. Alpha drifts depending on the surface underneath.

### 4.2 Contrast (verified)

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| black | bone | 17.42:1 | AAA |
| navy | bone | 10.15:1 | AAA |
| navy | white | 12.24:1 | AAA |
| bone / white | navy | 10.15 / 12.24:1 | AAA |
| bone | black | 17.42:1 | AAA |
| ink-2 | bone / white | 7.82 / 9.43:1 | AAA |
| ink-3 | bone / white | 5.05 / 6.09:1 | AA (captions and metadata only) |

### 4.3 Usage rules

- **Proportion:** about 70% bone or white, 20% black (type), 10% navy.
- **Navy fills:** primary buttons, plus **at most one** full-bleed navy band per page (usually the Apply CTA).
- **Black fills:** the footer, plus the hover state of the `secondary` button. No black sections.
- **Light theme only.** No dark mode. The navy band and black footer supply the dark moments.
- **No Carolina Blue.** It keeps the club's identity distinct and avoids UNC trademark questions.
- **Focus ring:** `2px solid navy`, `outline-offset: 2px`. On navy or black surfaces the ring is `bone`.

---

## 5. Typography

### 5.1 Families

| Use | Stack | Loading |
|---|---|---|
| Display (headlines, pull quotes) | `"Georgia Pro", Georgia, Gelasio, "Times New Roman", serif` | Georgia is a system font. Gelasio via `next/font/google` with `preload: false` |
| Text and UI | `"Public Sans", system-ui, sans-serif` | `next/font/google`, variable, weights 400 / 500 / 600 |

**Why this stack.** The club has no Georgia Pro web license.
- Visitors on macOS, Windows and iOS get system Georgia.
- Visitors who have Georgia Pro installed locally get it automatically.
- Android and Linux visitors get Gelasio, a free typeface that is metric-compatible with Georgia, so layouts don't shift.
- Gelasio sits after Georgia in the stack and isn't preloaded, so devices that have Georgia never download it.

**Numerals.** System Georgia only has old-style (text) figures. Every stat, table, date range and other figure-dense element therefore uses Public Sans with `font-variant-numeric: tabular-nums lining-nums`. Old-style figures inside Georgia prose ("founded in 2019") are fine.

### 5.2 Type scale

| Role | Family / weight | Size | Line height | Notes |
|---|---|---|---|---|
| Hero | Georgia 400 | `clamp(3rem, 7.2vw, 6rem)` | 0.98 | `letter-spacing: -0.02em`; Home hero H1 only (spec 01 §3.1) |
| Display | Georgia 400 | `clamp(2.75rem, 6vw, 5rem)` | 1.05 | `letter-spacing: -0.01em`; reserved for large statements (the Home hero now uses Hero) |
| H1 | Georgia 400 | `clamp(2.25rem, 4.5vw, 3.75rem)` | 1.1 | Page titles |
| H2 | Georgia 400 | `clamp(1.75rem, 3vw, 2.5rem)` | 1.15 | Section headings |
| H3 | Georgia 400 | `1.375rem` | 1.25 | Card and sub-section headings |
| Eyebrow | Public Sans 500 | `0.75rem` | 1.4 | Uppercase, `letter-spacing: 0.14em`, navy |
| Lead | Public Sans 400 | `1.25rem` | 1.6 | `ink-2` |
| Body | Public Sans 400 | `1.0625rem` | 1.65 | `max-width: 68ch` |
| Caption | Public Sans 400 | `0.875rem` | 1.5 | `ink-3` |
| Stat | Public Sans 500 | `clamp(2rem, 4vw, 3rem)` | 1 | Navy, tabular lining figures |
| Nav | Public Sans 500 | `0.9375rem` | 1 | |
| Button | Public Sans 600 | `0.9375rem` | 1 | `letter-spacing: 0.01em` |

**Rules**

- Headlines always use regular weight (400). Size carries the prestige.
- Emphasis inside a headline uses Georgia *italic*, never bold ("Rigor, *practiced* together.").
- Headings use `text-wrap: balance` and paragraphs use `text-wrap: pretty`.
- Georgia is used only for the Display–H3 roles and pull quotes. Everything else — body, leads, captions, nav, buttons, eyebrows, stats — sets in Public Sans.

---

## 6. Layout and spacing

- **Container:** max content width `1200px`. Side padding is `20px` on mobile, `32px` from 768px up, and `48px` from 1024px up. Full-bleed media may extend to `1440px`.
- **Grid:** 12 columns with `24px` gutters (`16px` below 768px). Text blocks typically span 7 columns, leaving the rest as editorial whitespace or an aside, which creates deliberate asymmetry.
- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Use only these values.
- **Section padding:** 96–128px vertical on desktop, 64px on mobile.
- **Section anatomy:** hairline `rule` at the top, then eyebrow, then H2, then optional lead, then content.
- **Background rhythm:** bone by default, with occasional white sections for contrast. At most one navy band per page. The footer is always black.
- **Corners and depth:** `border-radius: 0` everywhere, no box shadows. Elevation is a `white` surface plus a 1px `rule` border.
- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Mobile-first.

---

## 7. Signature motifs

These carry the research-desk language. Use them sparingly, at most one per viewport (§3).

### 7.1 Section numbering
Every major section opens with an eyebrow in the form `§ 01 — LABEL`. Numbering restarts at `01` on each page and follows document order.

### 7.2 Random-walk paths (`RandomWalk`)
- **Shape:** 3–5 Brownian-motion paths drawn as SVG polylines from a shared starting point.
- **Strokes:**
  - One path is solid `navy` at 1.5px.
  - The others are navy at 30% opacity and black at 25% opacity, each at 1px.
- **Deterministic:** generated from a fixed seed at build time, with no runtime randomness, so there are no hydration mismatches and the art stays the same between visits.
- **Placement:** in each `PageHeader`. (The Home hero uses a 3D volatility surface instead; spec 01 §3.1.)
- **Motion:** an optional 1.2s stroke draw-in on load (`stroke-dashoffset`), disabled under `prefers-reduced-motion`.
- **Accessibility:** decorative, so it carries `aria-hidden="true"`.

### 7.3 Graph-paper grid
- 28px cells drawn in the `grid` color with `mask-image`, fading out toward the edges.
- Used only behind the Home hero and inside `PageHeader`.

### 7.4 Stat rows
- Large `Stat`-role numbers in navy with caption-sized labels underneath.
- Separated by vertical hairlines on desktop and horizontal hairlines when stacked on mobile.

### 7.5 Firm names
- Placement firms are set in type by default.
- If firm logos are used, they are monochrome (black at 60%) and uniform in height, never in full color.

---

## 8. Imagery

### 8.1 Logo
- The club's existing logo is the source of truth. SVG is preferred.
- Required variants: full-color (if it has color), one-color black (for bone and white), and one-color bone (for navy and black).
- Location: `public/brand/`.
- Clear space: at least the cap height of the wordmark on every side.
- Don't recolor, stretch or add effects to the logo.

### 8.2 Event photos
- Natural color with a consistent treatment: slight desaturation, about 10–15%, applied consistently. No Instagram-style filters.
- Aspect ratios: 3:2 (landscape) or 4:5 (portrait). Square corners.
- Captions are editorial in style: caption role, `ink-3`. Example: "Speaker series, Fall 2025".

### 8.3 Headshots
- Uniform 4:5 crop, head and shoulders, eyes at roughly the upper third.
- Displayed in grayscale with a CSS `filter: grayscale(1)`. The source files stay in color.
- Grayscale evens out mismatched lighting and backgrounds across the board and matches the convention at prestige firms.

### 8.4 Delivery
- Always `next/image`, served as AVIF or WebP with blur placeholders.
- Every image requires alt text. This is enforced by the content types (§12).

---

## 9. Icons and motion

### 9.1 Icons
- Lucide at 1.5px stroke, for functional uses only: menu, close, external link, LinkedIn, Instagram, arrows.
- Inside text links, prefer the typographic arrows `→` (internal) and `↗` (external) over icons.

### 9.2 Motion
Use CSS plus a small IntersectionObserver hook. No animation library.

| Effect | Spec |
|---|---|
| Section reveal | Fade in and translate up 8px over 400ms, `ease-out`, once per element |
| Header random walk | Stroke draw-in over 1.2s on load |
| Hero 3D surface — auto-rotate | Slow idle spin (0.6 OrbitControls units); stops on interaction, resumes after 4s |
| Hero 3D surface — Play market | Surface updates every 80ms from mean-reverting parameter ticks; only while visible |
| Link underline | Underline scales in from the left on hover, 200ms |
| Button hover | Background color transition, 150ms |

- No parallax, marquees, scroll-jacking or auto-advancing carousels.
- Under `prefers-reduced-motion: reduce`, every effect above is disabled and content renders in its final state.

---

## 10. Shared components

Page specs reference these by name. Each one is built once and reused.

### `SiteHeader`
- Logo on the left (links to `/`). Nav on the right: **About · Membership · Team**, then an **Apply** `Button` (`primary`).
- Sticky, on a `bone` background. A bottom hairline `rule` appears once the page has scrolled.
- The active page's nav link gets a 1px underline at a 4px offset.
- **Mobile (< 768px):** logo and a menu button. The menu opens a full-screen `bone` overlay with large Georgia (H2-size) links and a full-width Apply button. Focus is trapped while it's open, and `Esc` closes it.

### `SiteFooter`
- Background `black`, text `bone`, hairlines `rule-inverse`.
- **Contents:**
  - one-color bone logo
  - one-line mission statement
  - nav links (mirroring the header)
  - contact email
  - Instagram and LinkedIn
  - Apply link
  - `© {year} Traders at Carolina`
  - a UNC student-organization disclaimer, if UNC requires one (§14)

### `Button`
All variants are square, use the Button type role, and have 12px × 24px padding with a minimum height of 44px.

| Variant | Rest | Hover / press |
|---|---|---|
| `primary` | `navy` fill, `white` text | `navy-press` fill |
| `secondary` | 1px `black` border, `black` text, transparent fill | `black` fill, `bone` text |
| `inverse` (on navy) | `bone` fill, `navy` text | `white` fill |

### `TextLink`
- `navy` text with a 1px underline at a 4px offset. An optional trailing `→` or `↗`.
- On hover, the underline animates as described in §9.2.

### `SectionHeader`
- Top hairline `rule`, then an eyebrow (`§ NN — LABEL`), an H2, and an optional lead.
- Left-aligned within the 7-column text span.

### `PageHeader`
- Used at the top of every page except Home.
- Eyebrow, H1 and lead, over the graph-paper grid, with a small `RandomWalk` on the right on desktop. The `RandomWalk` is hidden below 768px.

### `Stat` / `StatRow`
- `Stat`: a number (Stat role) plus a caption label.
- `StatRow`: 3–4 `Stat`s divided by hairlines, per §7.4.

### `Card`
- `white` surface, 1px `rule` border, 24–32px padding, no radius, no shadow.

### `PersonCard`
- A headshot plus name and role. The full definition is in spec 04.

### `CTABand`
- A full-bleed `navy` section: an H2 in `white`, an optional lead in `bone`, and an `inverse` Apply `Button`.
- Counts as that page's one navy band (§4.3).

### `RandomWalk`
- The seeded SVG motif described in §7.2. Props: `seed`, `paths` (3–5), `size` (`hero` | `header`).

### Apply link behavior (all Apply buttons and links)
- **Single source of truth.** Recruiting fields (`applyUrl`, `applicationsOpen`, `applyDeadline` as an ISO date-time in America/New_York, `nextApplicationOpenDate`, `interestFormUrl`, cycle dates) live in `content/site.ts`; their full definition is spec 05 §5. Every Apply button derives its state from `getApplicationState()` (spec 05 §3). Each recruiting cycle needs only that one file edited.
- **External link.** It opens the Google Form in a new tab with `target="_blank" rel="noopener noreferrer"` and a `↗` indicator.
- **Closed state.** When `applicationsOpen` is `false`, Apply buttons point to `/apply`. That page shows when the next cycle opens. The exact copy and states are defined in spec 05.

---

## 11. Information architecture

| Route | Page | Spec |
|---|---|---|
| `/` | Home | 01 |
| `/about` | About & History | 02 |
| `/membership` | Membership | 03 |
| `/team` | Team (Leadership & Placements) | 04 |
| `/apply` | Apply | 05 |

- **Header nav:** About · Membership · Team · [Apply]. The logo links to Home.
- **Footer nav:** mirrors the header.
- **Reserved for the future (not built, not linked):** `/resources`, `/events`. The header layout must still fit two more nav items at ≥ 1024px without crowding.

---

## 12. Tech foundation

- **Framework:** Next.js (App Router) with TypeScript.
- **Styling:** Tailwind CSS v4. Every token from §4–6 is defined once in `@theme` in `app/globals.css`. Components use only those tokens, never raw hex values.
- **Rendering:** every page is statically generated. No client-side data fetching.
- **Hosting:** Vercel.
- **Content:** typed data modules in `content/`, so officers can update the site without touching components.

  | File | Contains |
  |---|---|
  | `content/site.ts` | Club name, mission line, contact email, social URLs, Apply config (§10) |
  | `content/team.ts` | Exec board and track leads: name, role, group, track, class year, major, headshot, alt text, placement, LinkedIn (spec 04 §5) |
  | `content/placements.ts` | Firms where members have placed: firm name only (spec 04 §5) |
  | `content/timeline.ts` | Club history milestones: year, title, description |

  Field-level shapes are finalized in the page spec that first uses each file. No CMS until the resource hub exists.
- **Assets:** `public/brand/` (logo variants), `public/images/events/`, `public/images/team/`.
- **SEO:**
  - Per-page `metadata` (title template `%s · Traders at Carolina`, plus a description).
  - A shared Open Graph image: bone background, logo and a random walk.
  - `sitemap.xml` and `robots.txt`.
- **Accessibility:**
  - Skip-to-content link.
  - Semantic landmarks (`header`, `nav`, `main`, `footer`).
  - Visible focus states (§4.3) and reduced-motion support (§9.2).
  - Required `alt` fields in the content types.
  - Tap targets of at least 44px.

---

## 13. Spec roadmap

| # | File | Covers |
|---|---|---|
| 00 | `00-vision-and-style.md` | This document |
| 01 | `01-home.md` | Hero, what we do, stats, inside the club, CTA |
| 02 | `02-about.md` | Mission and vision, founding story, principles, partners and advisors |
| 03 | `03-membership.md` | Club structure, tracks, weekly cadence, expectations |
| 04 | `04-team.md` | Executive board, track leads, placements (firm names) |
| 05 | `05-apply.md` | Process, timeline, FAQ, Google Form handoff, open/closed states |

**Every page spec contains:**
1. The page's goal, and the visitor questions it answers.
2. A section-by-section layout for desktop and mobile, using §6 and the §10 components.
3. The content requirements: the copy and data the club must supply.
4. Interactions and states.
5. Acceptance criteria.

Each spec is implemented separately, only after it is approved.

---

## 14. Open items

These are needed from the club. None of them block this spec.

- [ ] Logo files (SVG preferred), plus one-color black and bone variants if they exist.
- [ ] Whether "T@C" is an established short form.
- [ ] Contact email, Instagram URL, LinkedIn URL.
- [ ] Whether UNC requires a student-organization disclaimer in the footer.
- [ ] Club facts for the page specs: founding year, member count, placement firms.
