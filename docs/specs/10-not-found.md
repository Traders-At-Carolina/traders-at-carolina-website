# Spec 10 — 404 page: a 3D "404" in bits

**Status:** Implemented · **Date:** 2026-10-03 · **Route:** any unmatched URL (`app/not-found.tsx`) · **Depends on:** [Spec 00 §3, §4, §9.2, §10](00-vision-and-style.md), [Spec 08](08-footer-bit-wordmark.md)

All tokens, type roles and components are defined in spec 00. References like (00 §9.2) point there. This spec adds one component, `Bit404`, to the 404 page, and moves the bit primitives that it shares with spec 08's `BitWordmark` into one module.

---

## 1. Goal

Turn a dead end into a small moment of delight that is still clearly the club's. A large "404" built from navy 1s and 0s stands in solid 3D above the message. It decodes out of noise when the page loads, then turns to face the cursor wherever the cursor is on the page.

The page still does its job first: it says the page isn't here and offers one way home. The figure is decorative and carries no information that the text doesn't.

---

## 2. Exception to spec 00

Spec 00 §3 allows the bit field only in the footer's `BitWordmark`. This spec extends that exception, and nothing else.

- **Scope:** `Bit404`, on the 404 page only.
- **Limits:** the same as spec 08 §2. The glyphs `0` and `1` are drawn in the site's own sans (`--font-public-sans`), never a monospace face. The "404" shape comes from the title face (`--font-chivo`, weight 800).
- **Color:** `navy` only (00 §4), on the page's `bone` background. No new color token.
- **Two bit motifs on one page:** this is deliberate. The 404 page opens with the navy `Bit404` and closes with the footer's bone `BitWordmark` on black. They sit at opposite ends of the page and never share a viewport on desktop.
- The same edit extends the exception in spec 00 §3 and §10, and in spec 08 §2.

---

## 3. Page layout

Inside `SiteChrome`, in one `Container`, top to bottom. **The whole section fits one screen:** the container is a flex column at least as tall as the viewport below the header (`100svh` − 64px, or − 80px from `md` up), with `py-10` (`md:py-12`), and its content is centered vertically.

| Order | Element | Spec |
|---|---|---|
| 1 | `Eyebrow` | "Error 404" |
| 2 | `Bit404` | Centered, full container width up to `56rem`, 16px below the eyebrow (24px from `md` up). Its height flexes (below) |
| 3 | H1 | "This page isn't here." (unchanged copy), 16px below the figure (24px from `md` up) |
| 4 | Lead | "The link may be out of date, or the page hasn't been published yet." (unchanged), `max-w-prose`, `ink-2` |
| 5 | `TextLink` | "Back to the home page", with an arrow, to `/` |

- The text stays left-aligned with the container, as on every other page. Only the figure is centered.
- `app/not-found.tsx` stays a server component and keeps `metadata = { title: "Page not found" }`. `Bit404` is a client component imported into it.
- **Height:** the figure takes whatever height the column leaves after the eyebrow and text (`flex-1`), at least 144px and at most `min(28rem, 62vw)`. The canvas uses `contain: size`, so its pixel buffer never props the column taller. "404" is drawn as large as fits **both** 70% of the box's width and 62% of its height (cap height), so on a short screen it shrinks rather than clips, and the margins keep it inside the box at full tilt. Measured: 896 × 448 at 1440 × 900 and 1920 × 1080, 896 × 316 at 1280 × 720, 704 × 448 at 768 × 1024, 335 × 233 at 375 × 667. On every one of these the home link sits above the fold. Only on very short screens (a phone in landscape) does the 144px floor let the page scroll.

---

## 4. Shape

- **Mask:** on mount, after `document.fonts` loads, and on resize, "404" is drawn once to an offscreen canvas in `--font-chivo` 800, as large as fits 70% of the canvas width and 62% of its height (cap height), and centered. The pixels are averaged down to a grid of square cells: 9px from `md` up, 6px below. A cell is a **letter cell** if its coverage is at least 50% (`buildLetterMask`, spec 08 §4).
- **Extrusion:** the mask is extruded into a solid. The depth is 0.3 × the cap height of "404", rounded to whole cells, with a minimum of 4 layers. Layers are one cell apart.
- **Voxel shell:** only the visible surface becomes bits:
  - the **front face** and **back face**: every letter cell, at the two outer layers
  - the **side walls**: on each layer between the faces, every **edge cell** (a letter cell with at least one non-letter neighbour above, below, left or right)

  The result is a hollow shell that reads as solid: about 4–7k bits at desktop width and about 1.5–2.5k on mobile. The counters of the 0 have walls too.
- **Centering:** the solid is centered on its own middle, in x, y and z, so it rotates around its center.

---

## 5. Rendering

