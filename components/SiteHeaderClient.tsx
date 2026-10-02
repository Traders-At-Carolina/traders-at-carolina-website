"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { Wordmark } from "@/components/Wordmark";
import type { NavLink } from "@/content/nav";
import { useFloatingHeader } from "@/lib/use-floating-header";

type SiteHeaderClientProps = {
  links: NavLink[];
  applyHref: string;
  applyExternal: boolean;
};

type LinkBox = { x: number; w: number };

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SHELL_BASE =
  "mx-auto flex max-w-page items-center justify-between border motion-safe:duration-[450ms] motion-safe:ease-soft " +
  "motion-safe:[transition-property:width,height,margin,padding,border-radius,background-color,border-color,box-shadow,backdrop-filter]";

const SHELL_DOCKED =
  "h-16 w-full rounded-none border-transparent bg-transparent px-5 md:h-20 md:px-8 lg:px-12";

const SHELL_FLOATING =
  "pointer-events-auto mt-2 h-[3.25rem] w-[calc(100%-1.5rem)] rounded-[2rem] border-rule bg-bone/85 pr-1 pl-5 " +
  "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md md:mt-3 md:h-14 md:w-[min(calc(100%-2rem),64rem)] md:pr-1.5 md:pl-6";

/**
 * Sticky header that docks over the hero and floats as a capsule once the hero scrolls away,
 * with a spring underline shared by the nav links and a full-screen mobile menu (00 §10).
 */
export function SiteHeaderClient({ links, applyHref, applyExternal }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const scrolledPastHero = useFloatingHeader(headerRef, pathname);
  const floating = scrolledPastHero && !open;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeIndex = links.findIndex((link) => isActive(link.href));

  // Hovered or focused link; null means "rest on the active page".
  const [pointed, setPointed] = useState<number | null>(null);
  const [pointedPath, setPointedPath] = useState(pathname);
  if (pointedPath !== pathname) {
    setPointedPath(pathname);
    setPointed(null);
  }

  const [boxes, setBoxes] = useState<LinkBox[] | null>(null);
  const measure = useCallback(() => {
    setBoxes(linkRefs.current.map((el) => ({ x: el?.offsetLeft ?? 0, w: el?.offsetWidth ?? 0 })));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, links]);

  // The underline springs between links, but snaps into place when it first appears.
  const target = pointed ?? (activeIndex >= 0 ? activeIndex : null);
  const shown = boxes ? target : null;
  const [line, setLine] = useState<{ shown: number | null; at: number | null; snap: boolean }>({
    shown: null,
    at: null,
    snap: true,
  });
  if (line.shown !== shown) {
    setLine({ shown, at: shown ?? line.at, snap: line.shown === null });
  }
  const box = boxes && line.at !== null ? boxes[line.at] : undefined;

  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    document.body.style.overflow = "hidden";
    header?.querySelector<HTMLElement>("#mobile-menu a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !header) return;
      const focusable = Array.from(header.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      ref={headerRef}
      data-floating={floating}
      className={`sticky top-0 z-40 h-16 transition-colors duration-200 md:h-20 ${
        floating ? "pointer-events-none bg-transparent" : "bg-bone"
      }`}
    >
      <div className={`${SHELL_BASE} ${floating ? SHELL_FLOATING : SHELL_DOCKED}`}>
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <div className="relative">
            <ul
              className="flex items-center gap-8"
              onPointerLeave={() => setPointed(null)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPointed(null);
              }}
            >
              {links.map((link, i) => (
                <li key={link.href}>
                  <Link
                    ref={(el) => {
                      linkRefs.current[i] = el;
                    }}
                    data-nav-link
                    href={link.href}
                    aria-current={i === activeIndex ? "page" : undefined}
                    onPointerEnter={() => setPointed(i)}
                    onFocus={() => setPointed(i)}
                    className={`block py-2 text-nav font-medium transition-colors duration-150 ${
                      i === target ? "text-navy" : "hover:text-navy"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <span
              aria-hidden="true"
              data-testid="nav-indicator"
              data-target={line.at ?? ""}
              data-visible={line.shown !== null}
              className={`pointer-events-none absolute bottom-1 left-0 h-px w-px origin-left bg-navy ${
                line.shown !== null ? "opacity-100" : "opacity-0"
              } ${
                line.snap
                  ? "motion-safe:[transition:opacity_150ms_ease-out]"
                  : "motion-safe:[transition:transform_650ms_var(--ease-bounce),opacity_150ms_ease-out]"
              }`}
              style={box ? { transform: `translateX(${box.x}px) scaleX(${box.w})` } : undefined}
            />
          </div>
          <Button href={applyHref} external={applyExternal} shape="pill">
            Apply
          </Button>
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center md:hidden ${floating ? "" : "-mr-2.5"}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" strokeWidth={1.5} /> : <Menu aria-hidden="true" strokeWidth={1.5} />}
        </button>
      </div>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-bone md:hidden">
          <Container className="flex flex-col gap-10 py-10">
            <nav aria-label="Mobile">
              <ul className="flex flex-col gap-6">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`font-display text-h2 ${isActive(link.href) ? "text-navy" : ""}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div onClick={close}>
              <Button href={applyHref} external={applyExternal} shape="pill" fullWidth>
                Apply
              </Button>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
