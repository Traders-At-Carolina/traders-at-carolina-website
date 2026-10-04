/**
 * Numbers shared by the public pages, the admin editors' hints and the Overview health checks (spec 11 §5.3), so a
 * warning in the console always matches what the site actually does.
 */

/** Home hides "Inside the club" with fewer photos than this (spec 01). */
export const HOME_INSIDE_MIN_PHOTOS = 2;

/** Headshots narrower than this look soft on sharp screens. */
export const MIN_HEADSHOT_WIDTH = 600;

/** Page photos narrower than this look soft on large screens. */
export const MIN_PHOTO_WIDTH = 1200;

/** Access requests older than this many days are flagged on the Overview. */
export const STALE_REQUEST_DAYS = 7;
