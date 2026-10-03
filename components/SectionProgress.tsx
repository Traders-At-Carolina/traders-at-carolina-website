"use client";

import { useEffect, useState } from "react";

type Rail = { progress: number; ticks: number[]; current: number };

const EMPTY: Rail = { progress: 0, ticks: [], current: -1 };

/** Where each section starts, as a fraction of the scrollable height, and which one the reading line is in. */
function measure(): Rail {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[aria-labelledby]"));
  const range = document.documentElement.scrollHeight - window.innerHeight;
  if (sections.length < 2 || range <= 0) return EMPTY;
  const y = window.scrollY;
  const line = y + window.innerHeight * 0.4;
  let current = -1;
  const ticks = sections.map((s, i) => {
    const top = s.getBoundingClientRect().top + y;
    if (top <= line) current = i;
    return Math.min(1, Math.max(0, top / range));
  });
  return { progress: Math.min(1, Math.max(0, y / range)), ticks, current };
}

/**
 * A thin line down the left edge: it fills as the page scrolls, with a tick where each section begins and the
 * current section's tick emphasised. Decorative; hidden on small screens and when a page has under two sections.
 */
export function SectionProgress() {
  const [rail, setRail] = useState<Rail>(EMPTY);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setRail(measure());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, []);

  if (rail.ticks.length === 0) return null;

  return (
    <div aria-hidden="true" data-testid="section-progress" className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-3 md:block">
      <div className="absolute inset-y-0 left-0 w-px bg-rule" />
      <div className="absolute left-0 top-0 w-px origin-top bg-navy" style={{ height: "100%", transform: `scaleY(${rail.progress})` }} />
      {rail.ticks.map((t, i) => (
        <span
          key={i}
          className={`absolute left-0 h-px transition-[width,background-color] duration-300 motion-reduce:transition-none ${i === rail.current ? "w-3 bg-navy" : "w-1.5 bg-rule-strong"}`}
          style={{ top: `${t * 100}%` }}
        />
      ))}
    </div>
  );
}
