import type { RosterFilter } from "@/lib/admin/members-db";

/** Shared with the Roster tab so the export matches what's on screen. */
export function rosterFilter(params: URLSearchParams): RosterFilter {
  const status = params.get("status");
  const track = params.get("track");
  const year = Number(params.get("year"));
  return {
    q: params.get("q")?.trim() || undefined,
    status: status === "active" || status === "alumni" || status === "inactive" ? status : undefined,
    track: track === "trading" || track === "research" || track === "development" ? track : undefined,
    classYear: Number.isInteger(year) && year > 1990 ? year : undefined,
  };
}
