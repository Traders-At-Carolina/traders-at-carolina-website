# Spec 11 — Admin Console

**Status:** For review · **Date:** 2026-10-04 · **Route:** `/admin/**` · **Depends on:** [Spec 06](06-admin.md) (data, actions, phases 7–8), [Spec 09 §8](09-portal.md) · **Amends:** spec 06 §6.0 (sidebar) and §6.1 (Overview)

Spec 06 defines *what* the admin can do: data, saves, undo, access and the portal contract. This spec defines *how the console looks and is organised*, and adds four power features. Where spec 06 §6.0 describes the sidebar, this spec replaces it. Every other part of spec 06 still applies.

---

## 1. Goal

Turn `/admin` into a real product console that:
- looks nothing like the public site, so officers can tell at a glance that they are in the tool and not on a page;
- puts every screen one or two clicks away from a top navbar;
- lets admins change and oversee everything the site and portal show, including portal content (06 phase 7) and analytics (06 phase 8).

### Decisions (2026-10-04)

| Decision | Choice |
|---|---|
| Scope | Redesign every existing screen, then finish spec 06 phases 7 and 8 |
| Look | Clean product SaaS: light slate canvas, white cards, Inter, 8–12px radii, soft shadows |
| Navigation | Top bar with five sections; the active section shows a second row of sub-tabs |
| Extras | ⌘K command palette, game-score moderation, Overview health checks, "View on site" on every editor |

### Not in scope

- Any change to the public site's look. Spec 00 is unchanged, and the public pages must render pixel-identical before and after.
- A dark mode. The tokens in §2 are named so a dark set can be added later without renaming anything.
- New roles. There is still one `admin` role (06 §4.1).
- Editing page copy. It stays in `content/*.ts` (06 §2).

---

## 2. Design language

The console shares nothing visual with spec 00. It has no bone background, no Georgia headings, no graph paper, no eyebrows, no `link-underline` and no navy.

### 2.1 Tokens

These are added to the existing `@theme` in `app/globals.css` under a `ui-` prefix.
- The global `@theme` resets Tailwind's default colours, radii and shadows, so every console value must be declared here.
- Only admin files use `ui-*` utilities, so public pages render unchanged. The shared stylesheet still declares the `ui-` custom properties on `:root`; they are unused outside `/admin` and cost a few hundred bytes.

| Token | Value | Use |
|---|---|---|
| `--color-ui-canvas` | `#f8fafc` | Page background |
| `--color-ui-surface` | `#ffffff` | Cards, top bar, inputs |
| `--color-ui-subtle` | `#f1f5f9` | Table headers, hovered rows, inactive pills |
| `--color-ui-border` | `#e2e8f0` | Card and input borders, dividers |
| `--color-ui-border-strong` | `#cbd5e1` | Hovered inputs, the active sub-tab outline |
| `--color-ui-text` | `#0f172a` | Primary text |
| `--color-ui-text-2` | `#475569` | Secondary text, labels |
| `--color-ui-text-3` | `#64748b` | Hints, timestamps (4.8:1 on white, 4.5:1 on canvas) |
| `--color-ui-accent` | `#1d6fb8` | Primary buttons, active tab, links, focus ring (5.2:1 on white) |
| `--color-ui-accent-hover` | `#185d9b` | Hovered or pressed primary button |
| `--color-ui-accent-soft` | `#e8f1fa` | Active sub-tab, selected rows, info banners |
| `--color-ui-success` / `-soft` | `#15803d` / `#e9f7ef` | Open, Live, Active, Saved |
| `--color-ui-warning` / `-soft` | `#b45309` / `#fdf3e4` | Scheduled, Pending, health warnings |
| `--color-ui-danger` / `-soft` | `#b91c1c` / `#fdecec` | Delete, errors, Closed (when overdue) |
| `--radius-ui-sm` / `-md` / `-lg` / `-full` | 6px / 8px / 12px / 9999px | Pills and inputs / buttons / cards and dialogs / avatars and switches |
| `--shadow-ui-card` | `0 1px 2px rgb(15 23 42 / 0.06)` | Cards |
| `--shadow-ui-pop` | `0 12px 32px -8px rgb(15 23 42 / 0.18), 0 2px 6px rgb(15 23 42 / 0.06)` | Menus, dialogs, palette, toast |

**Status colours always come with a label or an icon.** Colour is never the only signal.

### 2.2 Type

- **Inter** is loaded via `next/font/google` in `app/admin/layout.tsx` as `--font-ui`. It is used for everything in the console.
- Counts, tables, dates and IDs use tabular numerals (`font-variant-numeric: tabular-nums`).

