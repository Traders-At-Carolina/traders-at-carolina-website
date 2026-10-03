# Spec 08 — Footer bit wordmark

**Status:** Implemented · **Date:** 2026-10-02 · **Route:** every page (inside `SiteFooter`) · **Depends on:** [Spec 00 §3, §9.2, §10](00-vision-and-style.md)

All tokens, type roles and components are defined in spec 00. References like (00 §9.2) point there. This spec adds one component, `BitWordmark`, to the bottom of `SiteFooter`.

---

## 1. Goal

Close every page with a memorable, on-brand signature: a wide field of 1s and 0s that starts scrambled, resolves into **"Traders at Carolina"** as the visitor scrolls to it, and lights up around the cursor. It is decorative. It carries no information the footer doesn't already carry.

The reference is the dot-matrix "Orbit" wordmark at the foot of myorbitnetwork.com, with glyphs in place of dots.

---

## 2. Exception to spec 00

Spec 00 §3 says "Never use … terminal or monospace typography". A field of bits is the one deliberate exception.

- **Scope:** `BitWordmark`, inside `SiteFooter`. Since 2026-10-03 the Home hero's volatility surface is also drawn in bits (spec 01 §3.1, navy on bone); the two share the DOM-free bit logic in `lib/bit-field.ts` (seeded bits, flicker, glitch, load, hover falloff). No other component uses the glyphs.
- **Limits:** the glyphs `0` and `1` are drawn in the site's own sans (`--font-sans`, Public Sans), not a monospace face. No monospace or terminal typography appears anywhere else on the site.
- **Motif count:** the field counts as a motif (00 §3). It appears only at the very bottom of the page, where no other motif sits alongside it (the hero's bit surface is a full page away).
- The same edit adds the exception to spec 00 §3 and §10 `SiteFooter`.

---

## 3. Placement and layout

| | Spec |
|---|---|
| **Position** | A band at the very bottom of `SiteFooter`, below the `© {year}` row, inside the footer's `black` background |
| **Width** | The container width (00 §6), including its 16px gutters on mobile |
| **Height** | Set by the wordmark's aspect ratio (height / width): 0.28 from `md` up (about 331px at the 1184px content width, two lines) and 0.57 below (about 191px at 335px, three lines) |
| **Spacing** | 32px above the band on mobile, 48px on desktop (the footer's bottom padding above it); the band ends flush with the end of the page, with no padding below it |
| **Edges** | Soft fade, no hard boundary: a CSS `mask-image` gradient dims the left, right and top edges to transparent over about 8% of the width / 14% of the height. The bottom edge is flush with the page end, is not faded, and **crops the wordmark** (§4). |

`SiteFooter` stays a server component; `BitWordmark` is a client component imported into it.

---

## 4. Rendering

- **Technique:** one `<canvas>` with a `requestAnimationFrame` loop. No animation library, no new dependency (00 §9.2).
- **Grid:** square cells, 8px from `md` up and 5px below, covering the canvas. Each cell holds one glyph, `0` or `1`, drawn in `--font-sans` at weight 700 and about 1.3× the cell size, so the digits fill the cell. Glyphs are pre-rendered once as two sprites and stamped per cell. The canvas is scaled by `devicePixelRatio` (capped at 2) so glyphs stay sharp.
- **Letter mask:** on mount, and after `document.fonts.ready` and on resize, the text "Traders at Carolina" is drawn once to an offscreen canvas in `--font-title` (Chivo, weight 800, matching the Team headings), fitted so its widest line is 94% of the band's width. Each cell is a **letter cell** if its coverage in that bitmap is at least 50%. The mask is recomputed only when the grid size changes.
- **Layout of the text:** stacked so the letters are big. A one-line "Traders at Carolina" is about five times wider than it is tall, so it can't be made large without leaving the page width. From `md` up it is two lines ("Traders at" / "Carolina"); below `md` it is three ("Traders" / "at" / "Carolina").
- **Cropped at the bottom, like the Orbit wordmark.** The text block sits low in the band so the **last line runs off the bottom edge**, with about 35% of its cap height cut off by the end of the page. Lines are spaced 1.25 cap heights baseline to baseline, and the band's aspect ratio is chosen so the first line clears the top fade. The crop is just the canvas boundary: the offscreen text bitmap is the same size as the canvas, so the cut-off part of the letters has no cells.
- **Colors** (bone only, 00 §4):

| State | Color |
|---|---|
| Resting, non-letter cell | `bone` at 12% |
| Resting, letter cell | `bone` at 100% |
| Hovered cell | glyph forced to `1`, with a pure `white` copy drawn over it at the pointer's strength, with a soft white glow (brighter than any resting bit) |

- **Bit values:** each cell has a seeded random bit. The seed is fixed per grid size, so the resolved field is the same between visits; only the scramble flicker uses runtime randomness.

---

## 5. Scroll-in sequence

The sequence **replays every time** the band enters view.

1. **Scrambled (default state, and the state after leaving view).** Every cell flickers hard: its glyph re-rolls randomly at 14–28 Hz, per cell, and all cells sit at the same mid brightness (`bone` at 40%). No letters are visible.
2. **Trigger.** An `IntersectionObserver` fires when 40% of the band is visible.
3. **Load.** There is **no sweep**. After a **0.5s** hold of pure scramble, the bits lock in over **1.6s** (smooth ramp), each at its own random moment (a fixed per-cell threshold, spread evenly across the field and unrelated to position). A locking cell stops flickering and settles: letter cells to 100% and non-letter cells to 12%. The wordmark emerges out of the noise everywhere at once, like a decode.
4. **Glitching (letters only).** Once formed, the lettering never goes still: about 4% of letter cells glitch in every 110ms window (a different set each window), flipping their glyph and dipping to 50% brightness. The background field is **static** once formed (it still flickers during the initial scramble, before it locks in).
5. **Leaving view.** When less than 10% of the band is visible, the loop stops and the state resets to scrambled, so the next entry replays.

The loop runs **only while the band is at least 10% visible** and the tab is visible (`document.hidden` false).

---

## 6. Hover (and touch)

- **Radius:** 16px from the pointer (14px on touch), about three cells across, so the hover is a pinpoint spotlight on the lettering rather than a swipe across it. The lit bits are **brighter** than any resting bit: pure white with a soft glow.
- **Only the letters respond.** Letter cells (the lit parts of "Traders at Carolina") inside the radius become `1` and brighten to 100% `bone`. The dim background field is untouched: it keeps its own bits and brightness under the cursor.
- **Falloff:** fully on to 70% of the radius, then a linear fade to the resting state at the radius edge, so the circle is soft, not cut out.
- **Release:** each cell eases back to its resting state over **0.6s** after the pointer leaves its radius, giving a short trail. Cells that were forced to `1` return to their own bit.
- **Hover only affects settled cells.** While the load is still running, hover is ignored for cells that haven't locked in yet.
- **Input:** `pointermove`, `pointerleave` and `pointercancel` on the canvas. A touch drag across the canvas triggers the same effect. The canvas sets `touch-action: pan-y`, so vertical scrolling is never blocked.
- **Cursor:** the default cursor; the band is not interactive and is not focusable.

---

## 7. Accessibility and motion

- The canvas is decorative: `aria-hidden="true"`, `role="presentation"`, not focusable. The real company name is already in the footer's `Wordmark`.
- **`prefers-reduced-motion: reduce` (00 §9.2):** the canvas draws the **finished static wordmark** once (resolved, no flicker, no glitching), and hover and touch effects are disabled. The loop never starts.
- **No JavaScript / before mount:** the band reserves its height and is empty (black). The footer content above is unaffected.
- **Contrast:** decorative text is exempt from contrast requirements; the footer's links and copyright keep their existing contrast on `black`.
- **Performance:** about 7.8k cells at the 1184px desktop content width (about 3.6k on mobile). Each frame redraws every cell by stamping one of two pre-rendered glyph sprites with `globalAlpha`. The loop is paused while the band is off-screen or the tab is hidden. Target: smooth 60fps on a mid-range laptop, with no layout shift (the band's height is reserved by `aspect-ratio`).

---

## 8. Implementation notes

- **Pure module** `components/footer/bitWordmarkScene.ts`, unit-tested with vitest (the `volSurfaceScene.ts` pattern). The generic bit helpers live in `lib/bit-field.ts`, shared with the Home hero, and are re-exported from here:
  - `buildGrid(width, height, cell)` → columns and rows
  - `buildLetterMask(coverage, cols, rows)` → boolean per cell
  - `cellState({ col, row, isLetter, time, settle, heat, shimmer })` → glyph and alpha
  - `loadProgress(elapsed)` → 0 to 1, after the hold
  - `settleThreshold(col, row)` and `cellSettle(threshold, progress)` → when and how far a cell has locked in
  - `hoverStrength(distance, radius)` → 0 to 1 with the falloff above
  - a seeded RNG for the resolved bits
- **Component** `components/footer/BitWordmark.tsx`: owns the canvas, the observers, the pointer events and the loop, and calls the pure module for everything else.
- Reads `--font-sans` and `--font-title` through `getComputedStyle` so it uses the same `next/font` families as the rest of the page.
- Tests stub the canvas (jsdom has no 2D context); the pure module needs no stub.

---

## 9. Acceptance criteria

1. Every page's footer ends with the band, and its edges fade with no visible boundary.
2. Scrolling the band into view plays the scramble-then-load sequence (bits lock in at random places with no left-to-right front); scrolling it out and back in plays it again. Once formed, the lettering keeps glitching while the background stays still.
3. The resolved field reads "Traders at Carolina" clearly at 1440px, 1024px, 768px and 390px widths (two lines at ≥768px, three lines below), with the last line partly cut off by the bottom edge of the page.
4. Hovering turns the letter bits within a tiny, soft-edged radius (16px) into glowing white `1`s, eases them back about 0.6s after the pointer leaves, and leaves the background field unchanged.
5. On touch, dragging over the band lights up bits and does not block vertical page scroll.
6. With `prefers-reduced-motion: reduce`, the finished wordmark is shown statically with no hover effect.
7. The canvas is `aria-hidden`; nothing new is announced by assistive tech or reachable by keyboard.
8. No layout shift on load, and the loop is stopped while the band is off-screen.
9. Pure-module unit tests pass; `pnpm test`, `pnpm typecheck` and `pnpm lint` are clean.
10. Spec 00 §3 and §10 carry the scoped exception from §2 above.

---

## 10. Open items

- Cell size, band aspect, glyph weight, the resting opacities and the hover radius were tuned against the live page during implementation. The first build (one line, 8px cells, 18% / 90% opacities, 90px radius) was too small and faint to read, and the wordmark was restacked and enlarged after review. After review the hover radius was cut again (to 28px, then 16px) and the lit bits made white with a glow, the wordmark was cropped by the bottom edge, the left-to-right wave was replaced by a random per-bit load, and glitching was increased (about 4% of cells every 110ms, up from 1% per second). The hold, load duration and glitch share can still be adjusted by feel.
