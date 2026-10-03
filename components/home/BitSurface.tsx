"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import {
  AXIS_LABELS,
  SPOTLIGHT_RADIUS,
  TOUCH_SPOTLIGHT_RADIUS,
  bitCell,
  cellSize,
  clampPolar,
  createRaster,
  easeScale,
  fitScale,
  initialCamera,
  labelOpacity,
  labelPosition,
  makeView,
  rasterize,
  stepCamera,
} from "@/components/home/bitSurfaceScene";
import { NK, NT } from "@/components/home/volSurfaceScene";
import { LOAD_TOTAL_MS, buildGrid, cellSettle, decayHeat, hoverStrength, loadProgress, settleThreshold } from "@/lib/bit-field";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { surfaceGrid, type VolParams } from "@/lib/vol-surface";

type BitSurfaceProps = {
  params: VolParams;
  /** Whether the idle spin runs (off while the user is interacting, offscreen or under reduced motion). */
  animate: boolean;
  label: string;
  onInteractStart: () => void;
  onInteractEnd: () => void;
};

/** Figure visibility: the loop runs above VISIBLE, and the decode starts at START (spec 01 §3.1). */
const VISIBLE = 0.1;
const START = 0.4;
/** Radians turned per figure-height of drag, matching the old OrbitControls feel. */
const DRAG_SPEED = 2 * Math.PI;
const KEY_STEP = 0.2;

type Pointer = { x: number; y: number; radius: number };

/**
 * Fig. 1 on Home, drawn entirely in 1s and 0s (spec 01 §3.1): the implied-volatility surface, rasterized every frame
 * onto a grid of navy glyphs on one canvas. It decodes out of scrambled bits once the Home intro has finished, then
 * spins, glitches and lights up around the pointer; drag or the arrow keys rotate it. All the decisions (projection,
 * fit, raster, per-cell look, camera) live in bitSurfaceScene.ts; this component owns the DOM.
 */
