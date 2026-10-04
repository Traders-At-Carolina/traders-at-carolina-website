# Spec 06 — Admin Dashboard

**Status:** Revision 2, for review · **Date:** 2026-10-03 (revision 1: 2026-10-02) · **Route:** `/admin` (not linked, not indexed) · **Depends on:** [Spec 00](00-vision-and-style.md), and the data shapes in specs [01](01-home.md)–[05](05-apply.md) · **Feeds:** Spec 09 (member portal, to be written)

This spec replaces "No CMS until the resource hub exists" (00 §12). Content that officers edit moves from `content/*.ts` into a database. Public pages stay statically cached and update within seconds of a save.

**Revision 2 decisions (2026-10-03)**

| Decision | Choice |
|---|---|
| Who is a member | An email roster kept in `/admin`, plus a request queue. Anyone who signs in with a listed, verified email is a member. |
| How much of the public site is editable | Lists and seasonal items: photos, officers, tracks, sponsors, placements, recruiting, events, and the member count. Page copy (hero, mission, principles, FAQ, headings) stays in `content/*.ts`. |
| What Save does | Goes live within seconds. Every change can be undone from the toast or from History. No drafts. |
| Portal | This spec covers the admin side and the portal's data (§8). The portal pages get their own spec (09). |
| Admin roles | One role, `admin`. It can be split into Admin and Editor later without a data change. |

---

## 1. Goal

Let the club's officers run the website, the member roster and the member portal without a developer and without a redeploy.

- **Officers** keep the public site current: recruiting dates, events, photos, sponsors, placements, tracks and the leadership roster.
- **Officers** decide who is a member, and what members and signed-in visitors see in the portal.
- **Officers** see how the site is used: which pages visitors read, what they click, how long they stay, and how many are on the site.

### Admin questions this dashboard answers

| Question | Answered by |
|---|---|
| We just accepted 40 people. How do they get member access? | Members → Add members (§6.2) |
| Someone signed up and says they're a member. How do I let them in? | Members → Requests (§6.2) |
| Seniors graduated. How do I move them to alumni? | Members → bulk actions (§6.2) |
| Applications open next week. How do I switch the site over? | Recruiting (§6.5) |
| How do I put Thursday's meeting on the site and in the portal? | Events (§6.10) |
| How do I share slides or a textbook with members only? | Resources (§6.11) |
| How do I tell members about a deadline? | Announcements (§6.12) |
| How do I put new event photos on the site? | Photos (§6.6) |
| Our VP changed roles. How do I update the Team page? | Officers (§6.3) |
| How do I rename a track or fix its description? | Tracks (§6.9) |
| We signed a sponsor. How do I add their logo? | Sponsors (§6.7) |
| A member got an offer at a new firm. Where does it go? | Placements (§6.8) |
| How do I give next year's board access? | Admins (§6.4) |
| Someone made a mistake. How do I put it back? | History (§6.16), or Undo on the save toast |
| How many people visit, what do they click, how long do they stay? | Analytics (§7) |

---

## 2. Scope

**In scope**

- Sign-in for admins, by role.
- A member roster with bulk add, an access-request queue and status changes.
- Editing these public-site collections: photos, officers, tracks, sponsors, placements.
- Editing seasonal settings: recruiting, events, the Home member count, the academic year.
- Managing portal content: events, resources, announcements, links and access rules.
- One-click undo for every change, and a full change history.
- Usage analytics, with headline metrics shown inside `/admin`.

**Out of scope**

- Draft, preview and publish workflows. Saves go live. Every editor shows a live preview where rendering matters, and every screen has a "View on site" link.
- Editing page copy. These exports stay in `content/*.ts`:
  - Home: hero, headings, pillars, `stats.foundedYear`, `stats.partnerFirms`.
  - About: header, headings, mission, vision, story, principles, advisors, timeline.
  - Membership: header, headings, steps, switching policy, activities, expectations.
  - Team: the note.
  - Apply: benefits, stages, FAQ.
  - Everything that moves to the database is listed in the "Replaces" column of §5.1.
- Nav, contact email and social links. They change rarely and stay in `content/site.ts`.
- Adding or removing tracks. The three tracks (`trading`, `research`, `development`) are fixed (03 §5).
- The Fermi question bank (stays in `lib/games/fermi.ts`), the OG image and a public announcement bar. Candidates for a later revision.
- Email from the app. The only email sent is Clerk's optional sign-up invitation (§6.2).
- The portal pages themselves, and a native internship tracker. Both belong to spec 09.
- Identifying individual visitors in analytics. Analytics are anonymous. (Exception, by choice: the membership games save scores under a random browser id, and visitors may sign in or volunteer a name; spec 03 §3.7.)

---

## 3. Architecture

