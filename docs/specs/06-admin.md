# Spec 06 — Admin Dashboard

**Status:** Draft, for review · **Date:** 2026-10-02 · **Route:** `/admin` (not linked, not indexed) · **Depends on:** [Spec 00](00-vision-and-style.md), and the data shapes in specs [01](01-home.md), [02](02-about.md), [03](03-membership.md) and [04](04-team.md)

This spec replaces "No CMS until the resource hub exists" (00 §12). Content that officers edit moves from `content/*.ts` into a database. Public pages stay statically cached and update within seconds of a save.

---

## 1. Goal

Let the club's officers keep the site current and see how it is used, without a developer and without a redeploy.

- **Officers** add club photos, edit track copy, add sponsors and placements, and keep the leadership roster correct as people join, change roles and graduate.
- **Officers** see which pages visitors read, what they click, how long they stay, and how many people are on the site.

### Admin questions this dashboard answers

| Question | Answered by |
|---|---|
| How do I put new event photos on the site? | Photos (§6.2) |
| Our VP changed roles. How do I update the Team page? | Officers (§6.3) |
| How do I rename a track or fix its description? | Tracks (§6.4) |
| We signed a sponsor. How do I add their logo? | Sponsors (§6.5) |
| A member got an offer at a new firm. Where does it go? | Placements (§6.6) |
| How do I give next year's board access? | Admins (§6.7) |
| How many people visit, what do they click, how long do they stay? | Analytics (§7) |

---

## 2. Scope

**In scope**

- Invite-only sign-in for admins.
- Editing five content collections: photos, officers, tracks, sponsors, placements.
- Usage analytics, with headline metrics shown inside `/admin`.
- A minimal change log (who changed what, and when).

**Out of scope**

- Draft, preview and publish workflows. Saves go live. Every editor shows a live preview, and every page has a "View on site" link.
- Adding or removing tracks. The three tracks (`trading`, `research`, `development`) are fixed (03 §5).
- Editing page copy such as hero text, FAQ, mission and principles. That copy stays in `content/*.ts`.
- Recruiting configuration (`content/site.ts` `recruiting`). It is a candidate for a later revision.
- A public gallery page. The photo library is built so one can be added later with its own spec.
- Identifying individual visitors. Analytics are anonymous.

---

## 3. Architecture

| Concern | Choice | Notes |
|---|---|---|
| Admin auth | Clerk, invite-only (Restricted sign-up mode) | Vercel Marketplace. Loaded only under `/admin`. |
| Content store | Neon Postgres, via Drizzle (`@neondatabase/serverless`, HTTP driver) | Vercel Marketplace. Migrations committed in `drizzle/`. |
| Images | Vercel Blob (public store) | Uploaded from the browser, straight to Blob. |
| Analytics | PostHog | Vercel Marketplace. Captured on public pages. Queried server-side for `/admin`. |

**Read path.** Public pages read content only through cached getters in `lib/data/public.ts`. Each getter is wrapped in `unstable_cache` with a collection tag (`photos`, `sponsors`, `placements`, `people`, `tracks`). Pages stay statically generated.

**Write path.** Each admin form calls a server action through one wrapper, `lib/admin/action.ts`. The wrapper:

1. checks the admin session;
2. parses the input with zod;
3. runs the collection's validation rules against the proposed next state;
4. writes to the database;
5. records an audit entry;
6. calls `updateTag(<collection>)`.

The next visitor gets the updated page.

**Failure behavior**

- If the database is unreachable at build, the build fails and the previous deployment stays live.
- If a regeneration fails at runtime, the last good page keeps being served.
- There is no silent fallback to seed content in production.

**Seed data.** `scripts/seed.ts` loads the current `content/*.ts` data and `public/images/**` into the database and Blob. It is safe to re-run. Once a collection is cut over, its `content/*.ts` file is seed input only, and its header comment says so.

---

## 4. Access

