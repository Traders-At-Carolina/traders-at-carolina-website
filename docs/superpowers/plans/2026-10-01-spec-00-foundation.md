# Spec 00 Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to run this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js app with spec 00's design tokens, typography, layout primitives, motifs and shared components. Page specs 01–05 then only compose them.

**Architecture:**
- Next.js 16 App Router with all pages statically generated.
- Design tokens live once in Tailwind v4 `@theme` (`app/globals.css`).
- Pure logic (seeded random walk, Eastern-time parsing, application state, content validation) lives in `lib/` with Vitest unit tests.
- Shared UI lives in `components/`, as server components wherever possible. The client components are `SiteHeader` (scroll and menu state) and `Reveal` (an IntersectionObserver hook).
- `/styleguide` (noindex) renders every component for visual verification.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `next/font` (Public Sans, Gelasio), lucide-react, Vitest with Testing Library (jsdom), pnpm.

**Spec:** `docs/specs/00-vision-and-style.md`. The application-state helper follows `docs/specs/05-apply.md` §3.

## Global Constraints

- **Colors:** `bone #ebeae4`, `white #ffffff`, `navy #233265`, `black #000000`, `ink-2 #474644`, `ink-3 #636260`, `rule rgb(0 0 0/.15)`, `rule-strong rgb(0 0 0/.35)`, `rule-inverse rgb(235 234 228/.2)`, `navy-press color-mix(in oklab,#233265 85%,black)`, `grid rgb(35 50 101/.06)`.
- **Display font stack:** `"Georgia Pro", Georgia, Gelasio, "Times New Roman", serif`. Gelasio uses `preload: false`.
- **Body font:** Public Sans, weights 400/500/600. Numbers use `tabular-nums lining-nums`.
- **Shape:** `border-radius: 0` everywhere, no shadows, light theme only.
- **Layout:** container 1200px max, padding 20 / 32 (≥768) / 48 (≥1024).
- **Focus:** 2px navy outline with a 2px offset (bone on dark surfaces).
- **Motion:** none under `prefers-reduced-motion`.
- **Rule for components:** no raw hex values or font stacks inside components. Tokens only.
- **Language:** TypeScript strict mode.

## File structure