- **Technique:** one `<canvas>`, a 2D context and a `requestAnimationFrame` loop. There's no WebGL, no three.js and no new dependency (00 §9.2). Only the bits' positions are 3D. Every glyph is drawn flat and facing the viewer, so it always reads as a `0` or a `1`.
- **Sprites:** two glyph sprites (`0` and `1`), `navy`, in `--font-public-sans` 700 at about 1.3× the cell size, as in spec 08 §4. They're pre-rendered once per build and stamped per bit. The canvas is scaled by `devicePixelRatio`, capped at 2.
- **Projection:** each frame, every bit is rotated by the current pose (yaw around the vertical axis, then pitch around the horizontal axis) and projected with perspective. The camera sits 3.5× the solid's width from its center, so the near face is visibly larger than the far one without distortion.
- **Draw order and occlusion:** bits are drawn back to front, sorted by depth each frame. Each glyph sits on an opaque `bone` tile the size of its cell, so nearer bits hide the ones behind them and the figure reads as a solid, not a see-through cloud. Head-on, only the front face shows.
- **Shading and depth cues:**

| Property | Front face | Walls and back face |
|---|---|---|
| Base opacity | `navy` at 100% | `navy` at 60%, like the shaded sides of extruded type |
| Depth fade (multiplies the base) | 100% for the nearest bit down to 65% for the farthest, linear | Same |
| Size | The perspective scale (about 1.1× near to 0.9× far) | Same |

- **No background field:** unlike spec 08, there's no dim field of bits behind the shape. The bone page is the background, so the silhouette stays legible from every angle.
- **Bit values:** each bit has a seeded value keyed on its column, row and layer. The resolved figure is the same on every visit; only the scramble flicker and the glitch use time.

---

## 6. Following the cursor

- **Input:** `pointermove` on `window`, so the figure responds to the cursor anywhere on the page, not just over the canvas.
- **Target pose:** from the cursor's offset to the figure's center (dx, dy) and the viewport size (vw, vh):
  - yaw = clamp(dx / (vw / 2), −1, 1) × 35°
  - pitch = clamp(dy / (vh / 2), −1, 1) × 25°

  Signs are chosen so the **front face turns toward the cursor**. Cursor to the right: the face turns right. Cursor above: the face tilts up. The tilt is bounded, so "404" always reads the right way round.
- **Easing:** the current pose eases toward the target with exponential smoothing, framerate-independent. The time constant is about 140ms while following the pointer and 600ms when drifting back to rest or into the sway. The figure swings smoothly and never snaps.
- **Rest pose:** yaw −12°, pitch 8°. The figure sits here before any pointer arrives, eases back to it when the pointer leaves the window (`pointerleave` on `document.documentElement`, or `pointerout` with no `relatedTarget`), and eases back when a touch ends. The rest pose is a three-quarter view, so the shape reads as 3D even when it's still.
- **Idle sway:** 2.5s after the last pointer movement, or 2.5s after the figure first draws if the pointer never moved (so touch-only devices sway right after the decode), the target becomes a slow sway around the rest pose: yaw ±10° at about 0.1 Hz, and pitch ±4° at about 0.07 Hz. The figure never sits dead still while motion is allowed. The sway's phase stays continuous, so it starts from wherever the pose is.
- **Touch:** dragging a finger anywhere on the page sets the target like a cursor does. The canvas sets `touch-action: pan-y`, so vertical scrolling is never blocked. Lifting the finger returns to rest, then to idle sway.
- **Cursor:** the default cursor. The figure isn't interactive and isn't focusable.

---

## 7. Decode and glitch

Same language as spec 08 §5, but it plays **once on load**, not on scroll-in, because the figure is above the fold.

1. **Scrambled:** every bit flickers at its own 14–28 Hz, at `navy` 40% (times the depth opacity). The shape already shows, as a buzzing silhouette, and it already follows the cursor.
2. **Load:** after a **0.5s** hold, the bits lock in over **1.6s**, each at its own random moment (a fixed per-bit threshold unrelated to position). A locking bit settles to its seeded value at full depth opacity. The timing comes from spec 08's `loadProgress` and `cellSettle`.
3. **Glitch:** once formed, about 4% of bits flip their glyph and dip to 50% opacity in every 110ms window, a different set each window (`glitching`, spec 08 §5). Every bit can glitch, front, back and walls, because the whole figure is the lettering.
4. **No replay:** scrolling away and back doesn't restart the decode. The loop just pauses while the figure is out of view.

---

## 8. Accessibility and motion