| Concern | Choice | Notes |
|---|---|---|
| Auth | Clerk (Vercel Marketplace) | Public sign-up mode since 2026-10-03, for game scores and the portal. Admin is `publicMetadata.role === "admin"` only. Loaded only under `/admin`, `/account` and (spec 09) the portal. |
| Content store | Neon Postgres, via Drizzle (`@neondatabase/serverless`, HTTP driver) | Vercel Marketplace. Migrations committed in `drizzle/`. |
| Images | Vercel Blob, public store | Uploaded from the browser, straight to Blob. |
| Member files | Vercel Blob, private store | Served only through a route that checks membership (§8). |
| Analytics | PostHog | Vercel Marketplace. Captured on public pages. Queried server-side for `/admin`. |

**Read path.** Public pages read editable content only through cached getters in `lib/data/public.ts`. Each getter is wrapped in `unstable_cache` with a collection tag: `photos`, `sponsors`, `placements`, `people`, `tracks`, `recruiting`, `season`, `events`. The project does not enable `cacheComponents`, so this follows Next's caching guide for that model (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`). Pages stay statically generated.

**Write path.** Each admin form calls a server action through one wrapper, `lib/admin/action.ts`. The wrapper:

1. checks the admin session (`requireAdmin()`);
2. parses the input with zod;
3. runs the collection's validation rules against the proposed next state;
4. writes to the database;
5. records an audit entry with the item's state before and after;
6. calls `updateTag(<collection>)`.

The next visitor gets the updated page. Writes that touch several rows (reordering, slot swaps, bulk member changes) go through `db.batch([...])`, because the neon-http driver has no interactive transactions.

**Undo.** Undo writes an audit entry's `before` state back through the same wrapper, so it is validated, audited and revalidated like any save. Undoing a create deletes the item. Undoing a delete recreates it with the same id. Undo is refused, with a message, if the item has changed since that entry.

**Scheduled changes.** The `recruiting` and `events` getters also revalidate every 5 minutes. So a scheduled opening, a passed deadline in server-rendered spots, an ended event and an expired announcement all take effect without anyone saving and without a cron job. `DeadlineSwitch` still flips open → closed in the browser at the exact deadline.

**Failure behavior**

- If the database is unreachable at build, the build fails and the previous deployment stays live.
- If a regeneration fails at runtime, the last good page keeps being served.
- There is no silent fallback to seed content in production.

**Seed data.** `scripts/seed.ts` loads the current `content/*.ts` data and `public/images/**` into the database and Blob, including `site.recruiting`, `home.upcoming` and spec 09's interim `content/events.ts` (as events). It fills only empty tables, so it never overwrites admin edits, and it is safe to re-run. Once a collection is cut over, its `content/*.ts` export is seed input only, and its header comment says so.

---

## 4. Access

### 4.1 Roles

| Role | Who | Sees |
|---|---|---|
| Visitor | Anyone, signed out | The public site. |
| Signed-in visitor | Any Clerk user | The portal's signed-in content (spec 09). Can request member access. |
| Member | A Clerk user whose verified email matches a roster row with status **Active**, or **Alumni** while alumni access is on (§6.13) | Members-only portal content, in addition. |
| Admin | A Clerk user whose public metadata has `role: "admin"` | `/admin`, and everything in the portal. Counts as a member. |

Membership lives in the `members` table, not in Clerk metadata. There is one source of truth and nothing to sync. How it is resolved is in §8.

### 4.2 Sign-in

- **Admins** sign in at `/admin/sign-in`. `/admin/sign-up` is an ordinary sign-up page (sign-up is public). A new account is not an admin until another admin grants the role (§6.4).
- **Who is an admin.** A signed-in user whose live Clerk `publicMetadata.role` is `admin`, or whose verified email is listed in the `ADMIN_EMAILS` env var (comma-separated). The check reads the Clerk user on each request, so no session token customisation is needed.
- **First admin.** Put their email in `ADMIN_EMAILS`. After that, admins add each other (§6.4).

### 4.3 Enforcement

- `proxy.ts` protects `/admin/*` and `/api/admin/*`.
- Every server action and route handler re-checks with `requireAdmin()` (`lib/auth/admin.ts`).
- Pages use `requirePage()`, which redirects signed-out users and returns a 404 to signed-in non-admins.
- Layouts do not check auth (per the Next 16 authentication guide).

### 4.4 Isolation from the public site

- Clerk's provider and scripts load only under `app/admin/`, `app/account/` and the portal layout (`/portal`, spec 09). Public pages ship no Clerk JavaScript; the public corner button is a plain link to `/portal`.
- `proxy.ts` also runs on `/account/*`, `/portal/*` and `/api/games/*` so those routes can read the session. It protects only `/admin` and `/api/admin`. The portal redirects signed-out visitors to `/account/sign-in` itself.
- `/api/games/*` is a public write path: zod-validated, rate-limited per browser id and hashed IP, Fermi rescored server-side. `/admin/games` lists scores and volunteered contacts.
- Analytics exclusion: `MarkInternalBrowser` is mounted in the signed-in console layout, not on `/admin/sign-in`, so only admins are excluded from analytics.