| Role | Size / line height | Weight |
|---|---|---|
| Page title (h1) | 24 / 32, tracking −0.01em | 600 |
| Section title (h2) | 16 / 24 | 600 |
| Card title (h3) | 14 / 20 | 600 |
| Body | 14 / 20 | 400 |
| Label | 13 / 18 | 500 |
| Hint, caption | 12 / 16 | 400 |
| Stat value | 28 / 32, tabular | 600 |

The public type scale (`text-h1`, `text-body` and the rest) is not used inside the console. The console uses plain Tailwind size utilities with these values, set through `ui-` text tokens.

### 2.3 Scope wrapper

The console shell renders inside `<div class="admin-ui">`. A small `@layer base` block in `globals.css` scoped to `.admin-ui`:
- sets `font-family: var(--font-ui)`, the canvas background and `ui-text` colour;
- overrides the global h1–h3 rule (which sets Georgia, weight 400) back to Inter, weight 600;
- sets the focus ring to `2px solid var(--color-ui-accent)` with a 2px offset;
- sets selection to `ui-accent-soft` with `ui-text`.

Nothing outside `.admin-ui` changes.

### 2.4 Clerk

`ClerkProvider` in `app/admin/layout.tsx` gets `appearance.variables`: `colorPrimary` set to `ui-accent`, `borderRadius` 8px, and the font set to `--font-ui`. This makes `UserButton` and the sign-in and sign-up cards match.

The sign-in and sign-up pages become a centred Clerk card on the canvas, under the TAC Admin mark (§3.2), with a "Back to the site" link.

### 2.5 Motion

- Transitions only: 150ms colour and background changes; 120ms fade and scale (0.98 to 1) for menus, dialogs and the palette.
- `prefers-reduced-motion` removes the scale.
- No scroll effects and no 3D.

---

## 3. Shell and navigation

### 3.1 Nav map: `lib/admin/nav.ts`

This one file drives the top bar, sub-tabs, mobile menu, ⌘K palette, Overview shortcuts and "View on site". It replaces `components/admin/AdminNav.tsx` and its hard-coded `GROUPS`.

```ts
type AdminScreen = {
  href: `/admin${string}`;
  label: string;
  icon: LucideIcon;
  description: string;      // one line, shown in the palette and on Overview shortcuts
  keywords?: string[];      // extra palette search terms
  siteHref?: string;        // the public page this screen affects, for "View on site"
  phase?: "C" | "E";        // hidden until the phase ships
};
type AdminSection = { id: string; label: string; href: string; screens: AdminScreen[] };
export const ADMIN_SECTIONS: AdminSection[];
export function sectionFor(pathname: string): AdminSection;
export function screenFor(pathname: string): AdminScreen | undefined;
```

| Section | Screens (`siteHref`) |
|---|---|
| **Overview** | `/admin` |
| **Club** | Members, Officers (`/team`), Admins |
| **Website** | Recruiting (`/apply`), Events (`/`), Photos (`/`), Sponsors (`/about`), Placements (`/team`), Tracks (`/membership`) |
| **Portal** | Announcements (`/portal`), Resources (`/portal`), Portal settings (`/portal`) |
| **Insights** | Analytics, Game scores (`/membership`), History |

A section's `href` is its first screen, so clicking "Club" opens Members.

Spec 06 §6.0 put Events under "Events & portal". It moves to **Website**, because events show on Home and Apply, and the portal section now holds only portal-only content.

### 3.2 Top bar

`components/admin/AdminTopBar.tsx` (client):
- Sticky, 56px tall, on `ui-surface` with a bottom border.
- **Left:** the TAC Admin mark, linking to `/admin`. It is a 28px rounded `ui-accent` square with "TAC" in white, followed by "Admin" in `ui-text-2`.
- **Centre:** the five section links.
  - The active one, found with `sectionFor(usePathname())`, gets `ui-text` and a 2px `ui-accent` underline flush with the bar's bottom edge, plus `aria-current="page"`.
  - Inactive links use `ui-text-2`, turning to `ui-text` on hover.
- **Right:**
  - a search button that reads "Search… ⌘K", or "Ctrl K" off Mac, and opens the palette (§5.1);
  - "View site ↗", which opens `/` in a new tab;
  - Clerk `UserButton`.

### 3.3 Sub-tabs

`components/admin/AdminSubNav.tsx` is a 48px row under the top bar, on `ui-surface`, with a bottom border.
- It holds the active section's screens as pill links (icon and label).
- The active pill gets `ui-accent-soft` with `ui-accent` text.
- It is hidden on Overview, and when the section has one screen.
- At narrow widths it scrolls horizontally, with the active pill scrolled into view.

