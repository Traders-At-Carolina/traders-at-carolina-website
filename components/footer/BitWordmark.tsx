"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  HOVER_RADIUS,
  LOAD_TOTAL_MS,
  TOUCH_HOVER_RADIUS,
  buildGrid,
  buildLetterMask,
  cellSettle,
  cellState,
  decayHeat,
  hoverStrength,
  lineBaselines,
  loadProgress,
  settleThreshold,
  wordmarkLayout,
} from "@/components/footer/bitWordmarkScene";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(reducedMotionQuery);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

/** Band visibility: the loop runs above VISIBLE, and the scroll-in load starts at START (spec 06 §5). */
const VISIBLE = 0.1;
const START = 0.4;
/** The letter mask is drawn this many times larger than the grid, then averaged down per cell. */
const MASK_SCALE = 4;

type Pointer = { x: number; y: number; radius: number };

/**
 * Decorative footer band (spec 06): a field of 0s and 1s that starts scrambled, resolves into "Traders at Carolina"
 * each time it scrolls into view, and lights up around the pointer. One canvas, no animation library. All the
 * decisions (grid, mask, load, hover, per-cell look) live in bitWordmarkScene.ts; this component owns the DOM.
 */
export function BitWordmark({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let disposed = false;
    let ready = false;
    let ratio = typeof IntersectionObserver === "undefined" ? 1 : 0;
    let phase: "scrambled" | "forming" = "scrambled";
    let startedAt = 0;
    let lastFrame = 0;
    let raf = 0;
    /** Latest pointer position in viewport coordinates; converted to canvas space each frame (the page may scroll). */
    let viewportPointer: Pointer | null = null;

    // Built by build(): the grid, the letter mask, per-cell settle thresholds and heat, and the two glyph sprites.
    let cols = 1;
    let rows = 1;
    let cellW = 8;
    let cellH = 8;
    let dpr = 1;
    let mask = new Uint8Array(1);
    let heat = new Float32Array(1);
    let thresholds = new Float32Array(1);
    let sprites: Record<"0" | "1", HTMLCanvasElement> | null = null;
    /** Pure white glyphs with a soft glow, drawn over cells the pointer is lighting (three cells wide, to hold the glow). */
    let hotSprites: Record<"0" | "1", HTMLCanvasElement> | null = null;

    const style = getComputedStyle(canvas);
    const sans = style.getPropertyValue("--font-public-sans").trim() || "system-ui, sans-serif";
    const title = style.getPropertyValue("--font-chivo").trim() || '"Arial Black", system-ui, sans-serif';
    const bone = style.getPropertyValue("--color-bone").trim() || "#ebeae4";
    const wideQuery = window.matchMedia("(min-width: 48rem)");

    /** Draws the wordmark once, big, then averages each cell's block of pixels into a 0–255 coverage value. */
    function measureLetters({ lines, cut, gap }: ReturnType<typeof wordmarkLayout>) {
      const w = cols * MASK_SCALE;
      const h = rows * MASK_SCALE;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return new Uint8Array(cols * rows);

      // Text width scales linearly with font size: fit the widest line to 94% of the band's width. The block then
      // sits low (lineBaselines) so the last line runs off the bottom edge, like a wordmark cropped by the page end.
      octx.font = `800 ${h}px ${title}`;
      const widest = Math.max(...lines.map((line) => octx.measureText(line).width));
      const size = (h * w * 0.94) / widest;
      octx.font = `800 ${size}px ${title}`;
      const capHeight = octx.measureText("H").actualBoundingBoxAscent || size * 0.69;
      const baselines = lineBaselines(lines.length, h, capHeight, cut, gap);
      octx.fillStyle = "#000";
      octx.textAlign = "center";
      octx.textBaseline = "alphabetic";
      lines.forEach((line, i) => octx.fillText(line, w / 2, baselines[i]));

      const px = octx.getImageData(0, 0, w, h).data;
      const coverage = new Float32Array(cols * rows);
      for (let y = 0; y < h; y++) {
        const rowBase = Math.floor(y / MASK_SCALE) * cols;
        for (let x = 0; x < w; x++) coverage[rowBase + Math.floor(x / MASK_SCALE)] += px[(y * w + x) * 4 + 3];
      }
      for (let i = 0; i < coverage.length; i++) coverage[i] /= MASK_SCALE * MASK_SCALE;
      return buildLetterMask(coverage);
    }

    function makeSprite(glyph: string) {
      const sprite = document.createElement("canvas");
      sprite.width = Math.ceil(cellW * dpr);
      sprite.height = Math.ceil(cellH * dpr);
      const sctx = sprite.getContext("2d");
      if (sctx) {
        sctx.fillStyle = bone;
        sctx.font = `700 ${cellH * dpr * 1.3}px ${sans}`;
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillText(glyph, sprite.width / 2, sprite.height / 2 + sprite.height * 0.04);
      }
      return sprite;
    }

    function makeHotSprite(glyph: string) {
      const sprite = document.createElement("canvas");
      sprite.width = Math.ceil(cellW * dpr * 3);
      sprite.height = Math.ceil(cellH * dpr * 3);
      const sctx = sprite.getContext("2d");
      if (sctx) {
        sctx.fillStyle = "#ffffff";
        sctx.shadowColor = "rgba(255, 255, 255, 0.95)";
        sctx.shadowBlur = cellH * dpr * 1.2;
        sctx.font = `700 ${cellH * dpr * 1.3}px ${sans}`;
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        const x = sprite.width / 2;
        const y = sprite.height / 2 + cellH * dpr * 0.04;
        // Twice: the first lays down the halo, the second thickens the core so the glyph itself is brighter.
        sctx.fillText(glyph, x, y);
        sctx.fillText(glyph, x, y);
      }
      return sprite;
    }

    function build() {
      const rect = canvas!.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const layout = wordmarkLayout(wideQuery.matches);
      ({ cols, rows } = buildGrid(rect.width, rect.height, layout.cell));
      cellW = rect.width / cols;
      cellH = rect.height / rows;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      mask = measureLetters(layout);
      heat = new Float32Array(cols * rows);
      thresholds = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) thresholds[r * cols + c] = settleThreshold(c, r);
      sprites = { "0": makeSprite("0"), "1": makeSprite("1") };
      hotSprites = { "0": makeHotSprite("0"), "1": makeHotSprite("1") };
      return true;
    }

    /** Re-heats the cells under the pointer; each keeps the hottest value it has been given. */
    function heatUnderPointer() {
      if (!viewportPointer) return;
      const rect = canvas!.getBoundingClientRect();
      const px = viewportPointer.x - rect.left;
      const py = viewportPointer.y - rect.top;
      const { radius } = viewportPointer;
      const c0 = Math.max(0, Math.floor((px - radius) / cellW));
      const c1 = Math.min(cols - 1, Math.ceil((px + radius) / cellW));
      const r0 = Math.max(0, Math.floor((py - radius) / cellH));
      const r1 = Math.min(rows - 1, Math.ceil((py + radius) / cellH));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const s = hoverStrength(Math.hypot((c + 0.5) * cellW - px, (r + 0.5) * cellH - py), radius);
          const i = r * cols + c;
          if (s > heat[i]) heat[i] = s;
        }
      }
    }

    function draw(now: number) {
      if (!sprites) return;
      const dt = lastFrame ? now - lastFrame : 16;
      lastFrame = now;

      const elapsed = phase === "forming" ? now - startedAt : 0;
      const progress = reduced ? 1 : phase === "forming" ? loadProgress(elapsed) : 0;
      const formed = reduced || (phase === "forming" && elapsed >= LOAD_TOTAL_MS);

      if (!reduced) {
        for (let i = 0; i < heat.length; i++) if (heat[i] > 0) heat[i] = decayHeat(heat[i], dt);
        heatUnderPointer();
      }

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const { glyph, alpha, lit } = cellState({
            col: c,
            row: r,
            isLetter: mask[i] === 1,
            time: now,
            settle: cellSettle(thresholds[i], progress),
            heat: heat[i],
            shimmer: formed && !reduced,
          });
          ctx!.globalAlpha = alpha;
          ctx!.drawImage(sprites[glyph], c * cellW, r * cellH, cellW, cellH);
          if (lit > 0.02 && hotSprites) {
            ctx!.globalAlpha = lit;
            ctx!.drawImage(hotSprites[glyph], (c - 1) * cellW, (r - 1) * cellH, cellW * 3, cellH * 3);
          }
        }
      }
      ctx!.globalAlpha = 1;
    }

    const shouldRun = () => ready && !reduced && ratio >= VISIBLE && !document.hidden;

    function frame(now: number) {
      raf = 0;
      if (!shouldRun()) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      if (shouldRun()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    /** Leaving view resets to scrambled (drawn once, so re-entry never flashes the formed state) and replays next time. */
    function onRatio(next: number) {
      ratio = next;
      if (!ready || reduced) return;
      if (ratio < VISIBLE) {
        phase = "scrambled";
        heat.fill(0);
        lastFrame = 0;
        draw(performance.now());
      } else if (ratio >= START && phase === "scrambled") {
        phase = "forming";
        startedAt = performance.now();
      }
      sync();
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => entries.forEach((e) => onRatio(e.intersectionRatio)), {
            threshold: [0, VISIBLE, START, 1],
          });
    observer?.observe(canvas);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (!ready || !build()) return;
            if (reduced) draw(0);
            else if (!raf) draw(performance.now());
          });

    const onMove = (e: PointerEvent) => {
      viewportPointer = { x: e.clientX, y: e.clientY, radius: e.pointerType === "touch" ? TOUCH_HOVER_RADIUS : HOVER_RADIUS };
    };
    const onLeave = () => {
      viewportPointer = null;
    };
    // A mouse click ends nothing: only a finger lifting does.
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") onLeave();
    };
    const onVisibility = () => sync();

    if (!reduced) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerdown", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointercancel", onLeave);
      canvas.addEventListener("pointerup", onUp);
      document.addEventListener("visibilitychange", onVisibility);
    }

    // Wait for the real fonts (the mask and sprites are drawn from them), then build and start.
    const fonts = typeof document.fonts?.load === "function" ? document.fonts : null;
    Promise.all([fonts?.load(`700 16px ${sans}`, "01"), fonts?.load(`800 16px ${title}`, "Traders at Carolina")])
      .catch(() => undefined)
      .then(() => {
        if (disposed || !build()) return;
        ready = true;
        resizeObserver?.observe(canvas);
        if (reduced) {
          draw(0);
        } else {
          draw(performance.now());
          onRatio(ratio);
        }
      });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  // Aspect ratios mirror wordmarkLayout (0.57 narrow, 0.28 from md up) so the band's height is reserved before the
  // canvas draws and the page never shifts.
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      role="presentation"
      className={`bit-wordmark block aspect-[100/57] w-full touch-pan-y select-none md:aspect-[100/28] ${className}`}
    />
  );
}