### 4.5 Indexing

`/admin` is `noindex`, and `robots.txt` disallows it.

---

## 5. Data

Images are stored as an `ImageAsset`, which has the same shape as `StaticImageData`. Seed files with static imports still type-check, and `next/image` accepts it directly.

```ts
type ImageAsset = { src: string; width: number; height: number; blurDataURL?: string };
```

### 5.1 Tables

The first group ships in phase 2 (migrations `0001` and `0002`; the bold columns are `0002`). The rest ship with the phase that needs them.

| Table | Columns | Replaces | Phase |
|---|---|---|---|
| `photos` | id, image, alt, caption, ratio (`3:2` \| `4:5`), home_order (1–3, nullable, unique), **membership_order (1–3, nullable, unique)**, timestamps | `home.photos` (01 §6), `membership.photos` (03) | 2 |
| `tracks` | id (`trading` \| `research` \| `development`, primary key), role_label, name, description, good_fit?, sample_problem?, recommended_background[], lead_slug → people.slug | `membership.tracks` (03 §5) | 2 |
| `sponsors` | id, name (unique, case-insensitive), relationship?, url?, logo? | `about.partners` (02 §5) | 2 |
| `placements` | id, firm (unique, case-insensitive), logo?, logo_on_dark?, show_on_wall, wall_order? | `placements`, `CompanyMark`, and the PlacementWall list (04 §5) | 2 |
| `people` | id, slug (unique; fixed after creation), name, role, group (`co-president` \| `exec` \| `director` \| `track-lead`), track?, sort_order, class_year?, major?, headshot?, alt?, placement_note?, company_id → placements, linkedin?, **visible (default true)** | `team.people` (04 §5) | 2 |
| `audit_log` | id, at, actor_id, actor_email, action, entity, entity_label, **entity_id, before (jsonb), after (jsonb)**; index on (entity, entity_id, at desc) | — | 2 |
| `settings` | key (`recruiting` \| `season` \| `portal`, primary key), value (jsonb, zod-validated per key), updated_at | `site.recruiting`, `home.stats.members`, `team.academicYear` | 6 |
| `events` | id, title, type (`general-meeting` \| `workshop` \| `speaker` \| `competition` \| `social` \| `recruiting` \| `other`), starts_at, ends_at?, location?, description?, url?, audience, featured, timestamps | `home.upcoming` (01 §6), `content/events.ts` (09, interim) | 6 |
| `members` | id, email (unique, case-insensitive), name, status (`active` \| `alumni` \| `inactive`), track?, class_year?, cohort?, user_id? (unique), notes?, timestamps | — | 4 |
| `membership_requests` | id, user_id, email, name, note?, status (`pending` \| `approved` \| `declined`), decided_by?, decided_at?, created_at. At most one pending request per user. | — | 4 |
| `resources` | id, title, kind (`slides` \| `notes` \| `textbook` \| `problem-set` \| `video` \| `link`), section (`learning` \| `interview-prep` \| `recruiting` \| `other`), tracks[] (empty means all), description?, file? (`{pathname, size, contentType}`, private store), url?, audience, pinned, sort_order, hidden, timestamps | — | 7 |
| `announcements` | id, title, body, audience, pinned, show_from?, show_until?, timestamps | — | 7 |
| `portal_links` | id, label, url, description?, audience, sort_order | — | 7 |

**Audiences.** Events use `public` \| `signed_in` \| `members`. Resources, announcements and portal links use `signed_in` \| `members`. A `public` event appears on the website and in the portal; `signed_in` and `members` appear only in the portal.

**Audit actions.** Revision 1's set (`create`, `update`, `delete`, `reorder`, `grant-admin`, `revoke-admin`, `invite`, `revoke-invite`) gains `undo`, `add-members`, `update-members`, `remove-members`, `approve-request` and `decline-request`.

Audit actions are a Drizzle text enum, so adding one needs no migration.

### 5.2 Settings shapes

| Key | Fields |
|---|---|
| `recruiting` | The existing `Recruiting` type (`content/types.ts`), plus `mode`: `open` \| `closed` \| `scheduled`. `scheduled` opens applications automatically at `nextApplicationOpenDate`. |
| `season` | `academicYear?` (e.g. "2026–27"), `memberCount`: `{ mode: "auto" }` \| `{ mode: "manual", value }` \| `{ mode: "hidden" }` |
| `portal` | `alumniAccess` (default true), `acceptRequests` (default true), `welcomeMember?`, `welcomeVisitor?` |

`getApplicationState` (`lib/applications.ts`) treats `scheduled` as closed until `nextApplicationOpenDate`, then as open, still closing at `applyDeadline`.

### 5.3 Validation

- Each `lib/validate-*.ts` already has a pure `collect*Problems(...): string[]` and a throwing wrapper.
- Every rule in specs 01–05 §5 is enforced in two places:
  - **on save:** the problems come back as form errors that name the field;
  - **at render:** a failure keeps the last good page.
