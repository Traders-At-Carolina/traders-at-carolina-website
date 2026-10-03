"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import { Wordmark } from "@/components/Wordmark";
import type { NavLink } from "@/content/nav";
import { trackAttrs } from "@/lib/analytics/attributes";
import { useFloatingHeader } from "@/lib/use-floating-header";
import { useLogoTuck } from "@/lib/use-logo-tuck";

type SiteHeaderClientProps = {
  links: NavLink[];
  applyHref: string;
  applyExternal: boolean;
  /** ISO instant; once it passes, Apply falls back to /apply in the browser (spec 05 §3). */
  applyDeadline?: string;
};

type LinkBox = { x: number; w: number };

const SHELL_BASE =
  "relative mx-auto flex max-w-page items-center justify-between border motion-safe:duration-[450ms] motion-safe:ease-soft " +
  "motion-safe:[transition-property:width,height,margin,padding,border-radius,background-color,border-color,box-shadow,backdrop-filter]";

const SHELL_DOCKED =
  "h-16 w-full rounded-none border-transparent bg-transparent px-5 md:h-20 md:px-8 lg:px-12";

const FLOAT_SHADOW = "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)]";

const SHELL_FLOATING =
  "pointer-events-auto mt-2 h-[3.25rem] w-[calc(100%-1.5rem)] rounded-[1rem] border-rule bg-bone/85 pr-1 pl-5 " +
  `${FLOAT_SHADOW} backdrop-blur-md md:mt-3 md:h-12 md:w-[min(calc(100%-2rem),52rem)] md:pr-1.5`;

/**
 * Sticky header that docks over the hero and floats as a rounded bar once the hero's text reaches it,
 * with a boxy highlight that springs between the nav links and a dropdown card for mobile (00 §10).
 */
export function SiteHeaderClient({ links, applyHref, applyExternal, applyDeadline }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const floating = useFloatingHeader(headerRef, pathname);
  useLogoTuck(headerRef, pathname);

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

  // The highlight trails the pointer (70ms delay, gentle spring) between links, but snaps into place when it first appears.
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

  // The mobile menu is a dropdown disclosure, not a modal: Esc or a press outside the header closes it.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    header?.querySelector<HTMLElement>("#mobile-menu a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (header && !header.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  // With a mouse, the collapsed menu opens when the pointer reaches the menu button and closes when it leaves the header.
  const canHover = () => window.matchMedia("(hover: hover)").matches;

  const applyButton = ({ placement, ...props }: { fullWidth?: boolean; size?: "compact" | "sm"; placement: string }) => {
    const button = (href: string, external: boolean) => (
      <Button href={href} external={external} shape="rounded" track={{ cta: "apply", placement }} {...props}>
        Apply
      </Button>
    );
    return applyDeadline ? (
      <DeadlineSwitch deadline={applyDeadline} before={button(applyHref, applyExternal)} after={button("/apply", false)} />
    ) : (
      button(applyHref, applyExternal)
    );
  };

  return (
    <header
      ref={headerRef}
      data-floating={floating}
      onMouseLeave={() => {
        if (canHover()) close();
      }}
      onBlur={(event) => {
        // Tabbing out of the header closes the menu; a press on non-focusable card padding does not.
        if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close();
      }}
      className={`sticky top-0 z-40 h-16 transition-colors duration-200 md:h-20 ${
        floating ? "pointer-events-none bg-transparent" : "bg-bone"
      }`}
    >
      <div aria-hidden="true" data-nav-grid className="graph-paper-nav pointer-events-none absolute inset-0" />
      <div className={`${SHELL_BASE} ${floating ? SHELL_FLOATING : SHELL_DOCKED}`}>
        <Wordmark tuck />

        <nav aria-label="Primary" className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <span
              aria-hidden="true"
              data-testid="nav-indicator"
              data-target={line.at ?? ""}
              data-visible={line.shown !== null}
              className={`pointer-events-none absolute inset-y-0 left-0 w-0 rounded-[0.625rem] bg-wash ${
                line.shown !== null ? "opacity-100" : "opacity-0"
              } ${
                line.snap
                  ? "motion-safe:[transition:opacity_150ms_ease-out]"
                  : "motion-safe:[transition:transform_700ms_var(--ease-spring)_70ms,width_700ms_var(--ease-spring)_70ms,opacity_150ms_ease-out]"
              }`}
              style={box ? { transform: `translateX(${box.x}px)`, width: `${box.w}px` } : undefined}
            />
            <ul
              className="relative flex items-center gap-1"
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
                    {...trackAttrs({ cta: "nav", target: link.label, placement: "header" })}
                    aria-current={i === activeIndex ? "page" : undefined}
                    onPointerEnter={() => setPointed(i)}
                    onFocus={() => setPointed(i)}
                    className={`flex min-h-9 items-center rounded-[0.625rem] px-3.5 text-nav font-medium transition-colors duration-150 ${
                      i === target ? "text-navy" : "hover:text-navy"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {applyButton({ size: "sm", placement: "header" })}
        </nav>

        {/* Mobile: Apply stays one tap away beside the menu button; the open menu has its own full-width Apply. */}
        <div className="flex items-center gap-2 md:hidden">
          {open ? null : applyButton({ size: "compact", placement: "header-mobile" })}
          <button
            ref={menuButtonRef}
            type="button"
            className={`inline-flex min-h-11 min-w-11 items-center justify-center ${floating ? "" : "-mr-2.5"}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onMouseEnter={() => {
              if (canHover()) setOpen(true);
            }}
            onClick={(event) => {
              // A real mouse click on a hover-opened menu keeps it open; keyboard (detail 0) and touch still toggle.
              if (canHover() && event.detail > 0) setOpen(true);
              else setOpen((value) => !value);
            }}
          >
            {open ? <X aria-hidden="true" strokeWidth={1.5} /> : <Menu aria-hidden="true" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className={`pointer-events-auto absolute inset-x-3 top-full mt-2 rounded-[1rem] border border-rule bg-bone p-5 ${FLOAT_SHADOW} motion-safe:animate-[menu-in_250ms_var(--ease-soft)] md:hidden`}
        >
          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    {...trackAttrs({ cta: "nav", target: link.label, placement: "menu" })}
                    onClick={close}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`-mx-3 flex min-h-12 items-center rounded-[0.625rem] px-3 font-display text-h3 active:bg-wash ${
                      isActive(link.href) ? "bg-wash text-navy" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4" onClick={close}>
            {applyButton({ fullWidth: true, placement: "menu" })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
