"use client";

import { useEffect, useRef } from "react";
import {
  LOAD_TOTAL_MS,
  buildGrid,
  cellSettle,
  loadProgress,
  maskFromPixels,
  settleThreshold,
  type Glyph,
} from "@/components/bits/bitCore";
import {
  CAMERA_DISTANCE,
  EASE_MS,
  IDLE_DELAY_MS,
  REST_POSE,
  RETURN_EASE_MS,
  bitState,
  buildShell,
  depthAlpha,
  easePose,
  extrusionLayers,
  figureLayout,
  idlePose,
  layerShade,
  letterBounds,
  projectShell,
  sortByDepth,
  targetPose,
  type Pose,
  type Projection,
  type Shell,
} from "@/components/notfound/bit404Scene";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** The loop runs while at least this share of the figure is on screen (spec 10 §8). */
const VISIBLE = 0.1;
/** The "404" mask is drawn this many times larger than the grid, then averaged down per cell. */
const MASK_SCALE = 4;
const TEXT = "404";

const emptyProjection = (n: number): Projection => ({
  sx: new Float32Array(n),
  sy: new Float32Array(n),
  scale: new Float32Array(n),
  depth: new Float32Array(n),
});

/**
 * Decorative 404 figure (spec 10): a solid "404" extruded into a shell of navy 0s and 1s that decodes on load, keeps
 * glitching and turns to face the pointer anywhere on the page. One canvas with a hand-rolled projection; every
 * glyph is drawn flat, facing the viewer. All the decisions (shell, projection, pose, per-bit look) live in
 * bit404Scene.ts; this component owns the DOM.
 */