- Rules for uploaded files:
  - Images must be on the club's Blob host.
  - Accepted image types are JPEG, PNG and WebP, plus SVG for logos.
  - Headshots under 600px wide get a warning (04 §5), not a rejection.
  - Resource files: PDF, PowerPoint, Word, Excel, plain text and images, up to 50 MB.
- New rules:
  - Member emails are valid addresses and unique (case-insensitive).
  - An event's end is not before its start. A featured event must have audience `public`.
  - A resource has a file or a URL, not both. URLs are https.
  - An announcement's "show until" is not before its "show from".
  - Portal link URLs are https.

---

## 6. Admin screens

The admin UI uses the spec 00 tokens and the shared primitives (`Button`, `Card`, `Stat`). It is a work tool, not an editorial page: no motifs, no section numbering.

### 6.0 Conventions for every screen

- **Sidebar** in four groups: **Club** (Members, Officers, Admins), **Website** (Recruiting, Photos, Sponsors, Placements, Tracks), **Events & portal** (Events, Resources, Announcements, Portal settings), **Insights** (Analytics, Game scores, History). Overview sits above the groups.
- **Save feedback.** A toast: "Saved · live in a few seconds", with **Undo** and **View on site**.
- **Unsaved changes.** Leaving a form with unsaved changes asks first.
- **"Hidden until…" hints.** Where a public section has a threshold, the editor says so. Examples: "Inside the club needs 2 photos", "The placements list appears at 5 firms", "Home shows Upcoming only for a future featured event".
- **Live previews** where rendering matters: `PersonCard`, the `SponsorMark` mask, and photos cropped to their ratio.
- **Uploads** use one `ImageUpload` component:
  - drag and drop, or pick a file;
  - the browser reads the dimensions, downsizes to at most 2400px on the long edge, and makes a 16px blur placeholder;
  - it then uploads straight to Blob (`/api/admin/blob`);
  - HEIC files get a clear "convert to JPEG" message.
- **Reordering** uses up/down buttons, so it works by keyboard.
- **Phones.** Every screen works at phone width; tables collapse to cards.
- **Destructive actions** ask for confirmation and say what else changes.

### 6.1 Overview (`/admin`)

- **Needs attention.** Cards appear only when relevant:
  - "N membership requests waiting".
  - Recruiting status: "Open · closes in 2 days" or "Closed · opens Jan 12".
  - The next event.
  - Content warnings: headshots under 600px; public sections hidden for too few items.
- **Visitors** (phase 8): live now, visitors over the last 7 days with a sparkline, and Apply clicks over the last 7 days (§7).
- **Recent changes:** the last 10 audit entries, as "Name · action · item · time ago", each with Undo.

### 6.2 Members (`/admin/members`)

Three tabs: **Roster**, **Requests** (with a count badge), **All accounts**.

**Roster**

- Columns: name, email, status (Active / Alumni / Inactive), track, class year, cohort (e.g. "Fall 2026"), account ("Signed up" or "Not signed up yet").
- Search by name or email. Filter by status, track and class year.
- Edit a row in a side panel. Notes are visible only to admins.
- **Add members**
  - Paste one entry per line (`email` or `Name, email`), or upload a CSV with `name,email` columns and optional `track,class_year`.
  - Set defaults for the batch: status (Active), track, class year, cohort.
  - A preview lists new, already-on-roster and invalid rows before anything is saved.
  - Optional: **Email them a sign-up link.** Sends a Clerk invitation that returns to the portal. Emails that already have an account are skipped, with a note.
- **Bulk actions** on selected rows: set status, set track, set cohort, remove.
  - Year end: filter by class year, select all, **Mark alumni**.
- **Export CSV** of the current filter.

**Requests**

- A signed-in non-member taps **Request access** in the portal (spec 09). The queue shows name, email, their note and when they asked.
- **Approve:** pick a track (optional) and confirm. The person is added to the roster, already linked to their account.
- **Decline.** The portal shows them "Your request wasn't approved" until they ask again.
- When `acceptRequests` is off (§6.13), the portal hides the button and this tab says so.

**All accounts**

- Every Clerk user, game players included, with name, email, created date, last sign-in, and Member and Admin badges.
- Row actions: **Make member** (adds them to the roster, linked) and **Make admin** (§6.4).

### 6.3 Officers (`/admin/officers`)

- **Academic year** at the top (saved to `season.academicYear`). It turns the first Team tier title into "Leadership, 2026–27".
- **List.** Grouped by tier: Executive board, Co-Presidents, Directors, Track leads. Up/down buttons reorder within a tier.
- **Form fields:** name, role, tier, track (required for track leads), class year, major, headshot and alt text, placement line, company (picked from placements), LinkedIn, **Show on Team page**.
- **Show on Team page.** Lets next year's board be entered in advance and switched on at handover. Only visible officers can be picked as track leads; the form says so.
- A live `PersonCard` preview sits beside the form.
- The slug is generated from the name at creation and never changes, so `/team#slug` links keep working.
- **Delete:** asks for confirmation. If the person leads a track, the track's lead is cleared.

