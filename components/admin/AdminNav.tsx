"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Console sidebar in the spec 06 §6.0 groups. Only screens that exist are listed; later phases add Members, Officers,
 * Recruiting, Sponsors, Placements, Tracks, Events, Resources, Announcements, Portal settings and Analytics.
 */
const GROUPS = [
  {
    label: "Club",
    links: [
      { href: "/admin/members", label: "Members" },
      { href: "/admin/officers", label: "Officers" },
      { href: "/admin/admins", label: "Admins" },
    ],
  },
  {
    label: "Website",
    links: [
      { href: "/admin/recruiting", label: "Recruiting" },
      { href: "/admin/photos", label: "Photos" },
      { href: "/admin/sponsors", label: "Sponsors" },
      { href: "/admin/placements", label: "Placements" },
      { href: "/admin/tracks", label: "Tracks" },
    ],
  },
  { label: "Events & portal", links: [{ href: "/admin/events", label: "Events" }] },
  {
    label: "Insights",
    links: [
      { href: "/admin/games", label: "Game scores" },
      { href: "/admin/history", label: "History" },
    ],
  },
] as const;

function NavLink({ href, label, current }: { href: string; label: string; current: boolean }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex min-h-11 items-center rounded-[0.625rem] px-3 text-nav font-medium transition-colors duration-150 ${
        current ? "bg-wash text-navy" : "text-ink-2 hover:text-navy"
      }`}
    >
      {label}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-4">
      <NavLink href="/admin" label="Overview" current={pathname === "/admin"} />
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-caption font-medium text-ink-3">{group.label}</p>
          <ul className="mt-1 flex flex-wrap gap-1 md:flex-col">
            {group.links.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} label={link.label} current={pathname.startsWith(link.href)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