### 3.4 Mobile (under 768px)

- The top bar shows the mark, a search icon, and a menu button.
- The menu opens a full-height sheet (native `<dialog>`) listing every section with its screens indented. It also holds "View site" and `UserButton`.
- The sub-tab row stays, so switching between sibling screens is still one tap.

### 3.5 Page frame

- `<main id="main">` is `max-w-7xl`, with 24px padding on mobile and 32px on desktop.
- A skip link goes to `#main`.
- Every page starts with `PageHeader` (§4).
- `MarkInternalBrowser` stays in the shell.
- **Auth stays per page.** The layout never checks access; every page calls `requirePage()` first (06 §4.3).

---

## 4. UI kit: `components/admin/ui/`

The kit is hand-built. No shadcn or Radix is added, to stay consistent with the repo. Every control meets the 44px hit target on touch, through padding or `hit-target`.

| Component | Notes |
|---|---|
| `Button`, `ButtonLink` | Variants: `primary` (`ui-accent`), `secondary` (white with a border), `ghost`, `danger`. Sizes `sm` (32px) and `md` (36px). `pending` shows a spinner and disables the button. Leading icon optional. |
| `Field` | Label, control, hint, and error. Takes `name` and reads `ActionState.fieldErrors[name]`. Sets `aria-describedby` and `aria-invalid`. |
| `Input`, `Textarea`, `Select`, `Checkbox` | 36px tall, `ui-border`, `radius-ui-md`. The focus ring is `ui-accent`. |
| `Switch` | A `role="switch"` button bound to a hidden input. Used for booleans: pinned, featured, visible, show on wall, the access settings. |
| `DateTimeInput` | `datetime-local`, labelled "Eastern time", keeping the Eastern ISO strings from 06 §5. |
| `Card`, `CardHeader`, `CardSection` | `ui-surface`, `ui-border`, `radius-ui-lg`, `shadow-ui-card`. The header has a title, description, and an actions slot. |
| `StatTile` | Label, value, optional delta or pill, optional sparkline slot, optional link. |
| `Badge`, `StatusPill` | A pill with a dot. Tones: neutral, accent, success, warning, danger. Status words come from one map: Open, Closed, Live, Scheduled, Expired, Pending, Approved, Declined, Active, Alumni, Inactive, Hidden, Pinned, Featured. |
| `PageHeader` | Breadcrumb (section › screen › item), h1, one-line description, an actions slot (such as "New event"), and "View on site ↗" when `screenFor(pathname).siteHref` is set. |
| `Tabs` | Links using `?tab=`, so they're bookmarkable and need no client state. Each tab can show a count. |
| `DataTable` | A semantic `<table>` with a sticky header, row hover, and optional selection with a bulk-action bar. It has a row-actions `Menu`, and an `EmptyState` when there are no rows. Below 768px each row renders as a card. |
| `Menu` | A button-triggered dropdown with keyboard support: arrows, Home/End, Esc, typeahead. |
| `Dialog`, `ConfirmDialog` | Native `<dialog>`, with focus moved in and returned on close. `ConfirmDialog` states what is deleted and what else changes (06 §6.0). It replaces the inline delete confirmations. |
| `EmptyState` | An icon, one sentence, and a primary action. |
| `Skeleton` | Shimmer blocks, used by the per-section `loading.tsx` files. |
| `Banner` | Info, warning or danger. Carries the "Hidden until…" hints from 06 §6.0. |

These keep their behaviour and are restyled only:
- `SaveToast` (bottom-right, `shadow-ui-pop`, with Undo and View on site);
- `UndoButton`, `SavedFromParam`, `ImageUpload` (drop zone);
- `use-save-form` and `use-unsaved-changes`.

---

## 5. Power features

### 5.1 Command palette (⌘K)

`components/admin/CommandPalette.tsx`, mounted once in the shell.

**Opening and closing**
- Opens on ⌘K or Ctrl+K, and from the top-bar search button.
- Esc closes it. Focus returns to whatever opened it.

**Layout and keyboard**
- A centred `<dialog>`, 640px wide, with a search input and grouped results.
- It uses the ARIA combobox and listbox pattern: arrow keys move, Enter opens, ⌘Enter opens in a new tab.

**Results, before typing:** recent screens (kept in `sessionStorage`, guarded with try/catch), then every screen from `nav.ts`.