- **Sign-in.** `/admin/sign-in` and `/admin/sign-up`, using Clerk's components. Sign-up only works from an invitation link.
- **Who is an admin.** A Clerk user whose public metadata has `role: "admin"`. Invitations set it.
- **Enforcement**
  - `proxy.ts` protects `/admin/*` and `/api/admin/*`.
  - Every server action and route handler re-checks with `requireAdmin()` (`lib/auth/admin.ts`).
  - Pages use `requirePage()`, which redirects signed-out users and returns a 404 to signed-in non-admins.
  - Layouts do not check auth (per the Next 16 authentication guide).
- **Isolation from the public site**
  - Clerk's provider and scripts load only under `app/admin/`. Public pages ship no Clerk JavaScript.
  - Public routes move into an `app/(site)/` route group. URLs do not change.
- **Indexing.** `/admin` is `noindex`, and `robots.txt` disallows it.
- **First admin.** Bootstrapped by hand in the Clerk dashboard. After that, admins invite each other (§6.7).

---

## 5. Data

Images are stored as an `ImageAsset`, which has the same shape as `StaticImageData`. Seed files with static imports still type-check, and `next/image` accepts it directly.

```ts
type ImageAsset = { src: string; width: number; height: number; blurDataURL?: string };
```

| Table | Columns | Replaces |
|---|---|---|
| `photos` | id, image, alt, caption, ratio (`3:2` \| `4:5`), home_order (1–3, nullable, unique), timestamps | `home.photos` (01 §6) |
| `tracks` | id (`trading` \| `research` \| `development`, primary key), role_label, name, description, good_fit?, sample_problem?, recommended_background[], lead_slug → people.slug | `membership.tracks` (03 §5) |
| `sponsors` | id, name (unique, case-insensitive), relationship?, url?, logo? | `about.partners` (02 §5) |
| `placements` | id, firm (unique, case-insensitive), logo?, show_on_wall, wall_order? | `placements`, `CompanyMark`, and the PlacementWall list (04 §5) |
| `people` | id, slug (unique; fixed after creation), name, role, group, track?, sort_order, class_year?, major?, headshot?, alt?, placement_note?, company_id → placements, linkedin? | `team.people` (04 §5) |
| `audit_log` | id, at, actor_id, actor_email, action, entity, entity_label | — |

**Validation**

- Each `lib/validate-*.ts` is split into two parts:
  - a pure `collect*Problems(...): string[]`;
  - the existing throwing wrapper.
- Every rule in specs 01–04 §5 is enforced in two places:
  - **on save:** the problems come back as form errors;
  - **at render:** a failure keeps the last good page.
- New rules for uploaded files:
  - Images must be on the club's Blob host.
  - Accepted types are JPEG, PNG and WebP, plus SVG for logos.
  - Headshots under 600px wide get a warning (04 §5), not a rejection.

---

## 6. Admin screens

The admin UI uses the spec 00 tokens and the shared primitives (`Button`, `Card`, `Stat`). It is a work tool, not an editorial page: no motifs, no section numbering. Every list screen has a "View on site" link to the page it feeds.

### 6.1 Overview (`/admin`)

- Live visitors, visitors over the last 7 days (with a sparkline), and Apply clicks over the last 7 days. These come from §7.
- **Recent changes:** the last 10 audit entries, as "Name · action · item · time ago".
- Quick links to each editor.

### 6.2 Photos (`/admin/photos`)

- **Library.** A grid of all uploaded photos. Each has alt text, a caption and a ratio, and all three are required.
- **On Home.** Slots 1–3 feed the Home "Inside the club" section (01 §6).
  - Fewer than 2 filled slots hides the section, as today. The editor says so.
  - A photo in a Home slot cannot be deleted until it is removed from the slot.
- **Upload**
  - The browser reads the dimensions, downsizes images to at most 2400px on the long edge, and makes a 16px blur placeholder.
  - It then uploads straight to Blob.
  - HEIC files get a clear "convert to JPEG" message.

### 6.3 Officers (`/admin/officers`)

