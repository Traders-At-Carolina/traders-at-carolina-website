# Spec 06 — Footer bit wordmark

**Status:** Draft · **Date:** 2026-10-02 · **Route:** every page (inside `SiteFooter`) · **Depends on:** [Spec 00 §3, §9.2, §10](00-vision-and-style.md)

All tokens, type roles and components are defined in spec 00. References like (00 §9.2) point there. This spec adds one component, `BitWordmark`, to the bottom of `SiteFooter`.

---

## 1. Goal

Close every page with a memorable, on-brand signature: a wide field of 1s and 0s that starts scrambled, resolves into **"Traders at Carolina"** as the visitor scrolls to it, and lights up around the cursor. It is decorative. It carries no information the footer doesn't already carry.

The reference is the dot-matrix "Orbit" wordmark at the foot of myorbitnetwork.com, with glyphs in place of dots.

---

## 2. Exception to spec 00

Spec 00 §3 says "Never use … terminal or monospace typography". A field of bits is the one deliberate exception.

- **Scope:** `BitWordmark` only, inside `SiteFooter` only.
- **Limits:** the glyphs `0` and `1` are drawn in the site's own sans (`--font-sans`, Public Sans), not a monospace face. No monospace or terminal typography appears anywhere else on the site.
- **Motif count:** the field counts as a motif (00 §3). It appears only at the very bottom of the page, where no other motif sits alongside it.
- The same edit adds the exception to spec 00 §3 and §10 `SiteFooter`.

---

## 3. Placement and layout

| | Spec |
|---|---|
| **Position** | A band at the very bottom of `SiteFooter`, below the `© {year}` row, inside the footer's `black` background |
| **Width** | The container width (00 §6), including its 16px gutters on mobile |
| **Height** | Set by the wordmark's aspect ratio: roughly 160–220px on desktop (one line), 220–280px on mobile (two lines) |
| **Spacing** | 48px above the band on desktop, 32px on mobile; the band ends flush with the footer's bottom padding |
| **Edges** | Soft fade, no hard boundary: a CSS `mask-image` gradient dims the left, right and top edges to transparent over about 12% of the width / 25% of the height. The bottom edge is flush with the page end and is not faded. |

`SiteFooter` stays a server component; `BitWordmark` is a client component imported into it.

---

## 4. Rendering

- **Technique:** one `<canvas>` with a `requestAnimationFrame` loop. No animation library, no new dependency (00 §9.2).
- **Grid:** square cells, 8px on desktop and 7px below 768px, covering the canvas. Each cell holds one glyph, `0` or `1`, drawn in `--font-sans` at the cell size. The canvas is scaled by `devicePixelRatio` (capped at 2) so glyphs stay sharp.
- **Letter mask:** on mount, and after `document.fonts.ready` and on resize, the text "Traders at Carolina" is drawn once to an offscreen canvas in `--font-title` (Chivo, weight 800, matching the Team headings), fitted to the width. Each cell is a **letter cell** if its coverage in that bitmap is at least 50%. The mask is recomputed only when the grid size changes.
- **Layout of the text:** one line from `md` up; two lines ("Traders at" / "Carolina") below `md`, so the strokes stay at least two cells wide.
- **Colors** (bone only, 00 §4):

| State | Color |
|---|---|
| Resting, non-letter cell | `bone` at 18% |
| Resting, letter cell | `bone` at 90% |
| Hovered cell | `bone` at 100%, glyph forced to `1` |

- **Bit values:** each cell has a seeded random bit. The seed is fixed per grid size, so the resolved field is the same between visits; only the scramble flicker uses runtime randomness.

---

## 5. Scroll-in sequence

The sequence **replays every time** the band enters view.

1. **Scrambled (default state, and the state after leaving view).** Every cell flickers: its glyph re-rolls randomly at 8–14 Hz, per cell, and all cells sit at the same mid brightness (`bone` at 40%). No letters are visible.
2. **Trigger.** An `IntersectionObserver` fires when 40% of the band is visible.
3. **Wave.** A front sweeps left to right over **1.6s** (`ease-out`). Cells it has passed stop flickering and settle: letter cells to 90% and non-letter cells to 18%, easing over 250ms. Cells ahead of the front keep flickering. A slight softness in the front (a band about 6 columns wide) avoids a hard scan line.
4. **Idle.** Once formed, about 1% of cells per second re-roll their glyph, so the field shimmers faintly.
5. **Leaving view.** When less than 10% of the band is visible, the loop stops and the state resets to scrambled, so the next entry replays.