**Results, while typing**
- **Screens:** matches against label, description and keywords.
- **Actions:**

  | Action | Goes to |
  |---|---|
  | New event | `/admin/events/new` |
  | Add members | `/admin/members/add` |
  | Review requests | `/admin/members?tab=requests` |
  | Invite admin | `/admin/admins` |
  | New officer | `/admin/officers/new` |
  | New sponsor | `/admin/sponsors/new` |
  | New placement | `/admin/placements/new` |
  | Upload photo | `/admin/photos/new` |
  | Open or close recruiting | `/admin/recruiting` |
  | New announcement | phase C |
  | New resource | phase C |

- **Records**, from the `searchAdmin(q)` server action:
  - The action calls `requireAdmin()` first.
  - It waits until 2 characters have been typed, and is debounced by 200ms.
  - It returns at most 5 of each: members (name or email), events (title), officers (name or role), sponsors, placements (firm), and resources and announcements (title, phase C).
  - Each result links to that record's edit page.
  - It uses case-insensitive `ilike` on indexed columns. No search index is added.

Actions are navigations only. The palette never writes data.

### 5.2 Overview dashboard

This replaces 06 §6.1's layout. The data is the same, plus the health checks.

1. **`PageHeader`:** "Overview", with "Good morning, {firstName}" as the description.
2. **KPI row** (four `StatTile`s):

   | Tile | Shows | Links to |
   |---|---|---|
   | Members | Active count, with alumni as a sub-value | `/admin/members` |
   | Requests | Pending count; warning tone when above 0 | the Requests tab |
   | Recruiting | `StatusPill` with "Open · closes in 2 days" or "Closed · opens Jan 12" | `/admin/recruiting` |
   | Next event | Title and relative date | the event |

3. **Visitors row** (phase E): live now, 7-day visitors with a sparkline, and 7-day Apply clicks (06 §7.2).
4. **Two columns on desktop**
   - **Needs attention** (left, §5.3). If nothing needs attention it shows "All clear" with a check icon.
   - **Recent changes** (right): the last 10 audit entries as `avatar initial · action · item · time ago`, with Undo where `canUndoEntity`, and "All history →".
5. **Shortcuts:** a grid of every screen card from `nav.ts` (icon, label, description).

Each block fails on its own. If a query throws, that card says "Unavailable right now" and the rest of the page still renders.

### 5.3 Health checks: `lib/admin/health.ts`

`healthChecks(): Promise<HealthIssue[]>`, where `HealthIssue = { id, tone: "warning" | "danger", message, href }`. The checks run in parallel, and each catches its own error.

| Check | Message (example) | Links to |
|---|---|---|
| Officer headshot missing | "2 visible officers have no headshot" | Officers |
| Image too small | "Headshot for Jane Doe is 480px wide (needs 600px)", read from the stored `ImageAsset.width` | that officer or photo |
| Section hidden by threshold | "Inside the club needs 2 photos (has 1)" or "Placements list appears at 5 firms (has 3)" | the editor |
| Featured event in the past | "'Mock interview night' ended but is still featured" | that event |
| Recruiting overdue | "Recruiting is open but its close date has passed" | Recruiting |
| Requests waiting long | "3 requests have waited more than 7 days" | Requests tab |

**Thresholds** come from the constants the public components already use, the same source as 06 §6.0's "Hidden until…" hints. If a threshold is currently inline in a component, it is exported first and both sides import it. Nothing is duplicated.

### 5.4 Game moderation

`/admin/games` stays read-only by default. Each score row and each contact row gets a row-actions menu with **Delete**.

- **Deleting a score** also deletes its linked contact, if any. The `ConfirmDialog` says so.
- **Deleting a contact** leaves the score.
- New actions in `app/admin/(console)/games/actions.ts`, through `adminAction()`:
  - entities `game-score` and `game-contact`, action `delete`;
  - the full row snapshot goes in `before`.
- Undo handlers for both are registered in `UNDO_HANDLERS`, and recreate the rows with their original ids.
- Deleting invalidates the games leaderboard cache tag.

### 5.5 View on site

- Every editor's `PageHeader` shows "View on site ↗", using the screen's `siteHref`, and opens in a new tab.
- Item edit pages use the most specific link available: an officer opens `/team#<slug>`, an event opens the page where it appears.
- The `viewHref` that `SaveToast` already gets from actions is unchanged.

---

## 6. Screen treatments

Behaviour, actions, validation, undo and redirects all stay as spec 06 defines them. Only the presentation changes.

