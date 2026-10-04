import {
  BarChart3,
  Building2,
  CalendarDays,
  FolderOpen,
  Gamepad2,
  Handshake,
  History,
  IdCard,
  Images,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * The console's nav map (spec 11 §3.1): one source for the top bar, sub-tabs, mobile menu, Overview shortcuts and
 * "View on site". Screens tagged with a `phase` stay hidden until that phase ships; a section with no visible screens
 * is hidden too.
 */
export type AdminScreen = {
  href: `/admin${string}`;
  label: string;
  icon: LucideIcon;
  /** One line, shown on Overview shortcuts and in the palette. */
  description: string;
  keywords?: readonly string[];
  /** The public page this screen affects, for "View on site". */
  siteHref?: string;
  phase?: "C" | "E";
};

export type AdminSection = { id: string; label: string; screens: readonly AdminScreen[] };

const ALL_SECTIONS: readonly AdminSection[] = [
  {
    id: "overview",
    label: "Overview",
    screens: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, description: "What needs attention and recent changes" }],
  },
  {
    id: "club",
    label: "Club",
    screens: [
      { href: "/admin/members", label: "Members", icon: Users, description: "Roster, access requests and accounts", keywords: ["roster", "requests"] },
      { href: "/admin/officers", label: "Officers", icon: IdCard, description: "Leadership shown on the Team page", siteHref: "/team", keywords: ["people", "team", "board"] },
      { href: "/admin/admins", label: "Admins", icon: ShieldCheck, description: "Who can use this console", keywords: ["access", "invite"] },
    ],
  },
  {
    id: "website",
    label: "Website",
    screens: [
      { href: "/admin/recruiting", label: "Recruiting", icon: Sparkles, description: "Open or close applications and set dates", siteHref: "/apply", keywords: ["apply", "season", "member count"] },
      { href: "/admin/events", label: "Events", icon: CalendarDays, description: "Meetings, info sessions and competitions", siteHref: "/", keywords: ["calendar", "upcoming"] },
      { href: "/admin/photos", label: "Photos", icon: Images, description: "Home and Membership photos", siteHref: "/", keywords: ["images", "gallery"] },
      { href: "/admin/sponsors", label: "Sponsors", icon: Handshake, description: "Partner firms and their logos", siteHref: "/about", keywords: ["partners", "logos"] },
      { href: "/admin/placements", label: "Placements", icon: Building2, description: "Where members have landed, and the logo wall", siteHref: "/team", keywords: ["firms", "wall", "internships"] },
      { href: "/admin/tracks", label: "Tracks", icon: Route, description: "Trading, research and development tracks", siteHref: "/membership" },
    ],
  },
  {
    id: "portal",
    label: "Portal",
    screens: [
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone, description: "Notes pinned to the top of the portal", siteHref: "/portal", phase: "C" },
      { href: "/admin/resources", label: "Resources", icon: FolderOpen, description: "Slides, notes and links for members", siteHref: "/portal", phase: "C" },
      { href: "/admin/portal", label: "Portal settings", icon: Settings2, description: "Member links, welcome lines and access", siteHref: "/portal", phase: "C" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    screens: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, description: "Visitors, top pages and clicks", phase: "E" },
      { href: "/admin/games", label: "Game scores", icon: Gamepad2, description: "Leaderboards and volunteered contacts", siteHref: "/membership", keywords: ["sprint", "fermi", "leaderboard"] },
      { href: "/admin/history", label: "History", icon: History, description: "Every change, with undo", keywords: ["audit", "undo", "log"] },
    ],
  },
];

/** Phases that have shipped. Add "C" or "E" here when that phase lands. */
const SHIPPED_PHASES: ReadonlySet<string> = new Set<string>();

export const ADMIN_SECTIONS: readonly AdminSection[] = ALL_SECTIONS.map((section) => ({
  ...section,
  screens: section.screens.filter((screen) => !screen.phase || SHIPPED_PHASES.has(screen.phase)),
})).filter((section) => section.screens.length > 0);

/** Every visible screen except Overview, in nav order. */
export const ADMIN_SCREENS: readonly AdminScreen[] = ADMIN_SECTIONS.flatMap((s) => s.screens).filter((s) => s.href !== "/admin");

function matches(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function screenFor(pathname: string): AdminScreen | undefined {
  return ADMIN_SECTIONS.flatMap((s) => s.screens).find((screen) => matches(pathname, screen.href));
}

/** The section a path belongs to; Overview for anything unknown. */
export function sectionFor(pathname: string): AdminSection {
  return ADMIN_SECTIONS.find((s) => s.screens.some((screen) => matches(pathname, screen.href))) ?? ADMIN_SECTIONS[0];
}

/** Where a section's top-bar link goes: its first screen. */
export function sectionHref(section: AdminSection): string {
  return section.screens[0].href;
}

/** Hidden-phase screens too, for the coverage test. */
export const ALL_SCREEN_HREFS: readonly string[] = ALL_SECTIONS.flatMap((s) => s.screens.map((screen) => screen.href));