export function BitSurface({ params, animate, label, onInteractStart, onInteractEnd }: BitSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const camera = useRef(initialCamera());
  /** Latest props for the render loop, which outlives any one render. */
  const live = useRef({ params, animate });
  /** Latest pointer position in viewport coordinates; converted to canvas space each frame (the page may scroll). */
  const pointer = useRef<Pointer | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  /** Draws one frame when the loop isn't running (reduced motion, or between observer callbacks). */
  const redraw = useRef(() => {});
  const labelSpans = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    live.current = { params, animate };
    redraw.current();
  }, [params, animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let disposed = false;
    let ready = false;
    let ratio = typeof IntersectionObserver === "undefined" ? 1 : 0;
    let introDone = !document.documentElement.classList.contains("intro");
    let phase: "waiting" | "forming" = "waiting";
    let startedAt = 0;
    let lastFrame = 0;
    let raf = 0;

    // Built by build(): the grid, per-cell buffers and the glyph sprites.
    let cols = 1;
    let rows = 1;
    let cellW = 8;
    let cellH = 8;
    let dpr = 1;
    let raster = createRaster(1, 1);
    let heat = new Float32Array(1);
    let thresholds = new Float32Array(1);
    let sprites: Record<"0" | "1", HTMLCanvasElement> | null = null;
    /** Navy glyphs with a soft glow, drawn over the bits the pointer is lighting (three cells wide, to hold the glow). */
    let hotSprites: Record<"0" | "1", HTMLCanvasElement> | null = null;
    /** Drawn scale in cells per scene unit; 0 snaps to the fitted value on the next frame. */
    let scale = 0;
    const values = new Float32Array(NK * NT);
    let valuesFor: VolParams | null = null;

    const style = getComputedStyle(canvas);
    const sans = style.getPropertyValue("--font-public-sans").trim() || "system-ui, sans-serif";
    const navy = style.getPropertyValue("--color-navy").trim() || "#233265";
    const wideQuery = window.matchMedia("(min-width: 48rem)");

    function makeSprite(glyph: string, hot: boolean) {
      const span = hot ? 3 : 1;
      const sprite = document.createElement("canvas");
      sprite.width = Math.ceil(cellW * dpr * span);
      sprite.height = Math.ceil(cellH * dpr * span);
      const sctx = sprite.getContext("2d");
      if (sctx) {
        sctx.fillStyle = navy;
        if (hot) {
          sctx.shadowColor = navy;
          sctx.shadowBlur = cellH * dpr * 1.1;
        }
        sctx.font = `700 ${cellH * dpr * 1.3}px ${sans}`;
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillText(glyph, sprite.width / 2, sprite.height / 2 + cellH * dpr * 0.04);
      }
      return sprite;
    }

    function build() {
      const rect = canvas!.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      ({ cols, rows } = buildGrid(rect.width, rect.height, cellSize(wideQuery.matches)));
      cellW = rect.width / cols;
      cellH = rect.height / rows;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      raster = createRaster(cols, rows);
      heat = new Float32Array(cols * rows);
      thresholds = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) thresholds[r * cols + c] = settleThreshold(c, r);
      sprites = { "0": makeSprite("0", false), "1": makeSprite("1", false) };
      hotSprites = { "0": makeSprite("0", true), "1": makeSprite("1", true) };
      scale = 0;
      return true;
    }

    /** Re-heats the cells under the pointer; each keeps the hottest value it has been given. */
    function heatUnderPointer() {
      const p = pointer.current;
      if (!p) return;
      const rect = canvas!.getBoundingClientRect();
      const px = p.x - rect.left;
      const py = p.y - rect.top;
      const c0 = Math.max(0, Math.floor((px - p.radius) / cellW));
      const c1 = Math.min(cols - 1, Math.ceil((px + p.radius) / cellW));
      const r0 = Math.max(0, Math.floor((py - p.radius) / cellH));
      const r1 = Math.min(rows - 1, Math.ceil((py + p.radius) / cellH));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const s = hoverStrength(Math.hypot((c + 0.5) * cellW - px, (r + 0.5) * cellH - py), p.radius);
          const i = r * cols + c;
          if (s > heat[i]) heat[i] = s;
        }
      }
    }

    function draw(now: number) {
      if (!sprites || !hotSprites) return;
      const dt = lastFrame ? Math.min(now - lastFrame, 100) : 16;
      lastFrame = now;

      const cam = camera.current;
      if (!reduced) stepCamera(cam, dt / 1000, live.current.animate && !drag.current);
      const goal = fitScale(cols, rows, cam.azimuth, cam.polar);
      scale = scale && !reduced ? easeScale(scale, goal, dt / 1000) : goal;
      const { params } = live.current;
      if (params !== valuesFor) {
        surfaceGrid(params, NK, NT, values);
        valuesFor = params;
      }
      const view = makeView(cam.azimuth, cam.polar, scale, cols, rows);
      rasterize(values, view, raster);

      const elapsed = phase === "forming" ? now - startedAt : 0;
      const progress = reduced ? 1 : phase === "forming" ? loadProgress(elapsed) : 0;

      // Labels follow their anchors and fade in with the decode, and out as their axis turns away.
      AXIS_LABELS.forEach(({ at, facing }, i) => {
        const el = labelSpans.current[i];
        if (!el) return;
        const [c, r] = labelPosition(view, at);
        const opacity = labelOpacity(cam.azimuth, facing) * progress;
        el.style.transform = `translate(${c * cellW}px, ${r * cellH}px) translate(-50%, -50%)`;
        el.style.opacity = String(opacity);
        el.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });
      const shimmer = !reduced && phase === "forming" && elapsed >= LOAD_TOTAL_MS;
      if (!reduced) {
        for (let i = 0; i < heat.length; i++) if (heat[i] > 0) heat[i] = decayHeat(heat[i], dt);
        heatUnderPointer();
      }

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { kind, vol, under } = raster;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const { glyph, alpha, lit } = bitCell({
            col: c,
            row: r,
            cols,
            rows,
            kind: kind[i],
            vol: vol[i],
            under: under[i] === 1,
            time: now,
            settle: reduced ? 1 : cellSettle(thresholds[i], progress),
            heat: heat[i],
            shimmer,
          });
          if (alpha < 0.01) continue;
          ctx!.globalAlpha = alpha;
          ctx!.drawImage(sprites[glyph], c * cellW, r * cellH, cellW, cellH);
          if (lit > 0.02) {
            ctx!.globalAlpha = lit * 0.5;
            ctx!.drawImage(hotSprites[glyph], (c - 1) * cellW, (r - 1) * cellH, cellW * 3, cellH * 3);
          }
        }
      }
      ctx!.globalAlpha = 1;
    }

    const shouldRun = () => ready && !reduced && ratio >= VISIBLE && !document.hidden;

    /** The decode plays once, the first time the figure is well in view after the Home intro has gone. */
    function maybeStart() {
      if (phase === "waiting" && introDone && ratio >= START) {
        phase = "forming";
        startedAt = performance.now();
      }
    }

    function frame(now: number) {
      raf = 0;
      if (!shouldRun()) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      maybeStart();
      if (shouldRun()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastFrame = 0;
      }
    }

    redraw.current = () => {
      if (ready && !raf) draw(performance.now());
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) =>
              entries.forEach((e) => {
                ratio = e.intersectionRatio;
                sync();
              }),
            { threshold: [0, VISIBLE, START, 1] },
          );
    observer?.observe(canvas);

    // lib/intro.ts drops html.intro when the Home intro ends (or is skipped); the decode waits for it.
    const introObserver = introDone
      ? null
      : new MutationObserver(() => {
          if (document.documentElement.classList.contains("intro")) return;
          introDone = true;
          introObserver?.disconnect();
          sync();
        });
    introObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            // Resizing the canvas clears it: redraw at once rather than leaving it blank until the next frame.
            if (ready && build()) draw(performance.now());
          });

    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);

    // Wait for the real font (the glyph sprites are drawn from it), then build and start.
    const fonts = typeof document.fonts?.load === "function" ? document.fonts : null;
    Promise.resolve(fonts?.load(`700 16px ${sans}`, "01"))
      .catch(() => undefined)
      .then(() => {
        if (disposed || !build()) return;
        ready = true;
        resizeObserver?.observe(canvas);
        draw(performance.now());
        sync();
      });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      introObserver?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      redraw.current = () => {};
    };
  }, [reduced]);

  function spotlight(e: PointerEvent<HTMLDivElement>) {
    pointer.current = { x: e.clientX, y: e.clientY, radius: e.pointerType === "touch" ? TOUCH_SPOTLIGHT_RADIUS : SPOTLIGHT_RADIUS };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    spotlight(e);
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    // Touch keeps the browser's own handling, so a vertical swipe can still take over and scroll the page. Capture
    // throws for a pointer the browser doesn't know (synthetic events); the drag works without it.
    if (e.pointerType !== "touch") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    onInteractStart();
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    spotlight(e);
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const turn = DRAG_SPEED / (e.currentTarget.clientHeight || 1);
    const cam = camera.current;
    cam.azimuth -= (e.clientX - d.x) * turn;
    cam.polar = clampPolar(cam.polar - (e.clientY - d.y) * turn);
    d.x = e.clientX;
    d.y = e.clientY;
    redraw.current();
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    // A mouse click ends nothing for the spotlight: only a finger lifting (or a cancelled touch) does.
    if (e.pointerType === "touch" || e.type === "pointercancel") pointer.current = null;
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    onInteractEnd();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onInteractStart();
    camera.current.azimuth += step;
    onInteractEnd();
    redraw.current();
  }

  return (
    <div
      role="img"
      aria-label={`${label} Use the left and right arrow keys to rotate.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={() => {
        pointer.current = null;
      }}
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
      {AXIS_LABELS.map(({ text, kind }, i) => (
        <span
          key={text}
          ref={(el) => {
            labelSpans.current[i] = el;
          }}
          aria-hidden="true"
          // A bone halo lifts the text off any bits behind it.
          className={`pointer-events-none invisible absolute top-0 left-0 font-sans leading-none whitespace-nowrap tabular [text-shadow:0_0_3px_var(--color-bone),0_0_3px_var(--color-bone),0_0_6px_var(--color-bone)] ${
            kind === "title" ? "text-[11px] font-medium text-ink-2" : "text-[10px] text-ink-3"
          }`}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
