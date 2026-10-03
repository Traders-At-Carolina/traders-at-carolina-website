"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/games", label: "Game scores" },
] as const;

/** Console sections. Editors for photos, officers, tracks, sponsors and placements join this list in phases 3–4. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {LINKS.map((link) => {
          const current = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-[0.625rem] px-3 text-nav font-medium transition-colors duration-150 ${
                  current ? "bg-wash text-navy" : "text-ink-2 hover:text-navy"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