export function Bit404({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let disposed = false;
    let ready = false;
    let visible = typeof IntersectionObserver === "undefined";
    let raf = 0;
    let lastFrame = 0;
    let startedAt = 0;
    let pose: Pose = REST_POSE;
    /** Latest pointer position in viewport coordinates, or null once it has left the window or a touch ended. */
    let pointer: { x: number; y: number } | null = null;
    /** Last pointer movement; the idle sway starts IDLE_DELAY_MS after it (or after the figure first draws). */
    let lastMove = 0;
    let idleSince = -1;

    // Built by build(): the shell, its projection buffers and draw order, per-bit settle moments and the sprites.
    let cell = 9;
    let dpr = 1;
    let width = 1;
    let height = 1;
    let distance = 1;
    let shell: Shell = buildShell(new Uint8Array(0), 0, 0, 0);
    let projection = emptyProjection(0);
    let order = new Uint32Array(0);
    let thresholds = new Float32Array(0);
    let sprites: Record<Glyph, HTMLCanvasElement> | null = null;

    const style = getComputedStyle(canvas);
    const sans = style.getPropertyValue("--font-public-sans").trim() || "system-ui, sans-serif";
    const title = style.getPropertyValue("--font-chivo").trim() || '"Arial Black", system-ui, sans-serif';
    const navy = style.getPropertyValue("--color-navy").trim() || "#233265";
    const bone = style.getPropertyValue("--color-bone").trim() || "#ebeae4";
    const wideQuery = window.matchMedia("(min-width: 48rem)");

    /**
     * Draws "404" once, big and centered, and averages it down to a letter mask. It is as large as fits both `fit` of
     * the width and `capFit` of the height, so a short box (a short screen) shrinks it instead of clipping it.
     */
    function measureLetters(cols: number, rows: number, fit: number, capFit: number) {
      const w = cols * MASK_SCALE;
      const h = rows * MASK_SCALE;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return new Uint8Array(cols * rows);

      // Text width and cap height scale linearly with font size: measure once at size h, then scale to fit.
      octx.font = `800 ${h}px ${title}`;
      const probe = octx.measureText(TEXT);
      const size = h * Math.min((w * fit) / probe.width, (h * capFit) / (probe.actualBoundingBoxAscent || h * 0.72));
      octx.font = `800 ${size}px ${title}`;
      const capHeight = octx.measureText(TEXT).actualBoundingBoxAscent || size * 0.72;
      octx.fillStyle = "#000";
      octx.textAlign = "center";
      octx.textBaseline = "alphabetic";
      octx.fillText(TEXT, w / 2, (h + capHeight) / 2);
      return maskFromPixels(octx.getImageData(0, 0, w, h).data, cols, rows, MASK_SCALE);
    }

    /** A navy glyph, rendered a little larger than a cell so the nearest (scaled-up) bits stay sharp. */
    function makeSprite(glyph: Glyph) {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = Math.ceil(cell * dpr * 1.2);
      const sctx = sprite.getContext("2d");
      if (sctx) {
        sctx.fillStyle = navy;
        sctx.font = `700 ${sprite.height * 1.3}px ${sans}`;
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillText(glyph, sprite.width / 2, sprite.height / 2 + sprite.height * 0.04);
      }
      return sprite;
    }

    function build() {
      const rect = canvas!.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const layout = figureLayout(wideQuery.matches);
      const { cols, rows } = buildGrid(rect.width, rect.height, layout.cell);
      width = rect.width;
      height = rect.height;
      cell = width / cols;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);

      const mask = measureLetters(cols, rows, layout.fit, layout.capFit);
      const bounds = letterBounds(mask, cols, rows);
      shell = buildShell(mask, cols, rows, extrusionLayers(bounds ? bounds.r1 - bounds.r0 + 1 : 0));
      projection = emptyProjection(shell.count);
      order = Uint32Array.from({ length: shell.count }, (_, i) => i);
      thresholds = Float32Array.from({ length: shell.count }, (_, i) =>
        settleThreshold(shell.col[i], shell.row[i], shell.layer[i]),
      );
      distance = CAMERA_DISTANCE * Math.max(1, shell.width);
      sprites = { "0": makeSprite("0"), "1": makeSprite("1") };
      return true;
    }

    /** Where the figure should be heading: toward the pointer, back to rest, or swaying once idle. */
    function nextPose(now: number, dt: number): Pose {
      if (reduced) return REST_POSE;
      const idleFor = now - lastMove;
      if (idleFor < IDLE_DELAY_MS) {
        idleSince = -1;
        if (!pointer) return easePose(pose, REST_POSE, dt, RETURN_EASE_MS);
        const rect = canvas!.getBoundingClientRect();
        const target = targetPose(
          pointer.x - (rect.left + rect.width / 2),
          pointer.y - (rect.top + rect.height / 2),
          window.innerWidth,
          window.innerHeight,
        );
        return easePose(pose, target, dt, EASE_MS);
      }
      if (idleSince < 0) idleSince = now;
      return easePose(pose, idlePose(now - idleSince), dt, RETURN_EASE_MS);
    }

    function draw(now: number) {
      if (!sprites) return;
      const dt = lastFrame ? Math.min(now - lastFrame, 100) : 16;
      lastFrame = now;
      pose = nextPose(now, dt);

      const elapsed = now - startedAt;
      const progress = reduced ? 1 : loadProgress(elapsed);
      const shimmer = !reduced && elapsed >= LOAD_TOTAL_MS;

      projectShell(shell, pose, distance, projection);
      sortByDepth(order, projection.depth);
      let near = -Infinity;
      let far = Infinity;
      for (let i = 0; i < shell.count; i++) {
        const d = projection.depth[i];
        if (d > near) near = d;
        if (d < far) far = d;
      }

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = width / 2;
      const cy = height / 2;
      ctx!.fillStyle = bone;
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        const { glyph, alpha } = bitState({
          col: shell.col[i],
          row: shell.row[i],
          layer: shell.layer[i],
          time: now,
          settle: cellSettle(thresholds[i], progress),
          shimmer,
        });
        const size = cell * projection.scale[i];
        const x = cx + projection.sx[i] * cell - size / 2;
        const y = cy + projection.sy[i] * cell - size / 2;
        // Each bit sits on an opaque page-colored tile, so nearer bits hide the ones behind and the figure reads
        // as a solid. The half-pixel overlap keeps seams between neighbouring tiles from showing.
        ctx!.globalAlpha = 1;
        ctx!.fillRect(x - 0.25, y - 0.25, size + 0.5, size + 0.5);
        ctx!.globalAlpha = alpha * layerShade(shell.layer[i]) * depthAlpha(projection.depth[i], far, near);
        ctx!.drawImage(sprites[glyph], x, y, size, size);
      }
      ctx!.globalAlpha = 1;
    }

    const shouldRun = () => ready && !reduced && visible && !document.hidden;

    function frame(now: number) {
      raf = 0;
      if (!shouldRun()) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      if (shouldRun()) {
        if (!raf) {
          lastFrame = 0;
          raf = requestAnimationFrame(frame);
        }
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) =>
              entries.forEach((e) => {
                visible = e.intersectionRatio >= VISIBLE;
                sync();
              }),
            { threshold: [0, VISIBLE, 1] },
          );
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
      pointer = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
    };
    // relatedTarget is null only when the pointer leaves the window (or a touch ends).
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) pointer = null;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") pointer = null;
    };
    const onCancel = () => {
      pointer = null;
    };
    const onVisibility = () => sync();

    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      window.addEventListener("pointerout", onOut);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      document.addEventListener("visibilitychange", onVisibility);
    }

    // Wait for the real fonts (the mask and sprites are drawn from them), then build and start the decode.
    const fonts = typeof document.fonts?.load === "function" ? document.fonts : null;
    Promise.all([fonts?.load(`700 16px ${sans}`, "01"), fonts?.load(`800 16px ${title}`, TEXT)])
      .catch(() => undefined)
      .then(() => {
        if (disposed || !build()) return;
        ready = true;
        startedAt = lastMove = performance.now();
        resizeObserver?.observe(canvas);
        if (reduced) {
          draw(0);
        } else {
          draw(startedAt);
          sync();
        }
      });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  // The figure grows to fill the height its flex column leaves (the 404 page is one screen tall), between a floor and
  // a cap tied to its width. Size containment stops the canvas's pixel buffer (its intrinsic aspect ratio) from
  // propping the column taller than the screen. CSS sets that height before the canvas draws, so nothing shifts.
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      role="presentation"
      className={`bit-404 mx-auto block h-0 max-h-[min(28rem,62vw)] min-h-36 w-full max-w-[56rem] flex-1 touch-pan-y [contain:size] select-none ${className}`}
    />
  );
}