The loop runs **only while the band is at least 10% visible** and the tab is visible (`document.hidden` false).

---

## 6. Hover (and touch)

- **Radius:** 90px from the pointer (60px on touch). Cells inside the radius become `1` and brighten to 100% `bone`.
- **Falloff:** fully on to 70% of the radius, then a linear fade to the resting state at the radius edge, so the circle is soft, not cut out.
- **Release:** each cell eases back to its resting state over **0.6s** after the pointer leaves its radius, giving a short trail. Cells that were forced to `1` return to their own bit.
- **Hover only affects a formed field.** While the wave is still running, hover is ignored for cells the wave hasn't reached.
- **Input:** `pointermove`, `pointerleave` and `pointercancel` on the canvas. A touch drag across the canvas triggers the same effect. The canvas sets `touch-action: pan-y`, so vertical scrolling is never blocked.
- **Cursor:** the default cursor; the band is not interactive and is not focusable.

---

## 7. Accessibility and motion

- The canvas is decorative: `aria-hidden="true"`, `role="presentation"`, not focusable. The real company name is already in the footer's `Wordmark`.
- **`prefers-reduced-motion: reduce` (00 §9.2):** the canvas draws the **finished static wordmark** once (resolved, no flicker, no idle shimmer), and hover and touch effects are disabled. The loop never starts.
- **No JavaScript / before mount:** the band reserves its height and is empty (black). The footer content above is unaffected.
- **Contrast:** decorative text is exempt from contrast requirements; the footer's links and copyright keep their existing contrast on `black`.
- **Performance:** about 14k cells at 1200px wide on desktop. Drawing is batched per color and per alpha bucket, and cells that haven't changed are not redrawn between frames. The loop is paused off-screen. Target: sustained 60fps on a mid-range laptop, with no layout shift (the band's height is reserved by `aspect-ratio`).

---

## 8. Implementation notes

- **Pure module** `components/footer/bitWordmarkScene.ts`, unit-tested with vitest (the `volSurfaceScene.ts` pattern):
  - `buildGrid(width, height, cell)` → columns and rows
  - `buildLetterMask(coverage, cols, rows)` → boolean per cell
  - `cellState({ col, row, time, waveProgress, hover, … })` → glyph and alpha
  - `waveFront(elapsed)` → eased front position
  - `hoverStrength(distance, radius)` → 0 to 1 with the falloff above
  - a seeded RNG for the resolved bits
- **Component** `components/footer/BitWordmark.tsx`: owns the canvas, the observers, the pointer events and the loop, and calls the pure module for everything else.
- Reads `--font-sans` and `--font-title` through `getComputedStyle` so it uses the same `next/font` families as the rest of the page.
- Tests stub the canvas (jsdom has no 2D context); the pure module needs no stub.

---

## 9. Acceptance criteria

1. Every page's footer ends with the band, and its edges fade with no visible boundary.
2. Scrolling the band into view plays the scramble-to-wordmark sequence; scrolling it out and back in plays it again.
3. The resolved field reads "Traders at Carolina" clearly at 1440px, 1024px, 768px and 390px widths (one line at ≥768px, two lines below).
4. Hovering shows a soft-edged circle of bright `1`s that eases away about 0.6s after the pointer leaves.
5. On touch, dragging over the band lights up bits and does not block vertical page scroll.
6. With `prefers-reduced-motion: reduce`, the finished wordmark is shown statically with no hover effect.
7. The canvas is `aria-hidden`; nothing new is announced by assistive tech or reachable by keyboard.
8. No layout shift on load, and the loop is stopped while the band is off-screen.
9. Pure-module unit tests pass; `pnpm test`, `pnpm typecheck` and `pnpm lint` are clean.
10. Spec 00 §3 and §10 carry the scoped exception from §2 above.

---

## 10. Open items

- Final cell size, wave duration and hover radius are tuned against the live page during implementation; the numbers above are starting points.