### 6.4 Admins (`/admin/admins`)

- Lists current admins and pending invitations.
- **Add by email.** If the email already has an account, the role is granted at once. Otherwise a Clerk invitation is sent and the role is set when they sign up.
- **Revoke** a pending invite or remove an admin. Removing keeps the account. You cannot remove yourself or the last admin.

### 6.5 Recruiting (`/admin/recruiting`)

- **Status banner.** The state right now, from `getApplicationState`, in plain words: "Open · closes Fri Oct 17 at 11:59 PM ET". Below it, every place the state appears (header Apply, Home hero, footer call to action, `/apply`), each with "View on site".
- **Fields**
  - Applications: **Open**, **Closed**, or **Scheduled** (opens automatically at the next-open date).
  - Apply form URL and "Keep me posted" form URL (Google Forms only, 05 §5).
  - Cycle label (e.g. "Fall 2026").
  - Deadline (date and time, ET). Interview window. Decision date. Next-open date.
  - Application length in minutes.
- **Reminder** beside the deadline: "At the deadline, also close the Google Form" (05 §3).

**Season card** (on the same screen)

- **Active members on Home:** **Auto** (count of Active roster members), **Manual** (a number), or **Hide**.

### 6.6 Photos (`/admin/photos`)

- **Library.** A grid of all uploaded photos. Each has alt text, a caption and a ratio, and all three are required.
- **On Home.** Slots 1–3 feed the Home "Inside the club" section (01 §6).
  - Fewer than 2 filled slots hides the section, as today. The editor says so.
- **On Membership.** Slots 1–3 feed the Membership photo bands (03): the first runs wide, the other two pair after Activities.
- A photo in a slot cannot be deleted until it is removed from the slot.

### 6.7 Sponsors (`/admin/sponsors`)

- **List and form:** name, relationship (for example "Sponsor since 2024"), URL (https), logo.
- The logo preview renders through `SponsorMark` (the single-colour mask, 02 §5), so admins see exactly what the site will show.
- A non-transparent logo shows a hint that it will render as a solid block.

### 6.8 Placements (`/admin/placements`)