| Path | Responsibility |
|---|---|
| `app/globals.css` | `@theme` tokens, type-role utilities, base styles, graph-paper texture, reveal and draw-in motion |
| `app/layout.tsx` | Fonts, metadata template, skip link, header, `<main>`, footer, `js` class bootstrap |
| `app/page.tsx` | Temporary Home placeholder (replaced by spec 01) |
| `app/styleguide/page.tsx` | Component showcase, noindex |
| `app/not-found.tsx` | Styled 404 (routes for specs 01–05 don't exist yet) |
| `app/sitemap.ts`, `app/robots.ts` | SEO basics |
| `content/site.ts` | Club info and recruiting config (typed) |
| `lib/random-walk.ts` | Seeded PRNG and path generation |
| `lib/eastern-time.ts` | Parse ISO local times as America/New_York |
| `lib/applications.ts` | `getApplicationState(now)` |
| `lib/validate-site.ts` | Build-time content validation |
| `components/*.tsx` | `Container`, `Button`, `TextLink`, `Eyebrow`, `SectionHeader`, `PageHeader`, `Stat`/`StatRow`, `Card`, `CTABand`, `ApplyButton`, `RandomWalk`, `Reveal`, `Wordmark`, `SiteHeader`, `SiteFooter` |
| `tests/**/*.test.ts(x)` | Vitest |

**Deferred, with reasons:**
- `PersonCard`: defined by spec 04.
- Open Graph image: needs the logo files (00 §8.1, §12).
- Page routes: owned by specs 01–05.

**Placeholder:** a typeset `Wordmark` stands in for the logo until the SVG files arrive.

---

### Task 1: Scaffold and tooling

**Files:** a fresh Next.js app, plus `vitest.config.ts`, `tests/setup.ts`, and the `package.json` scripts.

- [ ] Scaffold with `pnpm create next-app` (TypeScript, Tailwind, App Router, ESLint, no `src/`, import alias `@/*`) in scratch space, then copy into the repo. The repo folder name has spaces, so it isn't a valid npm package name.
- [ ] Add dev dependencies: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`. Add dependency: `lucide-react`.
- [ ] Add scripts: `test` (`vitest run`) and `typecheck` (`tsc --noEmit`).
- [ ] Verify that `pnpm build` and `pnpm test` both run.
- [ ] Commit: `chore: scaffold Next.js app with Tailwind and Vitest`.

### Task 2: Pure logic in `lib/` (TDD)

**Produces:**
- `mulberry32(seed: number): () => number`
- `generateWalks(opts: { seed: number; paths: number; steps: number; width: number; height: number }): string[]`. Returns SVG path `d` strings. Deterministic, starts from a shared origin, stays within bounds.
- `parseEasternDateTime(iso: string): Date`. Accepts `YYYY-MM-DD` (treated as end of day 23:59) or `YYYY-MM-DDTHH:mm`, and handles EST and EDT.
- `getApplicationState(now: Date, recruiting: Recruiting): ApplicationState`, with `ApplicationState = { status: "open"; deadline?: Date } | { status: "closed"; nextOpen?: Date }`.
- `validateSite(site: Site): void`. Throws an `Error` that lists every problem.

**Tests:**
- **Random walk:** same seed gives identical output; different seeds give different output; the path count matches; every point is within the box; all paths share the first point.
- **Eastern time:**
  - `2027-02-06T23:59` → `2027-02-07T04:59Z` (EST).
  - `2026-10-16T19:00` → `2026-10-16T23:00Z` (EDT).
  - Date-only input → 23:59 Eastern.
- **Application state:** closed when the flag is false; open before the deadline; closed after it; open with no deadline; `nextOpen` is passed through.
- **Validation:** an open state with an empty or non-Google-Forms `applyUrl` throws; a malformed ISO date throws; a valid config passes.

- [ ] Write the tests, run them and watch them fail, implement, run them and watch them pass.
- [ ] Commit: `feat: add random walk, eastern time, application state and site validation`.

### Task 3: Tokens, fonts and base layout

**Files:** `app/globals.css`, `app/layout.tsx`, `content/site.ts`, `components/Container.tsx`.

**`@theme` contents:**
- Colors, as in the constraints above.
- `--font-display` and `--font-sans`.
- Type roles via `--text-{display,h1,h2,h3,lead,body,caption,stat,nav,button}`, each with a `--line-height` companion (00 §5.2).
- Breakpoints left at the defaults.

**Utilities:**
- `eyebrow` (Public Sans 500, 0.75rem, uppercase, 0.14em tracking, navy)
- `tabular`
- `bg-graph` (28px grid with an edge-fade mask)
- `rule-t` (top hairline)

**Base styles:**
- `body` is bone background, black text, Public Sans body role.
- Headings use `text-wrap: balance`, paragraphs `pretty`.
- Global `:focus-visible` ring.
- A reduced-motion reset.

**Layout:**
- Skip link to `#main`.
- `<html class>` carries the font variables.
- Inline script sets `document.documentElement.classList.add('js')`.
- Metadata: `title.template: "%s · Traders at Carolina"`, default title "Traders at Carolina", description from `site.mission`.
- Calls `validateSite(site)` at module scope.

- [ ] Implement, then verify with `pnpm build` and a visual check of `/`.
- [ ] Commit: `feat: add design tokens, fonts and root layout`.

### Task 4: Primitive components

**Produces:**
- `Button({ variant: "primary"|"secondary"|"inverse"; href: string; external?: boolean; children; className?; fullWidth? })`. Renders `<a>`. When `external`, it adds `target="_blank" rel="noopener noreferrer"` and a trailing `↗` (`aria-hidden`). Square, minimum height 44px, padding 12px × 24px.
- `TextLink({ href; external?; arrow?: boolean; tone?: "default"|"inverse"; children })`. Arrow is `→` (internal) or `↗` (external). Underline at a 4px offset with a 200ms scale-in.
- `Eyebrow({ index?: number; children })`. Renders `§ 01 — LABEL`, or just `LABEL` when `index` is undefined.
- `SectionHeader({ index?; eyebrow; title; lead?; id? })`. Rule, eyebrow, H2, lead, within 7 columns.
- `Stat({ value: string; label: string })` and `StatRow({ stats: Array<{ value?: string; label: string }> })`. `StatRow` drops entries with no value and puts dividers only between rendered items.
- `Card({ children; className? })`.

**Tests:** `Button` external attributes and arrow; `Eyebrow` formatting (`§ 03 — TRACKS`); `StatRow` drops missing values without leaving extra separators.

- [ ] TDD the tested behaviors, then implement the rest.
- [ ] Commit: `feat: add button, text link, section header, stat and card primitives`.

### Task 5: Motifs

**Produces:**
- `RandomWalk({ seed: number; paths?: number (3–5); size: "hero"|"header"; className? })`. A server component with an inline SVG and `aria-hidden`. Path 0 is navy at 1.5px; the others alternate between navy at 30% and black at 25%, at 1px. Uses `pathLength=1` with the `draw-in` class for a 1.2s animation, disabled under reduced motion.
- `Reveal({ as?; children; className? })`. A client component that adds `is-visible` once on intersection. CSS hides content only under `html.js` and without reduced motion.

**Test:** `RandomWalk` renders the requested number of `<path>` elements and renders identically for the same seed.

- [ ] Implement and test.
- [ ] Commit: `feat: add random walk motif and reveal-on-scroll`.

### Task 6: `PageHeader`, `ApplyButton`, `CTABand`

**Produces:**
- `ApplyButton({ variant; fullWidth?; now?: Date })`. Uses `getApplicationState(now ?? new Date(), site)`.
  - **Open:** "Apply", external link to `applyUrl`.
  - **Closed:** "Apply", internal link to `/apply`.
  - Page-specific labels (spec 01 §5, spec 05 §4) are added by those specs.
- `PageHeader({ eyebrow; title; lead?; seed?; children? })`. Graph texture, 7-column text, `RandomWalk` with `size="header"` on the right from 768px up, and a `children` slot reserved for spec 05's status block.
- `CTABand({ title; lead?; action?: ReactNode })`. Full-bleed navy, white H2, bone lead. The action defaults to `<ApplyButton variant="inverse" />`.

**Test:** `ApplyButton` in the open state links to `applyUrl` with `target="_blank"`; in the closed state it links to `/apply` with no `target`.

- [ ] Implement and test.
- [ ] Commit: `feat: add page header, apply button and CTA band`.

### Task 7: `SiteHeader` and `SiteFooter`

**`SiteHeader`** (client component; receives `applyHref` and `applyExternal` from a server wrapper so the state logic stays server-side):
- `Wordmark` on the left.
- Nav: About · Membership · Team, plus an `ApplyButton` (primary).
- Sticky. A bottom rule appears when `scrollY > 8`.
- The active link gets an underline (via `usePathname`).
- Below 768px: a menu button opens a full-screen bone overlay with H2-size Georgia links and a full-width Apply button. It traps focus, closes on `Esc`, locks body scroll, closes on route change, and uses `aria-expanded` and `aria-controls`.

**`SiteFooter`** (server component):
- Black background, bone text.
- Wordmark (inverse), mission line, nav, optional contact email, optional Instagram and LinkedIn, Apply link, `© {year} Traders at Carolina`, optional disclaimer.

**Test:** the menu button toggles `aria-expanded` and `Esc` closes the menu.

- [ ] Implement and test.
- [ ] Commit: `feat: add site header and footer`.

### Task 8: Routes, SEO and verification

- [ ] `app/page.tsx`: a minimal placeholder that uses `PageHeader`.
- [ ] `app/styleguide/page.tsx`: every component and token, with `robots: { index: false }`.
- [ ] `app/not-found.tsx`.
- [ ] `app/sitemap.ts`: the five spec routes, built from `site.url`.
- [ ] `app/robots.ts`: allow everything, disallow `/styleguide`.
- [ ] Verify:
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
  - Run the dev server and check `/styleguide` and `/` in the browser at 375, 768 and 1280 widths.
  - Keyboard pass on the header and mobile menu.
  - Lighthouse on `/`.
- [ ] Commit: `feat: add placeholder home, styleguide, 404 and SEO routes`.