- **List.** Grouped by tier: Executive board, Co-Presidents, Directors, Track leads. Up/down buttons reorder within a tier.
- **Form fields:** name, role, tier, track (required for track leads), class year, major, headshot and alt text, placement line, company (picked from placements), LinkedIn.
- A live `PersonCard` preview sits beside the form.
- The slug is generated from the name at creation and never changes, so `/team#slug` links keep working.
- **Delete:** asks for confirmation. If the person leads a track, the track's lead is cleared.

### 6.4 Tracks (`/admin/tracks`)

- Three fixed forms, in Trading, Research, Development order.
- **Editable fields:** role label, name, description, good fit, sample problem, recommended background (2–4 items), lead (picked from officers).
- The 03 §5 wording rule applies: no "required" or "requirements".

### 6.5 Sponsors (`/admin/sponsors`)

- **List and form:** name, relationship (for example "Sponsor since 2024"), URL (https), logo.
- The logo preview renders through `SponsorMark` (the single-colour mask, 02 §5), so admins see exactly what the site will show.
- A non-transparent logo shows a hint that it will render as a solid block.

### 6.6 Placements (`/admin/placements`)

- **List and form:** firm, logo (optional), "show on the placement wall" toggle, and wall order.
- Feeds three places:
  - the Team page firm list (04 §4.4);
  - the PlacementWall carousel;
  - officers' company badges.

### 6.7 Admins (`/admin/admins`)

- Lists current admins and pending invitations.
- **Invite by email.** The invitation sets the admin role.
- **Revoke** a pending invite or remove an admin. You cannot remove yourself or the last admin.

### 6.8 Analytics (`/admin/analytics`)

See §7.

---

## 7. Analytics

### 7.1 Capture (public pages only)

- `instrumentation-client.ts` loads `posthog-js` when the browser is idle, so LCP is unaffected.
- **Captured:** pageviews (including client-side navigations), page-leave events (for time on page), and clicks on links and buttons.
- **Not captured:** session recording and surveys are off.
- Visitors are anonymous: there are no person profiles unless identified, and the site never identifies anyone.
- The visitor ID is stored in `localStorage`, not a cookie.
- **Not tracked:**
  - `/admin`;
  - any browser that has signed in to `/admin` (an internal flag is set there);
  - visitors with Do Not Track or Global Privacy Control enabled.
- **Proxy.** Events go through a same-origin path (`/rp/*`, via `next.config.ts` rewrites) so ad blockers don't drop them. This needs `skipTrailingSlashRedirect`, so each page sets `alternates.canonical`.
- **Named clicks.** Key links carry `data-ph-capture-attribute-cta`, `-target` and `-placement` (see `lib/analytics/attributes.ts`). This covers Apply buttons, nav and footer links, sponsor links and LinkedIn links, so reports read "Apply · header" rather than raw element text.
- **Notice.** The footer gets one line saying the site uses privacy-respecting analytics. There is no consent banner (US student audience; no cookies).

### 7.2 Dashboard (`/admin/analytics`)

- **Range:** 7, 30 or 90 days (`?range=`). The page shows "Updated N min ago", a Refresh button and "Open in PostHog".
- **KPI row:** live now (last 5 minutes), visitors, pageviews, average session length, bounce rate, DAU / WAU / MAU.
- **Trend:** daily visitors and pageviews, as a hand-built SVG line. It uses brand colours only and includes a data table in a `<details>` element.
- **Top pages:** views, visitors, and median time on page.
- **Top clicks:** grouped by CTA and target.
- **Top referrers:** domain and channel.
- **Failure handling**
  - Each section loads on its own.
  - If PostHog is unreachable or not configured, the affected section says so and the page still renders.
- **Data**
  - Queries run server-side against PostHog's Query API with a read-only personal key that never reaches the browser.
  - Results are cached for 5 minutes (1 minute for "live now").
  - Only production traffic is counted.

---

## 8. Changes to the public site