- **Decorative:** `aria-hidden="true"`, `role="presentation"`, not focusable. The page's meaning lives in the eyebrow, H1, lead and link.
- **`prefers-reduced-motion: reduce` (00 §9.2):** the canvas draws the **finished figure once, at the rest pose**: resolved, with no flicker, glitch, cursor tracking or sway. The loop never starts and no pointer listeners are added.
- **No JavaScript / before mount:** the figure's box gets its height from CSS layout and stays empty bone. The text below is unaffected.
- **Performance:**
  - Each frame projects every bit, sorts by depth (typed arrays, reusing one index buffer) and stamps one of two sprites with `globalAlpha`. Target: smooth 60fps on a mid-range laptop.
  - The loop runs only while the canvas is at least 10% visible (`IntersectionObserver`) and the tab is visible (`document.hidden` false).
  - No layout shift: the height comes from CSS layout (the flex column), never from the canvas.

---

## 9. Implementation notes

- **Shared bit primitives** move into `components/bits/bitCore.ts`:
  - the hash
  - `seededBit`, the flicker and the glitch, each taking an optional layer argument that defaults to 0, so spec 08's values don't change
  - `loadProgress`, `settleThreshold`, `cellSettle`
  - `buildLetterMask`
  - the load and glitch constants

  `components/footer/bitWordmarkScene.ts` re-exports them, so `BitWordmark` and its tests are untouched. `BitWordmark` drops its private copy of the reduced-motion hook, and both components use the site's shared `lib/use-reduced-motion.ts`. The pixel-to-mask averaging is shared too, as `maskFromPixels`.
- **Pure module** `components/notfound/bit404Scene.ts`, unit-tested with vitest:
  - `buildShell(mask, cols, rows, layers)` → the bits' x / y / z (centered) and their col / row / layer
  - `project(point, pose, camera)` → screen x / y, scale and depth
  - `depthAlpha(depth, far, near)` → 0.65 to 1, and `layerShade(layer)` → 1 for the front face, 0.6 behind it
  - `targetPose(dx, dy, vw, vh)` → yaw and pitch, clamped and signed as in §6
  - `easePose(current, target, dtMs)` → the next pose
  - `idlePose(timeMs)` → the sway around the rest pose
  - `bitState({ col, row, layer, time, settle, shimmer })` → glyph and alpha
  - the constants: rest pose, maximum yaw and pitch, easing time, idle delay, camera distance
- **Component** `components/notfound/Bit404.tsx`: owns the canvas, the font wait, the `ResizeObserver` rebuild, the `IntersectionObserver`, the window pointer listeners and the loop. It calls the pure module for everything else. It reads `--font-public-sans`, `--font-chivo` and `--color-navy` through `getComputedStyle`.
- **Tests stub the canvas** (jsdom has no 2D context), like `tests/components/bit-wordmark.test.tsx`. The pure module needs no stub.

---

## 10. Acceptance criteria

1. Any unmatched URL shows the eyebrow, the 3D bit "404", the H1, the lead and the home link, in that order, inside the site chrome.
2. On load, the figure scrambles, then the bits lock in at random places over about 2.1s. Once formed, about 4% of the bits keep glitching.
3. Moving the cursor anywhere on the page turns the figure's front face toward it, smoothly and within ±35° yaw and ±25° pitch. Moving the cursor out of the window eases the figure back to the three-quarter rest pose.
4. After 2.5s without pointer movement, and on touch devices, the figure sways gently around the rest pose. A touch drag steers it without blocking vertical scroll.
5. "404" reads clearly at every pose at 1440px, 1024px, 768px and 390px widths, and never clips at the canvas edges.
6. The figure reads as a solid: nearer bits hide the ones behind, the front face is full navy, the walls are shaded lighter, and the glyphs always face the viewer.
7. With `prefers-reduced-motion: reduce`, the finished figure shows statically at the rest pose, with no tracking, sway or glitch.
8. The canvas is `aria-hidden`. Nothing new is announced by assistive tech or reachable by keyboard.
9. There's no layout shift, and the loop is stopped while the figure is out of view or the tab is hidden.
13. The eyebrow, figure, heading, lead and home link all show in the first screen, without scrolling, at 375 × 667, 768 × 1024, 1280 × 720, 1440 × 900 and 1920 × 1080.
10. The footer `BitWordmark` behaves exactly as before. Its tests pass unchanged after the `bitCore.ts` extraction.
11. The pure-module unit tests pass, and `pnpm test`, `pnpm typecheck` and `pnpm lint` are clean.
12. Spec 00 §3, §10 and §13, and spec 08 §2, carry the extended exception from §2 above.

---

## 11. Open items

- Tuned against the live page during implementation. The first build had no occlusion, a 0.35 extrusion and a 30–100% depth fade: the walls and back face showed through the gaps between glyphs, and the turned-away half of the face washed out. Opaque tiles, a 0.3 extrusion, 60% wall shading and a gentle 65–100% fade fixed both. The tilt limits, rest pose, easing and sway are as first specified and can still be adjusted by feel.