| Screen | Treatment |
|---|---|
| Members | Tabs (Roster, Requests, All accounts), each with a count. The roster is a `DataTable` with selection and a bulk bar (status change, remove), plus filters (status, track, class year, search) and Export CSV in the header. Requests are cards with Approve and Decline. |
| Members › Add | A two-step card: paste or upload, then a preview table with a new/updated/invalid badge per row, then Add. |
| Officers | A card per tier, each listing rows of avatar, name, role, a visible switch, and up/down. The Academic year card sits in the header actions. |
| Admins | Current admins and pending invitations as tables. The invite form is a dialog. |
| Recruiting | Status card (big `StatusPill` and dates), the form card, and the season and member-count card. |
| Events | Upcoming and Past tabs. A `DataTable` with date, title, type badge, audience badge and a featured star. Row menu: Edit, Duplicate, Duplicate +1 week, Delete. |
| Photos | Home and Membership slot cards showing the three thumbnails, then a library card grid. Each card has a thumbnail cropped to its ratio and "Home 2" or "Membership 1" slot badges. |
| Sponsors, Placements | A `DataTable` with a logo cell (`SponsorMark` preview). Placements are split into "On the wall" (reorderable) and "Listed only". |
| Tracks | Three cards, one per track, each a form. |
| Announcements (C) | A `DataTable` with a Live, Scheduled or Expired pill, an audience badge, a pinned icon, and show-from and show-until dates. |
| Resources (C) | A card per section. Rows show a kind icon, title, tracks, audience, pinned, hidden and up/down. The form switches between a file drop zone and a URL field. |
| Portal settings (C) | Cards for Links (reorderable rows and an add dialog), Welcome lines and Access (two switches). |
| Analytics (E) | Range tabs (7d, 30d, 90d), "Updated N min ago" and Refresh. A KPI tile row, a trend card (SVG line with a `<details>` table), and three ranked tables. Each card loads in its own Suspense boundary. |
| Game scores | Cards for Contacts, Top 10 per game and Recent plays, each with moderation menus (§5.4). |
| History | A filter bar (person, area, date range) over a `DataTable`. Expanding a row shows a field-by-field diff (before struck through in red, after in green) and Undo. |

Forms use a single-column card, with a sticky footer bar holding Cancel and Save once the form has unsaved changes. Long forms (Officer, Event, Resource) group their fields into `CardSection`s.

---

## 7. Build phases

Each phase is its own plan and PR, implemented only when asked. Spec 06 phases 7 and 8 are delivered as phases C and E here.

| Phase | Ships | Status |
|---|---|---|
| A | Tokens, Inter, `.admin-ui`, Clerk appearance, `nav.ts`, top bar, sub-tabs, mobile sheet, UI kit, sign-in pages, Overview re-skinned on its current data | |
| B | Every existing screen re-skinned on the kit (§6), plus "View on site" (§5.5). Can split into B1 Club, B2 Website, B3 Insights. | |
| C | Spec 06 phase 7: Announcements, Resources (private Blob and `/portal/files/[id]`), Portal settings and links, migration `0006` | |
| D | Overview dashboard (§5.2), health checks (§5.3), game moderation (§5.4), ⌘K palette (§5.1) | |
| E | Spec 06 phase 8: `/admin/analytics`, the Overview visitors row, and the footer analytics notice | |

**Setup for phase E:** add `POSTHOG_PERSONAL_API_KEY` (read-only scope) and `POSTHOG_PROJECT_ID` to Vercel and `.env.local`.

---

## 8. Acceptance criteria

- [ ] Public pages (Home, About, Membership, Team, Apply, Portal, 404) are visually unchanged. Checked with before and after screenshots at 1440px and 375px.
- [ ] No `ui-*` token or `.admin-ui` rule affects anything outside `/admin`.
- [ ] The top bar shows five sections, and the active section is marked with `aria-current`. Sub-tabs list exactly that section's screens.
- [ ] Every page directory under `app/admin/(console)` appears in `nav.ts`. A test enforces this.
- [ ] Every console page still calls `requirePage()` on its first line, and every new action goes through `adminAction()` or `requireAdmin()`.
- [ ] At 375px every screen works, with no horizontal page scroll, tables collapsing to cards, and the menu sheet listing every screen.
- [ ] The palette opens with ⌘K or Ctrl+K, can be used entirely by keyboard, and record search refuses non-admins.
- [ ] Each health check links to the screen that fixes it, and one failing check doesn't hide the others.
- [ ] Deleting a game score or contact can be undone from the toast and from History.
- [ ] Text and controls meet WCAG AA contrast, focus is always visible, and status is never shown by colour alone.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` pass.

---

## 9. Open items

- **Officer anchors.** Does `/team` render per-officer anchors (`#<slug>`) for the most specific View on site link? If not, the link falls back to `/team`.
- **Dark mode.** Out of scope now. The token names allow a later `[data-theme="dark"]` set.
