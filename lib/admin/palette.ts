import { ArrowRight, type LucideIcon, Plus } from "lucide-react";

/**
 * Static entries and matching for the ⌘K palette (spec 11 §5.1). Pure, so it can be tested without rendering.
 * Actions are navigations only: the palette never writes data.
 */

export type PaletteItem = { label: string; description?: string; keywords?: readonly string[] };

export type PaletteAction = PaletteItem & { href: string; icon: LucideIcon };

export const PALETTE_ACTIONS: readonly PaletteAction[] = [
  { label: "New event", href: "/admin/events/new", icon: Plus, description: "Add a meeting, info session or competition", keywords: ["calendar", "create"] },
  { label: "Add members", href: "/admin/members/add", icon: Plus, description: "Add people to the roster", keywords: ["roster", "import", "create"] },
  { label: "Review requests", href: "/admin/members?tab=requests", icon: ArrowRight, description: "Approve or decline access requests", keywords: ["access", "pending", "members"] },
  { label: "Invite admin", href: "/admin/admins", icon: Plus, description: "Give someone access to this console", keywords: ["access", "admins"] },
  { label: "New officer", href: "/admin/officers/new", icon: Plus, description: "Add someone to the Team page", keywords: ["people", "team", "create"] },
  { label: "New sponsor", href: "/admin/sponsors/new", icon: Plus, description: "Add a partner firm", keywords: ["partners", "create"] },
  { label: "New placement", href: "/admin/placements/new", icon: Plus, description: "Add a firm members have landed at", keywords: ["firms", "wall", "create"] },
  { label: "Upload photo", href: "/admin/photos/new", icon: Plus, description: "Add a Home or Membership photo", keywords: ["images", "gallery"] },
  { label: "Open or close recruiting", href: "/admin/recruiting", icon: ArrowRight, description: "Applications, dates and the Apply page", keywords: ["apply", "applications", "season"] },
];

/**
 * Case-insensitive substring match on label, description and keywords. Items whose label starts with the query come
 * first; otherwise the original order is kept. An empty query returns every item.
 */
export function filterItems<T extends PaletteItem>(items: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  const prefix: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    const label = item.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(item);
    else if (label.includes(q) || item.description?.toLowerCase().includes(q) || item.keywords?.some((k) => k.toLowerCase().includes(q))) rest.push(item);
  }
  return [...prefix, ...rest];
}

// ── Recent screens (sessionStorage, every access guarded) ──

export const RECENT_KEY = "tac-admin-recent";
export const RECENT_LIMIT = 5;

function storage(): Storage | undefined {
  try {
    return globalThis.sessionStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/** Recently visited screen hrefs, newest first. Empty when storage is missing, blocked or holds junk. */
export function readRecent(): string[] {
  try {
    const raw = storage()?.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === "string").slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

/** Moves `href` to the front of the recent list, keeping at most RECENT_LIMIT. */
export function recordRecent(href: string): void {
  try {
    const next = [href, ...readRecent().filter((h) => h !== href)].slice(0, RECENT_LIMIT);
    storage()?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: Recent just stays as it was.
  }
}
