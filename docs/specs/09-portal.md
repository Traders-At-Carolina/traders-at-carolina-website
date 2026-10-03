# Spec 09 — Portal

**Status:** Implemented (on interim data) · **Date:** 2026-10-03 · **Revised:** 2026-10-03 (aligned with spec 06 revision 2 §8) · **Route:** `/portal` (signed in only; not in the nav, not indexed) · **Depends on:** [Spec 00](00-vision-and-style.md), [Spec 03](03-membership.md), [Spec 05 §4.3](05-apply.md), [Spec 06 §8–§9](06-admin.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there. This spec **amends** specs 00, 01 and 05 where §8 says so; where an older spec conflicts with this one, this one wins.

> **Data source:** this portal reads all of its data through the getters in spec 06 §8. That contract is fixed in spec 06 revision 2, on branch `claude/admin-page-planning-02db0e`, commit `77486d0` or later.
> - Until spec 06 phases 4, 6 and 7 ship, those getters have interim bodies (§5.4). The portal itself won't need to change when they're replaced.
> - Membership never comes from Clerk metadata, not even as a stand-in.

---

## 1. Goal

Give everyone who signs in somewhere to land. People who aren't members yet see what they need to join: when we recruit, how our interview works, what's coming up, the tracks and the club itself. Those already in the club can ask for member access. Members see their own resources first: learning material, member links (the community internship tracker first) and, later, competitions.

### Questions this page answers

| Who | Question | Answered by |
|---|---|---|
| Not yet a member | When can I apply, and what happens after? | Recruiting (§4.2) |
| Not yet a member | What is the interview like, and how do I prepare? | Interview prep (§4.3) |
| Not yet a member, but in the club | How do I get member access? | Request access (§4.1) |
| Anyone | What's new, and what's coming up? | Announcements (§4.0), Upcoming (§4.4) |
| Anyone | Which track fits me? What does the club do? | Tracks (§4.5), The club (§4.6) |
| Member | Where are the slides, notes and textbooks? | Learning (§4.7) |
| Member | Where is the internship tracker? Where are competitions? | Member tools (§4.8) |

---

## 2. Access and status

- **Sign-in.**
  - `/portal` is for signed-in users only. A signed-out request gets a 307 to `/account/sign-in?redirect_url=%2Fportal`, and the visitor comes back after signing in or up.
  - Clerk must be in Public sign-up mode (spec 06 §4.2). In Restricted mode only invited people can have accounts, so the non-member portal and Request access only work for them (spec 06 §14).
- **Entry point.**
  - The circular corner button on every public page goes to `/portal`. It used to go to `/admin/sign-in`, which still works directly.
  - It is a plain `<a>`, not `next/link`. Public pages run no Clerk JavaScript, so the session token goes stale after about 60 seconds. A full page load lets Clerk refresh it; a client-side navigation would arrive looking signed out.
  - It is hidden on `/portal`.
- **Viewer.** `requireViewer()` (`lib/auth/viewer.ts`) returns `{ userId, firstName, isMember, isAdmin }` and nothing else from the Clerk user.
  - `isAdmin` comes from the session claims (`isAdminClaims`).
  - `isMember = isAdmin || getMembership({ id, verifiedEmails }) !== null`, where `verifiedEmails` are the account's verified email addresses only (spec 06 §8).
  - Membership is never read from Clerk metadata.
- **Roster stub.** This spec owns `lib/members/resolve.ts` and `lib/members/audience.ts`, with spec 06 §8's exact signatures.
  - `getMembership` returns `null` until spec 06 phase 4 adds the roster, so **until then only admins see the member view.** Phase 4 replaces the body only.
  - `canSee(audience, viewer)` is complete now. `viewer` is `"signed_in"` or `"member"`, and only `members` items are restricted.
- **Server-side filtering.** Every getter filters with `canSee` on the server, so nothing members-only reaches a non-member's browser.
- **Isolation.** Clerk's provider loads under `app/(site)/portal/` as well as `/admin` and `/account`. The rest of the `(site)` group stays static and ships no Clerk JavaScript. `/portal` is rendered per request.
- **Checks.** `proxy.ts` runs on `/portal/*` so the page can read the session, but doesn't protect it. The page and the `requestMembership` server action each call `requireViewer()` themselves.

---

## 3. Page structure

| # | Not yet a member | Member |
|---|---|---|
| — | `SiteHeader` | `SiteHeader` |
| — | `PageHeader` with account row and Request access (§4.1) | `PageHeader` with account row (§4.1) |
| — | Announcements, when there are any (§4.0) | Announcements, when there are any (§4.0) |
| 01 | Recruiting (§4.2) | Learning (§4.7) |
| 02 | Interview prep (§4.3) | Member tools (§4.8) |
| 03 | Upcoming (§4.4) | Upcoming (§4.4) |
| 04 | Tracks (§4.5) | Interview prep (§4.3) |
| 05 | The club (§4.6) | Tracks (§4.5) |
| 06 | — | The club (§4.6) |
| — | `SiteFooter` (07) | `SiteFooter` (07) |

- All sections are bone. The order puts what each reader acts on first.
- Numbering is sequential for whatever renders (`numberSections`, 00 §7.1). The order comes from one pure function, `portalSections(viewer)` (`lib/portal.ts`).
- Announcements are an `<aside>`, not a numbered section. The footer is the same as on every other page (07).

---

## 4. Sections

### 4.0 Announcements

- From `portalAnnouncements(viewer)`: announcements within their show dates, pinned first, then newest.
- A white band with hairlines above and below, sitting between the header and § 01. Each announcement shows its title (Georgia, H3 size) and body (inline markdown: links and *emphasis*, via `InlineMarkdown`).
- Renders nothing when there are none. That is the case today; announcements arrive in spec 06 phase 7.

### 4.1 Page header

- `PageHeader` (00 §10), random-walk art (seed 909), eyebrow `PORTAL`.
- **H1:** "Welcome, {first name}." Just "Welcome." when the account has no first name.
- **Lead:** the admin's welcome line from `portalSettings()`, if set (`welcomeMember` or `welcomeVisitor`). Otherwise the working copy in `content/portal.ts`.
- **Account row** (children slot, so it shows on mobile, where the art column is hidden):
  - Clerk's `UserButton` (manage account, sign out to `/`).
  - "Signed in · Member" or "Signed in · Not yet a member".
  - An "Admin" link for admins.
- **Request access** shows under the account row for non-members, only while `portalSettings().acceptRequests` is on. It is off until spec 06 phase 4. The state comes from `myRequest(userId)`:

| Latest request | Shows |
|---|---|
| None | Prompt ("Already in the club? Ask for member access and an officer will confirm it."), optional note (max 500 characters), "Request access" button |
| Pending | "Your request is in. An officer will review it soon." No form. |
| Declined | "Your request wasn't approved. If you think that's a mistake, you can ask again.", then the form |

  Submitting calls `requestMembership({ note })` (spec 06 §8). On success it shows the pending line. On refusal it shows one line saying why: requests are closed, the person is already a member, or they've already asked (`already-pending`, possible once phase 4 enforces one pending request per user). An approved request with no roster row (the person was later removed) shows the prompt again.

### 4.2 Recruiting (§ 01, non-members only)

- The `/apply` process rail (`Process`, 05 §4.3), with eyebrow `RECRUITING`, H2 working copy "When we recruit." and the same lead as `/apply`.
- Dates and state come from `recruitingTimeline().recruiting`, evaluated per request, so there is no `DeadlineSwitch`.
- Under the rail, in this order:
  1. One secondary `Button` with `/apply`'s action. An on-page anchor such as `#faq` becomes `/apply#faq`.
  2. **Recruiting events** (`recruitingTimeline().events`, `type === "recruiting"`) as event cards, when there are any.
  3. **Recruiting resources** (`portalResources(viewer).recruiting`) as a link list, when there are any.

### 4.3 Interview prep (§ 02 or § 04)

This prepares people for **the club's own interview**, not firm interviews.

- `SectionHeader`: eyebrow `INTERVIEW PREP`, H2 working copy "How our interview works.", lead from `portal.interviewPrep.lead`.
- Three columns divided by hairlines from 1024px, stacked below:
  - **What to expect:** one paragraph.
  - **What we look for:** 2–5 items.
  - **How to prepare:** 2–5 numbered steps, with internal links to the games (`/membership#games`) and to the tracks on this page (`#tracks`).
- **Practice material:** the `interview-prep` resources section, shown under the columns once an admin posts some.

### 4.4 Upcoming (§ 03)

- `SectionHeader`: eyebrow `UPCOMING`, H2 working copy "Competitions and events.", no lead.
- From `portalEvents(viewer)`: upcoming events the viewer may see, soonest first. An event stays upcoming through the end of its last day in Eastern time.
- **Recruiting events:** non-members see them in the timeline (§4.2), so Upcoming leaves them out (`upcomingForViewer`, `lib/portal.ts`). Members see no timeline, so they get them here.
- Each is an `EventCard` (shared with Home's Upcoming card, 01 §3.4):
  - type label: General meeting, Workshop, Speaker event, Competition, Social, Recruiting or Event;
  - title;
  - when (`Thu, Oct 16 · 7:00 PM`, plus `–8:30 PM` for a same-day end, or a range across days);
  - location, if set;
  - description;
  - a "Details" link to the event's https url, if set.
- Three columns from 1024px, two from 768px, one below.
- **Empty state:** "Nothing scheduled right now. New competitions and events show up here first."

### 4.5 Tracks (§ 04 or § 05)

- The `/membership` Tracks section (03 §3.3), reused as-is. `#tracks` and the track anchors work on this page too.

### 4.6 The club (§ 05 or § 06)

- The `/membership` Activities table (03 §3.4), reused with eyebrow `THE CLUB` and the club mission as its lead.
- Under it, a row of links to About, Membership and Team (`portal.clubLinks`).

### 4.7 Learning (§ 01, members only)

- `SectionHeader`: eyebrow `LEARNING`, H2 working copy "Slides, notes and textbooks.", lead from `portal.learning.lead`.
- Three columns from `portalResources(viewer)`, pinned first within each:

| Column | Resources |
|---|---|
| Slides | `learning` section, kind `slides` |
| Notes | `learning` section, kind `notes` |
| Resources and textbooks | `learning` section, kinds `textbook`, `problem-set`, `video` and `link`; then the whole `other` section |

- Each resource is a link that opens in a new tab: its url, or `/portal/files/{id}` for an uploaded file (spec 06 §8). The caption lists its tracks; none means all tracks.
- **Empty state, per column:** "Nothing posted yet." This is the state until spec 06 phase 7.

### 4.8 Member tools (§ 02, members only)

- `SectionHeader`: eyebrow `MEMBER TOOLS`, H2 working copy "Tracker and competitions.", no lead.
- Cards, two per row from 768px:
  1. **One card per member link** from `portalLinks(viewer)`, in admin order: the internship tracker (a shared Google Sheet in v1), Slack or GroupMe, the Drive folder, the calendar. Each card has the label as a link opening in a new tab, plus its description. With no links yet, one card says where the internship tracker will be ("Link coming soon.").
  2. **Competitions:** "Coming soon." It will link to `/portal/competitions` once that page is specced. Competitions are events with `type === "competition"`.

---

## 5. Data

### 5.1 `content/portal.ts`: public copy only

Holds the leads, headings, interview-prep copy (DRAFT), the empty-state lines, the member-links placeholder, the Request access copy and the club links (shape in `content/types.ts` `PortalContent`). Build-time validation (`lib/validate-portal.ts`) checks three things:
- no empty strings;
- `lookFor` and `prepare` have 2–5 items each, `clubLinks` 1–4;
- **every link is internal** (starts with `/` or `#`). The repository is public, so a member URL must never be committed.

### 5.2 `content/events.ts`: interim events

The shape matches spec 06's `events` table, so phase 6 seeds it with a straight copy:

```ts
type ClubEvent = {
  title: string;
  type: "general-meeting" | "workshop" | "speaker" | "competition" | "social" | "recruiting" | "other";
  startsAt: string;      // "YYYY-MM-DDTHH:mm", America/New_York
  endsAt?: string;       // same format, not before startsAt
  location?: string;
  description?: string;
  url?: string;          // https only
  audience: "public" | "signed_in" | "members";
  featured: boolean;     // only valid with audience "public"
};
```

Home's Upcoming card shows the next **featured public** event, the same rule spec 06 phase 6 keeps. Validation lives in `lib/validate-events.ts`.

### 5.3 Spec 06 §8 contract, as the portal uses it

| Piece | Used for |
|---|---|
| `getMembership(user)` (`lib/members/resolve.ts`, owned here) | `requireViewer().isMember`, with admins counted as members |
| `canSee(audience, viewer)` (`lib/members/audience.ts`, owned here) | Every getter's filter |
| `portalEvents(viewer)` | Upcoming (§4.4) |
| `portalResources(viewer)` | Learning (`learning` and `other`), Interview prep (`interview-prep`), Recruiting (`recruiting`) |
| `portalAnnouncements(viewer)` | Announcements (§4.0) |
| `portalLinks(viewer)` | Member tools cards (§4.8) |
| `portalSettings()` | Welcome lines and whether Request access shows |
| `recruitingTimeline()` | Recruiting rail and recruiting events (§4.2) |
| `myRequest(userId)` | Request access state (§4.1) |
| `requestMembership({ note })` (`lib/members/requests.ts`) | The Request access form |
| `/portal/files/[id]` (spec 06 phase 7) | Links to uploaded resources |

### 5.4 Interim bodies, until spec 06 ships each phase

| Piece | Today | Replaced by |
|---|---|---|
| `getMembership` | Returns `null`: only admins are members | Phase 4 (roster) |
| `requestMembership`, `myRequest` | Refuses (requests off) / `null` | Phase 4 (requests) |
| `portalSettings` | `{ acceptRequests: false }`, no welcome lines | Phase 7 (portal settings) |
| `portalEvents`, `recruitingTimeline` | `content/events.ts` and `content/site.ts` | Phase 6 (events and recruiting) |
| `portalLinks` | The internship tracker alone, from the server-only `INTERNSHIP_TRACKER_URL` (https), members only | Phase 7 (portal links) |
| `portalResources`, `portalAnnouncements` | Empty | Phase 7 |

---

## 6. Content the club must supply

- [ ] Interview prep: confirm "What to expect", "What we look for" and "How to prepare" (DRAFT in `content/portal.ts`).
- [ ] Events and competitions for `content/events.ts`. These move to `/admin/events` in phase 6.
- [ ] The internship tracker spreadsheet, shared with UNC accounts only. Set its URL as `INTERNSHIP_TRACKER_URL` in Vercel until phase 7. A link is not a lock.
- [ ] Learning material, announcements and member links. These need spec 06 phase 7.

---

## 7. SEO, analytics and privacy

- `robots: { index: false, follow: false }` on the route, `/portal` disallowed in `robots.txt`, not in the sitemap. The page title is "Portal".
- **Not tracked by analytics.** `isPrivatePath` (`lib/analytics/client-config.ts`) excludes `/admin`, `/account` and `/portal` (spec 06 §7.1), so member link URLs never reach PostHog.

---

## 8. Amendments to earlier specs

| Spec | Section | Change |
|---|---|---|
| 00 | §1 "Later" | The resource hub is partly in scope: interview prep and events live in `/portal` for signed-in users. |
| 00 | §11 | `/portal` exists: signed in, not in the nav, not indexed. The corner button links to it. |
| 00 | §12 Rendering | `/portal` is rendered per request, like `/admin`. Every other public page stays static. |
| 01 | §3.4, §6 | The Upcoming card shows the next featured public event from `content/events.ts`. `HomeContent.upcoming` is removed. |
| 05 | §4.3 | `Process` takes optional `index`, `eyebrow`, `title`, `id` and `action` props so the portal can reuse it. `/apply` output is unchanged. |
| 06 | — | No edits here. Spec 06 revision 2 already records the contract, the stub ownership, the analytics exclusion and the sign-up dependency. |

---

## 9. Open items

- **Spec 06 phases 4, 6 and 7** fill in the interim bodies (§5.4) without portal changes.
- **Clerk sign-up mode** must be Public for the non-member portal and Request access (spec 06 §14).
- **Competitions page:** its own spec, at `/portal/competitions`, built from `type === "competition"` events.
- **The member's own track** (`Membership.track`) could lead Tracks and Learning captions once phase 4 returns it.
- **Footer CTA on the portal:** the footer is the same everywhere (07), so members also see the Apply band. Revisit if it reads oddly.

---

## 10. Acceptance criteria

1. Signed out, `/portal` responds 307 to `/account/sign-in?redirect_url=%2Fportal`, and signing in or up returns to `/portal`.
2. A signed-in user who is neither an admin nor on the roster sees Recruiting, Interview prep, Upcoming, Tracks and The club, numbered § 01–§ 05. Their HTML contains no Learning, Member tools or member link.
3. An admin, or anyone `getMembership` recognises, sees Learning, Member tools, Upcoming, Interview prep, Tracks and The club, numbered § 01–§ 06, and no Recruiting. A Clerk `role: "member"` grants nothing.
4. Admins see an "Admin" link to `/admin`; nobody else does.
5. Every item with `audience: "members"` is filtered out on the server for non-members.
6. Request access shows only for non-members while requests are on, and follows the none / pending / declined states in §4.1.
7. Announcements appear above § 01 only when there are some.
8. The corner button on every public page is `<a href="/portal">` and is absent on `/portal`. Public pages load no Clerk JavaScript.
9. `next build` lists `/portal` as dynamic and every other `(site)` page as static.
10. Bad content fails the build: a malformed or backwards event time, a non-https event url, a featured non-public event, an external link in `content/portal.ts`, or list sizes outside §5.1.
11. `/portal` is `noindex`, disallowed in `robots.txt`, absent from the sitemap, and never sent to analytics (nor is `/account`).