| Area | Change |
|---|---|
| Routing | Public routes move into `app/(site)/`; the header, main and footer move into `components/SiteChrome.tsx`. URLs do not change. |
| Pages | Home, About, Membership and Team read their editable collections from `lib/data/public.ts`. Validation moves inside the page function. |
| Images | `next.config.ts` allows the Blob host. `PersonCard`, `InsideTheClub` and `PlacementWall` use the blur placeholder only when one exists. |
| Links | `Button`, `TextLink` and `ApplyButton` accept tracking attributes. |
| Footer | Adds the one-line analytics notice. |
| Recruiting state | `now={new Date()}` is evaluated whenever a page regenerates after a save, not only at deploy. |

---

## 9. Build phases

Each phase is its own implementation plan and PR. A phase is implemented only when asked.

| Phase | Ships |
|---|---|
| 0 | Refactor with no behaviour change: `(site)` route group, `ImageAsset`, and the validator split |
| 1 | Analytics capture: tracking attributes, footer notice, canonical URLs. It ships early so data accumulates. |
| 2 | Infrastructure and auth shell: Clerk, Neon, Blob; `proxy.ts`, sign-in, Admins screen, schema, migration, seed |
| 3 | Photos end to end. This is the template for the other editors. |
| 4 | Sponsors → Placements → Officers → Tracks |
| 5 | Analytics dashboard and overview metrics |

Phase 4's placements work assumes the PlacementWall branch has merged. If it hasn't, placements feed only the firm list and company badges.

---

## 10. Setup the club must do

- [ ] Link the Vercel project, and add the Clerk, Neon and PostHog integrations and a public Blob store.
- [ ] **Clerk**
  - [ ] Set Restricted sign-up mode.
  - [ ] Add `{"metadata":"{{user.public_metadata}}"}` to the session token.
  - [ ] Invite the first admin.
- [ ] **A custom domain.** Clerk production instances do not run on `*.vercel.app`. Until the club has a domain, `/admin` runs on a Clerk development instance.
- [ ] **PostHog**
  - [ ] Create a personal API key with the Query Read scope only.
  - [ ] Set the project timezone to America/New_York.
  - [ ] Add an internal-traffic filter for non-production hosts.

---

## 11. Acceptance criteria

1. Signed out, `/admin` redirects to `/admin/sign-in`. A signed-in user without the admin role gets a 404. Every server action and `/api/admin/*` handler rejects non-admins without touching the database.
2. Public pages ship no Clerk JavaScript, and remain statically generated (`○` or ISR in the build output).
3. Editing an officer's name or role and saving updates `/team` on the next request, with no redeploy. An audit entry records who made the change.
4. Every validation rule in specs 01–04 §5 rejects a bad save with a message naming the field, and the previous content stays live.
5. Uploading a 10 MB phone photo succeeds. It is downsized, renders with a blur placeholder, and causes no layout shift.
6. The Home photo picker allows at most 3 photos. A photo on Home cannot be deleted.
7. A sponsor logo's admin preview matches its rendering on `/about`.
8. An admin can invite a new admin by email. The invitee can sign up only through the invitation. The last admin cannot be removed.
9. On public pages, PostHog records one pageview per navigation, a page-leave with a duration, and Apply clicks tagged with `cta`. Nothing is recorded on `/admin` or from a browser that has signed in to `/admin`.
10. The PostHog personal key never appears in client bundles (`grep -r phx_ .next/static` finds nothing).
11. `/admin/analytics` renders with PostHog misconfigured, showing per-section notices instead of an error page.
12. Lighthouse (mobile) on public pages stays ≥ 95 in all categories, LCP < 2.0s and CLS < 0.05 (00 §1).
13. Admin screens meet WCAG 2.2 AA:
    - every control is labelled;
    - reorder works by keyboard;
    - form errors are announced.

---

## 12. Open items

- [ ] Whether the club has (or will register) a custom domain. This decides the Clerk production setup.
- [ ] Whether recruiting configuration (open/closed, deadline, form URL) should move into `/admin` in a later revision.
- [ ] Who the first admins are.
