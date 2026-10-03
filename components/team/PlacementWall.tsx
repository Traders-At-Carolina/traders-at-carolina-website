"use client";

import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import type { CompanyMark } from "@/content/types";

type PlacementWallProps = {
  companies: CompanyMark[];
  /** `inverse` draws bone marks and hairlines for black backgrounds (the footer, spec 07 §3.3). */
  tone?: "default" | "inverse";
};

/** Idle drift, px per second. */
const DRIFT = 24;
/** How fast a flick's momentum dies away, per second. */
const FRICTION = 4;
const MAX_FLICK = 3000;

function Cells({ companies, tone = "default" }: PlacementWallProps) {
  const inverse = tone === "inverse";
  return companies.map((company) => (
    <li key={company.name} className="flex h-28 w-48 shrink-0 flex-col items-center justify-center gap-3 px-4 lg:h-32">
      {/* Marks show in their own colours on bone (00 §7.5 exception). On black (inverse) they're flattened to bone,
          since dark marks like JPMorgan's would disappear. The caption names the firm because some marks (Infragrid's
          bare square) say nothing alone, so the image is decorative. */}
      <Image
        src={company.logo}
        alt=""
        draggable={false}
        className={`h-auto max-h-8 w-auto max-w-full object-contain ${inverse ? "opacity-70 brightness-0 invert" : ""}`}
      />
      <span className={`text-caption ${inverse ? "text-bone" : "text-ink-2"}`}>{company.name}</span>
    </li>
  ));
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Team header art: the firms club members have worked at, as a slow looping strip that fades out at both edges (spec 04 §4.1).
 * It drifts on its own, can be dragged or flicked either way, and picks the drift back up when let go. The list is
 * repeated once so the loop never shows a seam; the copy is aria-hidden. Layout and the mask live in globals.css
 * (.logo-strip); with reduced motion the strip is a static wrapped row and none of the motion below runs.
 */
export function PlacementWall({ companies, tone = "default" }: PlacementWallProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Mutable motion state; kept out of React state because it changes every frame.
  const motion = useRef({ x: 0, velocity: 0, dragging: false, hovered: false, lastX: 0, lastTime: 0 });

  /** Writes the offset to the track, wrapping it to one list's width so the loop is endless in both directions. */
  const render = () => {
    const track = trackRef.current;
    if (!track) return;
    const m = motion.current;
    const width = track.querySelector("ul")?.offsetWidth ?? 0;
    if (width > 0) m.x = ((m.x % width) + width) % width;
    track.style.transform = `translate3d(${-m.x}px, 0, 0)`;
  };

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const m = motion.current;
      if (prefersReducedMotion()) {
        if (trackRef.current?.style.transform) trackRef.current.style.transform = "";
        m.x = 0;
        m.velocity = 0;
      } else if (!m.dragging) {
        // Drift pauses while the pointer rests on the strip; a flick's momentum still plays out.
        m.x += (m.velocity + (m.hovered ? 0 : DRIFT)) * dt;
        m.velocity *= Math.exp(-FRICTION * dt);
        render();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || prefersReducedMotion()) return;
    const m = motion.current;
    m.dragging = true;
    m.velocity = 0;
    m.lastX = e.clientX;
    m.lastTime = performance.now();
    stripRef.current?.setAttribute("data-dragging", "");
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (!m.dragging) return;
    const now = performance.now();
    const dx = e.clientX - m.lastX;
    const dt = (now - m.lastTime) / 1000;
    m.x -= dx;
    // Smoothed pointer speed, handed to the drift as momentum on release.
    if (dt > 0) m.velocity = Math.max(-MAX_FLICK, Math.min(MAX_FLICK, 0.7 * m.velocity + 0.3 * (-dx / dt)));
    m.lastX = e.clientX;
    m.lastTime = now;
    render();
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (!m.dragging) return;
    m.dragging = false;
    stripRef.current?.removeAttribute("data-dragging");
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return (
    <Reveal>
      <Eyebrow tone={tone}>{"Where we've worked"}</Eyebrow>
      <div
        ref={stripRef}
        className={`logo-strip mt-6 border-y ${tone === "inverse" ? "border-rule-inverse" : "border-rule"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => (motion.current.hovered = true)}
        onPointerLeave={() => (motion.current.hovered = false)}
      >
        <div ref={trackRef} className="logo-strip-track">
          <ul className="logo-strip-list">
            <Cells companies={companies} tone={tone} />
          </ul>
          <ul aria-hidden="true" className="logo-strip-list logo-strip-copy">
            <Cells companies={companies} tone={tone} />
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
