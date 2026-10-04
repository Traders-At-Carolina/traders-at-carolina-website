"use client";

import { UserButton } from "@clerk/nextjs";
import { ArrowUpRight, Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ADMIN_SECTIONS, screenFor, sectionFor, sectionHref } from "@/lib/admin/nav";
import { cx } from "./ui/cx";
import { useModal } from "./ui/Dialog";

/** The TAC Admin mark (spec 11 §3.2). */
export function AdminMark() {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="flex size-7 items-center justify-center rounded-ui-md bg-ui-accent text-[0.625rem] font-bold tracking-wide text-white">
        TAC
      </span>
      <span className="text-ui-base font-semibold text-ui-text">Admin</span>
    </span>
  );
}

/** Sticky top bar with the five sections, View site and the account menu (spec 11 §3.2, §3.4). */
export function AdminTopBar() {
  const pathname = usePathname();
  const active = sectionFor(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ui-border bg-ui-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link href="/admin" aria-label="Admin overview" className="shrink-0 rounded-ui-md">
          <AdminMark />
        </Link>
        <nav aria-label="Sections" className="hidden h-full md:block">
          <ul className="flex h-full items-stretch gap-1">
            {ADMIN_SECTIONS.map((section) => {
              const current = section.id === active.id;
              return (
                <li key={section.id} className="flex">
                  <Link
                    href={sectionHref(section)}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "relative flex items-center px-3 text-ui-base font-medium transition-colors duration-150",
                      "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-ui-full after:transition-colors",
                      current ? "text-ui-text after:bg-ui-accent" : "text-ui-text-2 after:bg-transparent hover:text-ui-text",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden h-8 items-center gap-1 rounded-ui-md px-2.5 text-ui-label font-medium text-ui-text-2 transition-colors hover:bg-ui-subtle hover:text-ui-text sm:inline-flex">
            View site
            <ArrowUpRight aria-hidden className="size-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <div className="flex size-8 items-center justify-center">
            <UserButton />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            className="inline-flex size-9 items-center justify-center rounded-ui-md text-ui-text-2 hover:bg-ui-subtle hover:text-ui-text md:hidden"
          >
            <MenuIcon aria-hidden className="size-5" />
          </button>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/** Full-height sheet listing every section and screen, under 768px (spec 11 §3.4). */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const currentHref = screenFor(pathname)?.href;
  useModal(ref, open);

  return (
    <dialog
      ref={ref}
      aria-label="Admin menu"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-[min(20rem,100%)] max-w-none animate-ui-pop border-l border-ui-border bg-ui-surface p-0 text-ui-text shadow-ui-pop backdrop:bg-ui-text/40"
    >
      {open ? (
        <div className="flex h-full flex-col font-ui">
          <div className="flex h-14 items-center justify-between border-b border-ui-border px-4">
            <AdminMark />
            <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex size-9 items-center justify-center rounded-ui-md text-ui-text-2 hover:bg-ui-subtle">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <nav aria-label="All screens" className="flex-1 overflow-y-auto px-3 py-4">
            {ADMIN_SECTIONS.map((section) => (
              <div key={section.id} className="mb-4">
                <p className="px-2 text-ui-hint font-medium tracking-wide text-ui-text-3 uppercase">{section.label}</p>
                <ul className="mt-1">
                  {section.screens.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={href === currentHref ? "page" : undefined}
                        className={cx(
                          "flex min-h-11 items-center gap-3 rounded-ui-md px-2 text-ui-base font-medium",
                          href === currentHref ? "bg-ui-accent-soft text-ui-accent" : "text-ui-text hover:bg-ui-subtle",
                        )}
                      >
                        <Icon aria-hidden className="size-4" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-ui-border p-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 rounded-ui-md px-2 text-ui-base font-medium text-ui-text-2 hover:bg-ui-subtle">
              View site
              <ArrowUpRight aria-hidden className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

/** Pill tabs for the active section's screens (spec 11 §3.3). Hidden on Overview and single-screen sections. */
export function AdminSubNav() {
  const pathname = usePathname();
  const section = sectionFor(pathname);
  const currentHref = screenFor(pathname)?.href;
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [currentHref]);

  if (section.id === "overview" || section.screens.length < 2) return null;
  return (
    <div className="border-b border-ui-border bg-ui-surface">
      <nav aria-label={`${section.label} screens`} className="mx-auto max-w-7xl px-4 md:px-8">
        <ul className="flex h-12 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {section.screens.map(({ href, label, icon: Icon }) => {
            const current = href === currentHref;
            return (
              <li key={href} className="shrink-0">
                <Link
                  ref={current ? activeRef : undefined}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "flex h-8 items-center gap-2 rounded-ui-md px-3 text-ui-label font-medium transition-colors duration-150",
                    current ? "bg-ui-accent-soft text-ui-accent" : "text-ui-text-2 hover:bg-ui-subtle hover:text-ui-text",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
