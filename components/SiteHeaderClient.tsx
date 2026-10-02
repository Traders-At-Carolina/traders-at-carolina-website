"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import { Wordmark } from "@/components/Wordmark";
import type { NavLink } from "@/content/nav";

type SiteHeaderClientProps = {
  links: NavLink[];
  applyHref: string;
  applyExternal: boolean;
  /** ISO instant; once it passes, Apply falls back to /apply in the browser (spec 05 §3). */
  applyDeadline?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Sticky header with hairline-on-scroll and a full-screen mobile menu (00 §10). */
export function SiteHeaderClient({ links, applyHref, applyExternal, applyDeadline }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    document.body.style.overflow = "hidden";
    // Hide the page behind the overlay from assistive tech and the tab order while the menu is open.
    const behind = Array.from(document.body.children).filter((el) => header && !el.contains(header));
    behind.forEach((el) => el.setAttribute("inert", ""));
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
      behind.forEach((el) => el.removeAttribute("inert"));
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const close = () => setOpen(false);

  const applyButton = (props: { fullWidth?: boolean; size?: "compact" }) => {
    const button = (href: string, external: boolean) => (
      <Button href={href} external={external} {...props}>
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
      className={`sticky top-0 z-40 border-b bg-bone transition-colors duration-150 ${
        scrolled || open ? "border-rule" : "border-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-nav font-medium ${
                isActive(link.href) ? "underline decoration-1 underline-offset-4" : "hover:text-navy"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {applyButton({})}
        </nav>

        {/* Mobile: Apply stays one tap away beside the menu button; the open menu has its own full-width Apply. */}
        <div className="flex items-center gap-2 md:hidden">
          {open ? null : applyButton({ size: "compact" })}
          <button
            ref={menuButtonRef}
            type="button"
            className="-mr-2.5 inline-flex min-h-11 min-w-11 items-center justify-center"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" strokeWidth={1.5} /> : <Menu aria-hidden="true" strokeWidth={1.5} />}
          </button>
        </div>
      </Container>

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
              {applyButton({ fullWidth: true })}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
