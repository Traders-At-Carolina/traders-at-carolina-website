# Spec 07 — Footer (site-wide closing section)

**Status:** Draft, awaiting review · **Date:** 2026-10-02 · **Route:** every page (rendered once by `app/layout.tsx`) · **Depends on:** [Spec 00](00-vision-and-style.md), [Spec 01 §5](01-home.md), [Spec 04 §4.1](04-team.md), [Spec 05 §3](05-apply.md)

All tokens, type roles, motifs and components are defined in spec 00. References like (00 §7.2) point there. This spec **amends** specs 00–05 where it says so in §7; where an older spec conflicts with this one, this one wins.

> Numbering: `06-admin.md` is drafted on `claude/admin-dashboard-plan-2f1e4a`, so this spec takes 07.

---

## 1. Goal

Turn the footer from a thin sign-off into the site's one closing moment: a clear last call to apply, a full map of the site, a way to reach the club, and proof that members land at real firms.

Today the footer is a wordmark, three links, an Apply link and a copyright line. The contact column is empty until the club supplies values, and every page also ends with its own navy `CTABand`, so two dark slabs stack with a duplicate call to action.

### What changes, in one line each

- **One CTA, owned by the footer.** The per-page navy `CTABand` is removed from Home, About, Membership and Team. The footer's navy zone replaces it. `/apply` keeps its own band (spec 05 §4.4), so the footer leaves its zone out there.
- **Fuller sitemap.** Link groups (Club, Join, Reach) replace the single link list.
- **Placement strip.** The Team page's looping firm-logo strip appears in the footer, in bone on black.
- **Same black base, same rules.** Black background, bone text, `rule-inverse` hairlines (00 §10 `SiteFooter`).

### Visitor questions the footer answers

| Question | Answered by |
|---|---|
| How do I join, or hear when applications open? | CTA zone |
| Where is everything on this site? | Club and Join columns |
| How do I contact the club? | Reach column (when values exist) |
| Do members actually get these jobs? | Placement strip |

---

## 2. Structure

One `SiteFooter` component: a navy CTA zone on top of a black base made of three more parts, top to bottom:

| # | Zone | Background | Shown |
|---|---|---|---|
| 1 | CTA zone | navy | Every page except `/apply` |
| 2 | Link grid (brand, Club, Join, Reach) | black | Always |
| 3 | Placement strip | black | When `placementWall` is non-empty, except on `/team` |
| 4 | Legal row | black | Always |

```
┌─ navy ─────────────────────────────────────────────┐
│ We're between cycles.                               │
│ Applications aren't open right now. Our next …      │
│ [Keep me posted]                                    │
├─ black ────────────────────────────────────────────┤
│ ⌐ Traders at Carolina    Club     Join      Reach   │
│   mission line           About    Apply     email   │
│                          Members. Keep me.  Instagram│
│                          Team               LinkedIn │
│ ─────────────────────────────────────────────────── │
│ WHERE WE'VE WORKED                                  │
│ ░ Citadel · JPMorgan Chase · AWS · Infragrid ░      │
│ ─────────────────────────────────────────────────── │
│ © 2026 Traders at Carolina           disclaimer     │
└────────────────────────────────────────────────────┘
```

### Pages that hide a zone

| Page | CTA zone | Placement strip | Why |
|---|---|---|---|
| `/apply` | hidden | shown | The page has its own closing band (spec 05 §4.4); a second one would repeat it. |
| `/team` | shown | hidden | The header wall shows the same firms. |
| everything else | shown | shown | — |

The footer is a server component rendered by the root layout, so it cannot read the route itself. A small client wrapper, `FooterZone` (`hideOn: string[]`, uses `usePathname`), wraps the CTA zone and the strip and renders nothing on the listed paths. Server-rendered children are passed through unchanged. Before writing it, read the `usePathname` guide in `node_modules/next/dist/docs/` (AGENTS.md: this Next version has breaking changes).

---

## 3. Components

### 3.1 CTA zone (`CTABand`, now rendered only by `SiteFooter`)

