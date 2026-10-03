import type { ClubEvent } from "@/content/types";

/**
 * Club events (docs/specs/09-portal.md §5.2). Officers edit this file until the admin dashboard's Events screen
 * replaces it (spec 06 phase 6, which seeds its `events` table from this list, so keep the shape).
 *
 * - audience: "public" shows on the website and in the portal; "signed_in" and "members" only in the portal.
 * - featured: Home's Upcoming card shows the next featured public event.
 * - Events drop off once they've finished (at build time for Home, on each visit for the portal).
 * - Example:
 *     { title: "Mock trading night", type: "workshop", startsAt: "2026-10-16T19:00", endsAt: "2026-10-16T20:30",
 *       location: "Gardner Hall 105", description: "Market-making games in teams. No experience needed.",
 *       url: "https://…", audience: "public", featured: true }
 */
export const events: ClubEvent[] = [];
