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

- At most **one motif per viewport**. The motifs are the random walk, the graph-paper grid and stat rows (§7.2–7.4). In `PageHeader`, the grid and the random walk (or the page's own art, such as the `/membership` depth chart or the `/team` placement strip) form a single composition and count as one motif. In the Home hero, the 3D volatility surface (with its own floor grid) and the masked graph-paper grid behind it likewise count as one. The `/team` firm field (spec 04 §4.6) is a motif in its own section, well below the header strip, so the two never share a viewport. Section eyebrows and hairline rules are structural, not motifs, so they appear everywhere.
- Never use stock tickers or marquees, candlestick charts, red/green up/down colors, terminal or monospace typography, or stock photography. **One exception:** decorative bits (0s and 1s drawn in the site's own sans) are allowed in exactly two places: the footer's `BitWordmark` ([spec 08](08-footer-bit-wordmark.md)) and the 404 page's navy 3D `Bit404` ([spec 10](10-not-found.md)). Each counts as a motif. Bits appear nowhere else.

---

## 4. Color system

The four brand colors are the only hues on the site. Every other color is a tint, alpha or mix of those four. (Firm logos on `/team` are the one exception, §7.5.)

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
- **Navy fills:** primary buttons, plus **at most one** full-bleed navy band per page. That band is the footer's CTA zone (spec 07); pages don't place their own.
- **Black fills:** the footer, plus the hover state of the `secondary` button. No black sections.
- **Light theme only.** No dark mode. The footer's navy CTA zone and black base supply the dark moments.
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
- **Background rhythm:** bone by default, with occasional white sections for contrast. The only navy band is the footer's CTA zone (spec 07). The footer base is always black.
- **Corners and depth:** `border-radius: 0` everywhere, no box shadows. Elevation is a `white` surface plus a 1px `rule` border. **Sole exception:** the `SiteHeader`'s floating bar, nav highlight, Apply button and mobile menu card (§10).
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
- **Placement:** in each `PageHeader`, unless the page supplies its own art (`/membership` uses the depth chart, §7.6). (The Home hero uses a 3D volatility surface instead; spec 01 §3.1.)
- **Motion:** an optional 1.2s stroke draw-in on load (`stroke-dashoffset`), disabled under `prefers-reduced-motion`.
- **Accessibility:** decorative, so it carries `aria-hidden="true"`.

### 7.3 Graph-paper grid
- 28px cells drawn in the `grid` color with `mask-image`, fading out toward the edges.
- Used only behind the Home hero and inside `PageHeader`, plus a faint continuation behind the docked `SiteHeader` (§10) so the grid seems to run up into the nav bar.

### 7.4 Stat rows
- Large `Stat`-role numbers in navy with caption-sized labels underneath.
- Separated by vertical hairlines on desktop and horizontal hairlines when stacked on mobile.

### 7.5 Firm names
- Placement firms are set in type by default.
- If firm logos are used, they are monochrome (black at 60%) and uniform in height, never in full color.
- **One exception (2026-10-03):** on `/team`, the header strip (spec 04 §4.1) and the firm field (spec 04 §4.6) show each firm's mark in its own colours, using the version made for light backgrounds. The footer strip, on black, stays monochrome (bone).

### 7.6 Order-book depth chart (`DepthChart`)
- **Shape:** stepped cumulative bid and ask depth curves stepping outward from a narrow, centred spread, over a hairline baseline with a short tick at each price level. Under the curves, a ladder of bars shows each level's own resting size at the curve's scale, so a bar never rises above its curve. A faint navy band marks the spread, and a dashed `rule-strong` mid line rises from it to a small navy dot at the top margin. No labels, axes or prices.
- **Strokes and fills:** bids take the random walk's lead stroke (solid `navy`, 1.5px), asks its muted stroke (black at 25%, 1px). Each side's fill is a vertical gradient that fades toward the baseline (navy from 10%, black from 5%). Ladder bars are navy at 14% and black at 8%. Never red/green (§3).
- **Deterministic:** level sizes come from a fixed seed (`lib/order-book.ts`). Bids and asks use separate streams, so the book is not a mirror image. The chart's scale leaves 20% headroom above the deeper side, so the live book can deepen without rescaling or clipping.
- **Placement:** the `/membership` `PageHeader` only (spec 03 §3.1), in place of the random walk.
- **Motion:** on first sight the chart is drawn, not raised: a pen sweeps out from the spread to each edge over 1.2s, drawing the curve and the ladder beneath it as it passes, with nothing on screen before it moves. The fills wash in once the line is down, and the mid line rises to its dot. (The pen is a clip that widens, not a stroke dash: dashes on a non-scaling stroke are measured on screen, so in the stretched chart they showed the ends of the curves before the draw began.) Then it trades quietly. Every 0.9–1.6s one or two levels resize over 550ms, mostly near the touch. Some ticks are a fill that takes 30–70% off one side's best level and prints a small ring at the spread, and a few put up or pull a large order deeper in the book. Sizes stay within 0.3–2.5× where they began. The motion pauses offscreen and in background tabs and resumes where it stopped. Under `prefers-reduced-motion` the full static book shows with no motion; without JavaScript it shows as rendered on the server.
- **Accessibility:** decorative, so it carries `aria-hidden="true"`.

---

## 8. Imagery

### 8.1 Logo
- The club's existing logo is the source of truth. SVG is preferred.
- Required variants: full-color (if it has color), one-color black (for bone and white), and one-color bone (for navy and black).
- Location: `public/brand/`: `logo.svg` (full-color navy), `logo-black.svg` and `logo-bone.svg`. The three share identical geometry (a test enforces it).
- The club supplied the logo as a 400 × 400 JPG of the **mark only** (no wordmark in the artwork). The SVGs are a faithful trace of it (within about 1px), so swap them for the club's original vector files if they exist.
- Where it appears:
  - **Header:** the full-color mark (32px tall, 28px on phones) beside the typeset name. Below 360px wide the name is dropped and only the mark remains.
  - **Footer:** the bone mark (44px tall) beside the name.
  - **Browser tab and home screen:** `app/icon.svg`, `app/favicon.ico` (16, 32 and 48px) and `app/apple-icon.png` (180px on `bone`), all made from the same mark.
- The typeset name next to the mark is Georgia, not part of the logo.
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
| Header random walk / depth chart | Stroke draw-in over 1.2s on load (depth-chart fills fade in alongside) |
| Hero 3D surface — spin | Continuous clockwise turn (seen from above), one revolution per 60s, eased in after a drag; stops on interaction, resumes after 1.5s |
| Section markers | The § 01 / 02 / 03 hairline draws left to right (900ms) and the eyebrow glides in behind it (a soft-edged mask sweep with a fade and a 6px settle, never stepped per letter), once, on entering the viewport; static under reduced motion or without JS |
| Section progress rail | Thin fixed line down the left edge (md+): fills with page scroll, tick per section, current section's tick emphasised; decorative, hidden on pages with under two sections |
| Hero 3D surface — market cycle | Holds each regime 5s, then morphs to the next over 2.6s (cubic ease-in-out); only while visible |
| Home intro | On every full load of Home: graph paper sweeps in, logo and name rise, then it dissolves into the hero grid over ~2.15s; any key, click or scroll skips it (spec 01 §3.6) |
| Link underline | Underline scales in from the left on hover, 200ms |
| Button hover | Background color transition, 150ms |
| Header float | Docked bar morphs into the floating bar over 450ms, `--ease-soft` (no overshoot) |
| Header nav highlight | One shared highlight trails the pointer between links: 70ms delay, then a 700ms `--ease-spring` (~4% overshoot). Header only |
| Mobile menu card | Fades in and drops 8px over 250ms, `--ease-soft`. Header only |
| Team firm field | Firm marks drift at 10–18px/s with soft collisions; drag and flick, with momentum easing back to cruise speed; only while on screen; a "Pause motion" button stops it (spec 04 §4.6) |

- No parallax, marquees, scroll-jacking or auto-advancing carousels.
- Under `prefers-reduced-motion: reduce`, every effect above is disabled and content renders in its final state.

---

## 10. Shared components

Page specs reference these by name. Each one is built once and reused.

### `SiteHeader`
- Logo on the left (links to `/`). Nav on the right: **About · Membership · Team**, then an **Apply** `Button` (`primary`).
- **Docked** until the first line of hero text (Home `Hero` or `PageHeader`) reaches the header, tracked by a 1px `data-nav-float-point` marker at the top of the hero's text column: full-width, sticky, on a `bone` background, 64 / 80px tall. On pages with a hero grid, the same 28px grid shows faintly behind the docked bar (`graph-paper-nav`): lines aligned with the hero's grid below, about 55% strength at the bottom centre, fading toward the sides and the top. It fades out as the bar floats and does not appear on pages without a hero.
- **Floating** as soon as that text would pass under it (pages without a hero: as soon as the page scrolls): a centred bar inset 8 / 12px from the top, 48px tall on desktop (52px on mobile) and `min(100% − 2rem, 52rem)` wide, with 16px corners, `bone` at 85% with a backdrop blur, a 1px `rule` border and a soft shadow. The header keeps its height, so the page never shifts. It stays floating while the mobile menu is open.
- **Nav highlight:** a single `wash` highlight (navy at 8%, 10px corners) rests behind the active page's link, springs to whichever link is hovered or focused, and springs back when the pointer or focus leaves. The hovered or active link's text turns `navy`. With no active page (Home) the highlight fades in at the hovered link. Under reduced motion it jumps.
- The Apply button is a `primary` button with 10px corners (`shape="rounded"`, concentric with the bar's 16px corners and 6px inset), in the bar and in the mobile menu. In the desktop bar it is compact (`size="sm"`, 32px tall, an 8px inset in the 48px bar), the one exception to the 44px minimum height; it is pointer-only there, and the mobile menu's Apply stays 44px. Apply buttons elsewhere stay square.
- **Mobile (< 768px):** logo, a compact Apply button (44px tall, `size="compact"`) and a menu button; the compact Apply gives way to the menu's own Apply while the menu is open. The menu opens a dropdown card directly under the bar: `bone`, 1px `rule` border, 16px corners and the bar's shadow, with Georgia (H3-size) links, each at least 48px tall, and a full-width Apply button. It is a disclosure, not a modal: the page behind stays interactive and still scrolls (it is not made `inert`) and there is no focus trap. `Esc`, a press outside the header, tabbing out of the header or choosing a link closes it. The current page's link sits on the `wash` highlight.

### `SiteFooter`
- Defined in spec 07: a navy CTA zone, then a black base (`black` background, `bone` text, `rule-inverse` hairlines) with the Club / Join / Reach link grid, the placement strip and the legal row.
- Contact, social and the UNC student-organization disclaimer still depend on §14.
- The very bottom of the footer carries the `BitWordmark` band: a decorative, scroll-triggered field of 0s and 1s that resolves into "Traders at Carolina" and lights up around the cursor ([spec 08](08-footer-bit-wordmark.md)).

### `Bit404`
- 404 page only ([spec 10](10-not-found.md)): a solid 3D "404" built from navy 0s and 1s that decodes on load, keeps glitching and turns to face the cursor. It shares its bit primitives with `BitWordmark` (`components/bits/bitCore.ts`).

### `Button`
All variants are square (except the header's Apply button, §10 `SiteHeader`), use the Button type role, and have 12px × 24px padding with a minimum height of 44px. The one exception is the desktop header's compact `sm` Apply (32px tall, 6px × 20px padding).

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
- An optional `art` prop replaces the `RandomWalk` in that column; `art={null}` leaves the column out. `/membership` uses it for the order-book depth chart (§7.6, spec 03 §3.1), and `/team` for the looping placement strip (spec 04 §4.1). The art stays a single composition with the grid, so the one-motif rule in §3 still holds.

### `Stat` / `StatRow`
- `Stat`: a number (Stat role) plus a caption label.
- `StatRow`: 3–4 `Stat`s divided by hairlines, per §7.4.

### `Card`
- `white` surface, 1px `rule` border, 24–32px padding, no radius, no shadow.

### `PersonCard`
- A headshot plus name and role. The full definition is in spec 04.

### `CTABand`
- A full-bleed `navy` section: an H2 in `white`, an optional lead in `bone`, and an `inverse` Apply `Button`.
- Rendered by `SiteFooter` (spec 07) as its CTA zone, which is the one navy band on every page except `/apply`; `/apply` keeps its own band inside the page (spec 05 §4.4) and the footer zone is left out there (§4.3).
- The section directly above a band (the last section of `<main>` when the footer zone renders) gets one extra step of bottom padding (96 / 128 / 160px instead of 64 / 96 / 128px), so the band has more room. The padding sits on that section, so its bone or white tone runs right up to the navy.

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
- **Footer nav:** mirrors the header (the Club group). The Join and Reach groups are defined in spec 07.
- **Reserved for the future (not built, not linked):** `/resources`, `/events`. The header layout must still fit two more nav items at ≥ 1024px without crowding.
- **Admin (not linked, not indexed):** `/admin`, defined in spec 06. Only users with the admin role can use it. It does not use the site header or footer.
- **Portal (signed in, not in the nav, not indexed):** `/portal`, defined in spec 09. The corner button on every public page links to it. It is the first home for interview prep and events (the resource hub in §1); a public `/resources` or `/events` can reuse its content later.

---

## 12. Tech foundation

- **Framework:** Next.js (App Router) with TypeScript.
- **Styling:** Tailwind CSS v4. Every token from §4–6 is defined once in `@theme` in `app/globals.css`. Components use only those tokens, never raw hex values.
- **Rendering:** every public page is statically generated. No client-side data fetching. Once [spec 06](06-admin.md) lands, pages that show editable collections regenerate on demand after an admin saves. `/admin` and `/portal` (spec 09) are rendered dynamically.
- **Hosting:** Vercel.
- **Content:** typed data modules in `content/`, so officers can update the site without touching components.

  | File | Contains |
  |---|---|
  | `content/site.ts` | Club name, mission line, contact email, social URLs, Apply config (§10) |
  | `content/team.ts` | Exec board and track leads: name, role, group, track, class year, major, headshot, alt text, placement, LinkedIn (spec 04 §5) |
  | `content/placements.ts` | Firms where members have placed: firm name only (spec 04 §5) |
  | `content/timeline.ts` | Club history milestones: year, title, description |

  Field-level shapes are finalized in the page spec that first uses each file. [Spec 06](06-admin.md) replaces the earlier "no CMS until the resource hub exists" rule. Photos, officers, tracks, sponsors, placements, recruiting settings and events move into a database that admins edit at `/admin`, and those `content/*.ts` exports become seed data. All other copy stays in `content/` (spec 06 §2 lists it).
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
| 06 | `06-admin.md` | Admin dashboard: member roster and access requests, website lists and seasonal settings (photos, officers, tracks, sponsors, placements, recruiting, events), portal content, undo and history, admin access, usage analytics |
| 08 | `08-footer-bit-wordmark.md` | Footer 0s-and-1s wordmark: scroll-in scramble and load, glitching letters, cursor-lit hover, cropped at the page end |
| 09 | `09-portal.md` | Signed-in portal: recruiting, interview prep, events, tracks and the club for everyone; learning, internship tracker and competitions for members |
| 10 | `10-not-found.md` | 404 page: a 3D "404" of navy bits that decodes on load, glitches and turns to face the cursor |

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

- [x] Logo: received as a JPG of the mark and traced to SVG (§8.1). Still wanted: the original vector files and any official wordmark lockup.
- [ ] Whether "T@C" is an established short form.
- [ ] Contact email, Instagram URL, LinkedIn URL.
- [ ] Whether UNC requires a student-organization disclaimer in the footer.
- [ ] Club facts for the page specs: founding year, member count, placement firms.