- The existing `CTABand` markup moves inside the footer unchanged: a full-bleed `navy` section, H2 in `white`, optional lead in `bone`, an `inverse` button. It counts as the page's one navy band (00 §4.3). On every page except `/apply` the footer is the only place a navy band appears; `/apply`'s own band is its one.
- Copy and action come from `homeApplyCopy(state, recruiting, now).band` (spec 01 §5), the same helper Home used. Nothing new to write:

| State | H2 | Lead | Button |
|---|---|---|---|
| Open | "Ready to start?" | "Applications close {Fri, Feb 6}." (omitted with no deadline) | `inverse` "Apply" → `applyUrl` ↗ |
| Closed, interest form set | "We're between cycles." | "Applications aren't open right now. {when} Leave your email and we'll tell you the moment the next one opens." | `inverse` "Keep me posted" → `interestFormUrl` ↗ |
| Closed, no interest form | "We're between cycles." | "Applications aren't open right now. {when}" | `inverse` "See how it works →" → `/apply` |

`{when}` is "Our next cycle opens {Tue, Jan 12}." or, with no date, "We open applications each fall and spring." The closed copy is warm and student-voiced (reframed 2026-10-02), but always says plainly that applications aren't open.

- **Deadline flip.** Both variants are rendered on the server and wrapped in `DeadlineSwitch` (spec 05 §3) when a deadline exists, so a static page built before the deadline still flips to closed in the browser. This extends the browser re-check from `/apply` only to every page, because the footer now carries the site's primary CTA. The footer's nav-level Apply link already used `DeadlineSwitch`.
- **Spacing above the zone.** The rule that gives the section before a band extra bottom padding (00 §10, `section:has(+ [data-cta-band])` in `app/globals.css`) can no longer match the footer's zone, because it is outside `<main>`. The rule therefore has two selectors with the same 96 / 128 / 160px values: the original (for `/apply`'s own band, inside `<main>`) and `main:has(+ footer [data-cta-band]) > section:last-child` (for the footer's zone), so the padded section's tone still runs right up to the navy. The second selector only matches when the CTA zone is actually rendered.
- **Tracking.** Every action in the footer carries the spec 06 §7.1 tracking attributes: the CTA zone's button uses `cta` from its label (`ctaFromLabel`) with `placement: "band"`, which keeps the placement name the pages' bands used; the Club, Apply, Join and Reach links use `placement: "footer"`.

### 3.2 Link grid

- Left to right on desktop: brand block, Club, Join, Reach.
- **Brand block:** the existing `Wordmark` (bone, `lg`) and the mission line (`site.mission`, max `36ch`).
- **Club** (heading: eyebrow style in `bone` at 70%, i.e. `text-bone/70`, because `ink-3` is too dim on black; links in `text-nav`): About, Membership, Team, from `primaryNav` so the footer keeps mirroring the header (00 §11).
- **Join:** "Apply" (state-aware, exactly as today: `getApplyTarget()`, wrapped in `DeadlineSwitch` when a deadline exists) and "Keep me posted ↗" → `interestFormUrl`, shown only when an interest form is configured.
- **Reach:** contact email (`mailto:`), Instagram ↗, LinkedIn ↗. Each row renders only when its value exists in `content/site.ts`; **the whole column, including its heading, is omitted when none exist** (today's behavior). Email addresses may wrap at any character and never truncate.
- **Hover and focus:** links keep the footer's current underline-on-hover with `underline-offset-4`. Focus ring is `bone` on navy and black (00 §4.3).
- **Touch:** on touch layouts every row is at least 44px tall (`max-md:hit-target`), as today.

| Breakpoint | Layout (12-column grid) |
|---|---|
| ≥ 1024px | Brand cols 1–5, Club 7–8, Join 9–10, Reach 11–12. With Reach omitted, Club and Join keep their columns. |
| 768–1023px | Brand full width; Club, Join and Reach in three equal columns below it. |
| < 768px | Brand full width; Club and Join side by side; Reach full width below. |

Exact column spans are a starting point; confirm them in the browser at 375, 768 and 1280px and adjust.

### 3.3 Placement strip

- Reuses `PlacementWall` (`components/team/PlacementWall.tsx`) and `content/placement-wall.ts`, so adding a firm in one place updates the Team header and the footer.
- New prop `tone?: "default" | "inverse"` (default keeps the Team header exactly as it is). With `inverse` the marks keep their **official colours**, unaltered (no filters, full opacity) on a clear background, the eyebrow uses `Eyebrow tone="inverse"`, the strip's hairlines use `border-rule-inverse`, and the caption under each mark is `text-bone`. (`.on-dark` only recolors the focus ring; it does not remap tokens the way `surface-graphite` does, so these are set explicitly.)
- Behavior is unchanged: slow drift, drag and flick, edge fade, hover pause, and a static wrapped row under reduced motion (spec 04 §4.1, `.logo-strip` in `globals.css`).
- Eyebrow "Where we've worked" (the same copy the Team header uses).
- Rendered only when `placementWall.length > 0`, and not on `/team`.

### 3.4 Legal row

`© {year} Traders at Carolina` on the left; the disclaimer, if `site.disclaimer` is set, on the right (stacked on mobile), above a `rule-inverse` hairline.

---

## 4. Data

No new content files and no new content shapes.

| Need | Source |
|---|---|
| CTA state and copy | `getApplicationState()` (spec 05 §3) → `homeApplyCopy()` (`lib/home.ts`) |
| Link groups | `content/nav.ts` (`primaryNav`) |
| Contact, socials, disclaimer, interest form | `content/site.ts` (`contactEmail`, `social`, `disclaimer`, `recruiting.interestFormUrl`) |
| Placement logos | `content/placement-wall.ts` |

`homeApplyCopy` currently lives in `lib/home.ts` and is imported by About and Team. It is now the footer's copy source, so it stays where it is; moving it is a refactor this spec does not require.

---

## 5. Accessibility and motion

- One `<footer>` landmark. The link groups are separate lists; the nav group keeps `aria-label="Footer"`.
- The CTA zone keeps `CTABand`'s H2 with `aria-labelledby` pointing at its `id`. The footer zone is left out on `/apply`, the only page with its own band, so the default id appears once per page and cannot collide.
- The placement strip is decorative drift of text-captioned marks: the repeated copy stays `aria-hidden`, and the captions carry the firm names (spec 04 §4.1).
- Reduced motion: no drift, no drag, no hover pause; the strip is a static wrapped row.
- Contrast: bone on navy and bone on black both pass AA (00 §4.2); the strip's 70% opacity marks are decorative because captions carry the names.

---

## 6. Out of scope

- A newsletter signup, a map, a sponsor wall, or any new footer content type.
- Per-page closing headlines. Pages lose "Want to be part of the next chapter?", "Found your track?" and "Want to see your name here next year?" in favor of the one site-wide message. See §9.
- Moving `homeApplyCopy` or renaming `CTABand`.
- The `/admin` dashboard (spec 06) and its footer needs, if any.

---

## 7. Amendments to earlier specs

| Spec | Section | Change |
|---|---|---|
| 00 | §4.3 usage rules | "At most one full-bleed navy band per page" now means the footer's CTA zone; pages no longer place their own. |
| 00 | §10 `CTABand` | Rendered by `SiteFooter` (and by `/apply`'s own band, spec 05 §4.4). Extra bottom padding also covers the last section of `<main>` when the footer zone renders (§3.1). |
| 00 | §10 `SiteFooter` | Contents replaced by §2–§3 of this spec. |
| 00 | §11 | "Footer nav: mirrors the header" still holds; Join and Reach are additional groups. |
| 00 | §14 | Open items for contact email, social URLs and disclaimer stay open; they populate Reach and the legal row. |
| 01 | §2, §3.5, §5, criteria 2–3 | Remove the Apply band and "exactly one navy band" from Home. The hero button is unchanged. |
| 02 | §2, §3.6, criteria 1 | Remove the Apply band. |
| 03 | §2, §3.6, criteria 1 | Remove the Apply band. |
| 04 | §2, §4.5, criteria | Remove the Apply band; the Placements section stays. The footer strip is hidden on `/team` (§2). |
| 05 | §4.1, §4.4, §3 | `/apply` keeps its redesigned band; the footer's CTA zone is left out there. The closed-state sign-up button is "Keep me posted" (was "Get notified"), so its analytics `cta` is `keep-me-posted`. The browser re-check of §3 now also runs in the footer on every other page. |

Each page spec's "Visitor questions" row "How do I join? → Apply band" becomes "→ Footer CTA zone".

---

## 8. Implementation notes (for the later plan; nothing here is built yet)

| File | Change |
|---|---|
| `components/SiteFooter.tsx` | Rebuild per §2–§3. |
| `components/FooterZone.tsx` (new, client) | Route-gated wrapper (§2). |
| `components/team/PlacementWall.tsx` | `tone` prop (§3.3). |
| `app/globals.css` | Replace the `section:has(+ [data-cta-band])` rule (§3.1). |
| `components/home/HomePage.tsx`, `about/AboutPage.tsx`, `membership/MembershipPage.tsx`, `team/TeamPage.tsx` | Remove `CTABand` and the band-only copy (`bandTitle`, `closedLead`). `apply/ApplyPage.tsx` and `lib/apply.ts` keep their band (spec 05 §4.4); only the closed sign-up label and process intro change. |
| `app/styleguide/page.tsx` | Keep the `CTABand` demo (it is the footer's CTA zone) and update its lead copy. |
| `docs/specs/00`–`05` | Amend per §7. |
| `README.md` | No change needed unless the officers' notes mention the band. |
| `tests/components/*-page.test.tsx`, `site-header.test.tsx`, `placement-wall.test.tsx` | Drop band assertions; add footer and `FooterZone` tests (§10). |

Work in this order so each step is shippable: `PlacementWall` tone → footer rebuild with `FooterZone` → remove page bands → spec amendments.

---

## 9. Open items

- [ ] **Confirm the loss of per-page closing headlines** (§6). One site-wide message is simpler and removes duplicate work; per-page copy would need a way for each page to hand text to a layout-level footer.
- [ ] **Join column contents.** "Apply" plus "Keep me posted" is a starting point. Is a "How recruiting works" link to `/apply` worth adding when applications are open?
- [ ] Contact email, Instagram URL, LinkedIn URL and the UNC disclaimer are still pending from the club (00 §14). Reach and the disclaimer stay hidden until then.
- [ ] Placement strip at four firms: confirm it looks full enough in the footer, or whether it should wait for more marks.

---

## 10. Acceptance criteria

1. Every page except `/apply` ends with the navy CTA zone directly above the black link grid; `/apply` ends with its own navy band above the black link grid. Only `ApplyPage` renders `CTABand`; no other page component does.
2. With `applicationsOpen: false` and an interest form, the CTA zone reads "We're between cycles." (with a lead that says applications aren't open right now) and "Keep me posted" opens `interestFormUrl`; without one, it offers "See how it works →" to `/apply`. With `applicationsOpen: true`, it reads "Ready to start?" with "Apply" opening `applyUrl`, plus the deadline lead when one is set.
3. With a deadline in the past at build time, the zone renders closed; with a future deadline it renders open and flips to closed in the browser at the deadline, on any page, with no flash.
4. Club shows About, Membership, Team. Join shows Apply (state-aware), and Keep me posted only when an interest form exists. Reach and its heading are absent until a contact value is set, and each row appears only when its own value is set.
5. The placement strip shows on every page except `/team` when `placementWall` is non-empty; marks are bone on black; it is static under reduced motion; adding an entry to `placement-wall.ts` updates both the Team header and the footer.
6. The Team header strip is visually unchanged.
7. On every page, the section directly above the navy band (the footer's zone, or `/apply`'s own band) has the extra bottom padding and its tone runs up to the navy.
8. Layout holds at 375, 768 and 1280px: no horizontal scroll, touch rows at least 44px, long email addresses wrap, nothing truncates.
9. Keyboard: tab order runs CTA button, Club, Join, Reach, strip, with a visible bone focus ring.
10. `pnpm test` and `pnpm build` pass, and the old band assertions are gone from the page tests.