- **List and form:** firm, logo for light backgrounds, logo for dark backgrounds (optional; used on officers' badges), "show on the placement wall" toggle, and wall order.
- Feeds four places:
  - the Team page firm list (04 §4.4);
  - the PlacementWall carousel on Team;
  - the footer placement strip;
  - officers' company badges.

### 6.9 Tracks (`/admin/tracks`)

- Three fixed forms, in Trading, Research, Development order.
- **Editable fields:** role label, name, description, good fit, sample problem, recommended background (2–4 items), lead (picked from visible officers).
- The 03 §5 wording rule applies: no "required" or "requirements".

### 6.10 Events (`/admin/events`)

- **Tabs:** Upcoming and Past.
- **Form fields**
  - Title.
  - Type: General meeting, Workshop, Speaker, Competition, Social, Recruiting, Other.
  - Starts (date and time, ET). Ends (optional).
  - Location. Short description. Link (RSVP or details, https).
  - **Audience:** Website and portal / Portal, anyone signed in / Portal, members only.
  - **Feature on Home** (website events only).
- **Home "Upcoming"** shows the next featured website event automatically and hides once it ends (01 §6). Nobody edits Home by hand.
- **Duplicate** copies an event; **Duplicate +1 week** handles weekly meetings.
- Competitions are events with type Competition. The portal's competitions view filters on that type (spec 09).

### 6.11 Resources (`/admin/resources`)

- **List**, grouped by section, with pinned items first, then by order.
- **Form fields**
  - Title.
  - Kind: Slides, Notes, Textbook, Problem set, Video, Link.
  - Section: Learning, Interview prep, Recruiting, Other.
  - Tracks: all, or any of the three.
  - Description.
  - **Source:** upload a file, or paste a link (for example a Google Drive link).
  - **Audience:** anyone signed in, or members only.
  - Pinned. Hidden (keeps the item without showing it).
- Uploaded files go to the private Blob store and are served through the portal's file route (§8).

### 6.12 Announcements (`/admin/announcements`)

- **Form fields:** title; short body (links and *emphasis*, the same format as the FAQ, `lib/inline-markdown.ts`); audience; pinned; show from; show until.
- Announcements outside their dates are listed as Scheduled or Expired and do not show in the portal.

### 6.13 Portal settings (`/admin/portal`)

- **Links.** Label, URL, short description and audience, reorderable. Expected first entries: the internship tracker (the club's shared Google Sheet), Slack or GroupMe, the Drive folder, the calendar.
- **Welcome lines.** One for members, one for signed-in non-members.
- **Access**
  - **Alumni keep member access** (default on).
  - **Accept access requests** (default on).

### 6.14 Analytics (`/admin/analytics`)

See §7.

### 6.15 Game scores (`/admin/games`)

Exists. Volunteered contacts, the top 10 per game and recent plays (03 §3.7).

### 6.16 History (`/admin/history`)

- Every audit entry, newest first: who, action, item, when.
- Filter by person, area and date.
- Expanding an entry shows what changed, field by field.
- **Undo** on each entry (§3).

---

## 7. Analytics

### 7.1 Capture (public pages only)

- `instrumentation-client.ts` loads `posthog-js` when the browser is idle, so LCP is unaffected.
- **Captured:** pageviews (including client-side navigations), page-leave events (for time on page), and clicks on links and buttons.
- **Not captured:** session recording and surveys are off.
- Visitors are anonymous: there are no person profiles unless identified, and the site never identifies anyone.
- The visitor ID is stored in `localStorage`, not a cookie.
- **Not tracked:**
  - `/admin`, `/account` and `/portal`, excluded by one path check in `lib/analytics/client-config.ts` (spec 09 adds `isPrivatePath`);
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

## 8. Portal data contract

Spec 09 builds the portal pages on these pieces. They are fixed here so the two specs can be built in parallel.

**Ownership.** Spec 09 creates every file in this section with exactly these signatures and exported types, using interim bodies. The admin phases later replace only the bodies, so the portal needs no changes:

| File | Interim body (spec 09) | Real body |
|---|---|---|
| `lib/members/resolve.ts` | `getMembership` returns `null`, so only admins see the member view | Phase 4 |
| `lib/members/audience.ts` | Complete: `canSee` is pure logic | — |
| `lib/members/requests.ts` | Validates and refuses; no insert | Phase 4 |
| `lib/data/portal.ts` | Reads `content/events.ts` and `site.recruiting`; other getters return empty | Phases 6 and 7 |

The portal never reads membership from Clerk metadata, not even as a stand-in.

**Viewer.** `requireViewer()` (`lib/auth/viewer.ts`) returns `{ userId, firstName, isMember, isAdmin }`.
- `isAdmin` comes from `isAdminClaims` (`lib/auth/roles.ts`).
- The verified emails are the Clerk user's addresses whose verification status is `verified`.
- `isMember = isAdmin || membership !== null`.

**Resolver.** `lib/members/resolve.ts`

```ts
type Membership = { status: "active" | "alumni"; track?: TrackId } | null;
async function getMembership(user: { id: string; verifiedEmails: string[] }): Promise<Membership>;
```

1. Find the roster row by `user_id`.
2. If none, find it by any verified email (case-insensitive) and set its `user_id`.
3. Return `null` for no row, an `inactive` row, or an `alumni` row while `alumniAccess` is off.

`getMembership` reads only the roster; the caller adds admins. It runs per request on portal pages, which are per-user and dynamic. Public pages never call it.

**Visibility.** `lib/members/audience.ts`
- Exports `canSee(audience, viewer)`, where `viewer` is `"signed_in" | "member"`.
- It returns `audience !== "members" || viewer === "member"`.
- It also exports `audienceViewer(isMember)`.
- `Audience` (`"public" | "signed_in" | "members"`) lives in `content/types.ts`.
- Every portal query filters on the server, so nothing members-only reaches a non-member's browser.

**Portal getters.** `lib/data/portal.ts`. These are uncached. Getters that depend on time take an optional `now` for tests; callers pass only the viewer.

| Getter | Returns |
|---|---|
| `portalEvents(viewer, now?)` | `ClubEvent[]`: upcoming events the viewer may see, soonest first. Competitions are `type === "competition"`. |
| `portalResources(viewer)` | `Record<ResourceSection, PortalResource[]>`, pinned first, then by order. `NO_RESOURCES` is the empty value. |
| `portalAnnouncements(viewer, now?)` | `PortalAnnouncement[]`: those within their dates, pinned first, then newest first. |
| `portalLinks(viewer)` | `PortalLink[]` in admin order. |
| `portalSettings()` | `PortalSettings`: `{ welcomeMember?, welcomeVisitor?, acceptRequests }`. The interim value has `acceptRequests: false` because there is nowhere to store a request yet. |
| `recruitingTimeline(now?)` | `{ recruiting, events }`: the recruiting settings plus upcoming `type === "recruiting"` events whose audience is `public` or `signed_in`. |
| `myRequest(userId)` | `{ status: "pending" \| "approved" \| "declined" } \| null`: the user's latest request. |

**Return shapes**

- `PortalResource`: `{ id, title, kind, tracks, description?, href, pinned }`. The getter resolves `href`: an external resource's URL, or `/portal/files/{id}` for an uploaded file. The private Blob pathname never reaches the page.
- `PortalAnnouncement`: `{ id, title, body, pinned }`. `body` is inline markdown.
- `PortalLink`: `{ id, label, url, description? }`.

**Action.** `requestMembership({ note })` (`lib/members/requests.ts`, `"use server"`)
- It calls `requireViewer()` itself. The note is trimmed to 500 characters.
- It returns `{ ok: true }` or `{ ok: false, reason }`, where `reason` is one of:
  - `"already-member"`;
  - `"requests-closed"`;
  - `"already-pending"`.
- Phase 4 adds the insert. A unique index allows at most one pending request per user.

**Files.** `/portal/files/[id]` (phase 7) checks the viewer with `getMembership` and `canSee`, then streams the private Blob object. It returns 404 when the viewer may not see the resource, so the file's existence is not revealed.

---

## 9. Members: how access works

- **Getting in.** There are two ways onto the roster:
  1. **Pre-approval.** Admins add emails after each recruiting cycle (§6.2). The person signs up with that email and is a member from their first portal visit. Nobody has to approve anything after that.
  2. **Request.** A signed-in non-member asks; an admin approves.
- **Matching.** Only **verified** emails count, compared case-insensitively. A person whose roster email differs from their sign-in email can add it as a second email in their Clerk account, or ask an admin to change the roster row.
- **Status**
  - **Active:** member access.
  - **Alumni:** member access while `alumniAccess` is on.
  - **Inactive:** treated as a non-member. The row stays for the record.
- **Changes take effect on the person's next page load.** There is no session to refresh, because membership is read per request (§8).
- **Removing** a roster row ends member access. The Clerk account stays.

---

## 10. Changes to the public site

| Area | Change |
|---|---|
| Routing | Public routes live in `app/(site)/`; the header, main and footer are in `components/SiteChrome.tsx`. URLs do not change. (Done in phase 0.) |
| Pages | Home, About, Membership, Team and Apply read their editable collections and settings from `lib/data/public.ts`. Validation runs inside the page function. |
| Recruiting | Every Apply surface reads the `recruiting` setting. Pages that show it regenerate at least every 5 minutes, so scheduled openings happen on time. The Membership games Apply button gains `DeadlineSwitch`, like the others. |
| Home | "Upcoming" comes from the next featured website event. "Active members" follows the `season` setting. |
| Membership | The photo bands read Membership photo slots instead of reusing Home's. |
| Team | Hidden officers are left out. The academic year comes from `season`. |
| Images | `next.config.ts` allows the Blob host. `PersonCard`, `InsideTheClub` and `PlacementWall` use the blur placeholder only when one exists. |
| Links | `Button`, `TextLink` and `ApplyButton` accept tracking attributes. (Done in phase 1.) |
| Footer | Adds the one-line analytics notice. |

---

## 11. Build phases

Each phase is its own implementation plan and PR. A phase is implemented only when asked.

| Phase | Ships | Status |
|---|---|---|
| 0 | Refactor with no behaviour change: `(site)` route group, `ImageAsset`, and the validator split | Done |
| 1 | Analytics capture: tracking attributes, canonical URLs. Ships early so data accumulates. | Done (footer notice still to add) |
| 2 | Infrastructure and auth shell: Clerk, Neon, Blob; `proxy.ts`, sign-in, Admins screen, schema `0001` + `0002` (undo columns, Membership photo slots, officer visibility), seed | In review (PR #26) |
| 3 | **Editor framework + Photos.** `lib/data/public.ts`, `lib/admin/action.ts`, `ImageUpload`, save toast with Undo, History, the console sidebar groups. Photos end to end with Home and Membership slots. The template for every other editor. | |
| 4 | **Members.** Roster, bulk add with optional invitations, requests, all accounts, CSV export. Fills in the `lib/members/resolve.ts` stub that spec 09 creates. | |
| 5 | **Website lists.** Sponsors → Placements → Officers (visible flag, academic year) → Tracks, each with its public page cut over. | |
| 6 | **Recruiting, season and events.** The `settings` and `events` tables, the recruiting cut-over, Home "Upcoming" from events, member-count modes, the 5-minute backstop, the games `DeadlineSwitch` fix. Replaces the interim `portalEvents` and `recruitingTimeline` bodies. | |
| 7 | **Portal content.** Resources (private Blob store and the file route), Announcements, Portal settings and links. Replaces the remaining interim bodies in `lib/data/portal.ts`. Can run alongside spec 09. | |
| 8 | **Analytics dashboard** and the Overview visitor metrics. | |

Members (phase 4) come right after the framework because the portal depends on them. Phase 5's placements work assumes the PlacementWall branch has merged (it has).

---

## 12. Setup the club must do

- [ ] Link the Vercel project, and add the Clerk, Neon and PostHog integrations, a public Blob store and a private Blob store.
- [ ] **Clerk**
  - [ ] Keep sign-up mode **Public** (games and portal need it).
  - [ ] Set `ADMIN_EMAILS` (comma-separated) to the first admin's email. Later admins are granted from the Admins screen.
- [ ] **A separate database per environment.** Site content lives in Neon, so an edit made against a shared database reaches the live site. Today Production, Preview and Development share one branch.
  - [ ] **Production** uses the main Neon branch, and nothing else does.
  - [ ] **Preview:** turn on "create a branch for each preview deployment" in the Neon Vercel integration. Each preview gets a copy of production's data. Edits there never reach the live site. Stale branches are deleted automatically.
  - [ ] **Development:** a long-lived `dev` branch for local work (`vercel env pull` sets it in `.env.local`).
  - [ ] Check the Vercel environment variables: `DATABASE_URL` and `DATABASE_URL_UNPOOLED` must differ per environment.
  - [ ] Run migrations on Preview deploys as well as Production (`vercel-build`). Each preview migrates its own branch, so schema changes are tested before they reach production.
- [ ] **A custom domain.** Clerk production instances do not run on `*.vercel.app`. Until the club has a domain, `/admin` runs on a Clerk development instance.
- [ ] **PostHog**
  - [ ] Create a personal API key with the Query Read scope only.
  - [ ] Set the project timezone to America/New_York.
  - [ ] Add an internal-traffic filter for non-production hosts.
- [ ] **After each recruiting cycle:** paste the accepted members into Members → Add members.

---

## 13. Acceptance criteria

**Access**

1. Signed out, `/admin` redirects to `/admin/sign-in`. A signed-in user without the admin role gets a 404. Every server action and `/api/admin/*` handler rejects non-admins without touching the database.
2. Public pages ship no Clerk JavaScript, and remain statically generated (`○` or ISR in the build output).
3. An admin can add a new admin by email. A user who signs up on their own is not an admin. The last admin cannot be removed, and nobody can remove themselves.

**Members**

4. Pasting a list of emails adds them to the roster after a preview that flags duplicates and invalid rows. A listed person who signs up with that email, once verified, sees members-only portal content on their first visit, with no further admin action.
5. Approving a request adds the person to the roster linked to their account. Declining shows "declined" in the portal.
6. Marking a member Alumni (with alumni access off) or Inactive, or removing them, ends their member access on their next page load.
7. Bulk "Mark alumni" on a filtered selection changes every selected row in one save, recorded as one audit entry, and is undoable as one step.

**Editing and undo**

8. Editing an officer's name or role and saving updates `/team` on the next request, with no redeploy. An audit entry records who made the change.
9. Every validation rule in specs 01–05 §5 and in §5.3 rejects a bad save with a message naming the field, and the previous content stays live.
10. Every save shows Undo. Undo restores the previous state, revalidates the page, and is itself audited. Undo is refused, with a message, if the item has changed since.
11. Uploading a 10 MB phone photo succeeds. It is downsized, renders with a blur placeholder, and causes no layout shift.
12. The Home and Membership photo pickers each allow at most 3 photos. A photo in a slot cannot be deleted.
13. A sponsor logo's admin preview matches its rendering on `/about`.
14. A hidden officer does not appear on `/team` and cannot be picked as a track lead.

**Scheduled content**

15. With recruiting set to Scheduled, the site switches from closed to open within 5 minutes of the next-open time, with no save and no redeploy. At the deadline, every Apply surface (including the Membership games button) shows closed.
16. A featured website event appears on Home and disappears after it ends, with no save. Portal-only events never appear on the public site.

**Portal data**

17. A members-only resource file URL returns 404 to signed-out users and to signed-in non-members, and serves the file to members and admins.
18. No members-only resource, event, announcement or link is present in the HTML or data sent to a non-member.

**Analytics and quality**

19. On public pages, PostHog records one pageview per navigation, a page-leave with a duration, and Apply clicks tagged with `cta`. Nothing is recorded on `/admin`, `/account`, the portal, or from a browser that has signed in to `/admin`. Visiting `/admin/sign-in` alone does not mark a browser as internal.
20. The PostHog personal key never appears in client bundles (`grep -r phx_ .next/static` finds nothing).
21. `/admin/analytics` renders with PostHog misconfigured, showing per-section notices instead of an error page.
22. Lighthouse (mobile) on public pages stays ≥ 95 in all categories, LCP < 2.0s and CLS < 0.05 (00 §1).
23. Admin screens meet WCAG 2.2 AA and work at phone width:
    - every control is labelled;
    - reorder works by keyboard;
    - form errors are announced.

---

## 14. Open items

- [ ] Whether the club has (or will register) a custom domain. This decides the Clerk production setup.
- [ ] Who the first admins are.
- [ ] Whether alumni should keep member access by default (this spec assumes yes).
- [ ] **Clerk sign-up mode.** It is currently Restricted in the Clerk dashboard. This spec and spec 09 assume Public. While it stays Restricted, only invited people can have accounts, so the non-member portal, Request access and account-linked game scores work only for them.
- [ ] Spec 09: the portal pages for members and signed-in non-members, built on §8 (drafted on `claude/portal-page-design-c96b48`).
- [ ] Later revisions: page copy editing, contact and socials, the Fermi question bank, an Editor role.
