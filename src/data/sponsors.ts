import sponsorsData from './sponsors.json'

/**
 * Sponsors, grouped by tier. Edit src/data/sponsors.json:
 *   year          the range shown in the subtext, e.g. "2025–2026"
 *   contactEmail  address for the "Get in touch" mailto link
 *   tiers[]       { name, sponsors: [{ name, logo, url }] } in display order;
 *                 a tier with no sponsors is hidden
 *   logo          "/images/sponsors/<slug>.svg"; "" shows a blank tile
 *   url           sponsor site (opens in a new tab); "" renders the tile unlinked
 */
export type Sponsor = { name: string; logo: string; url: string }
export type SponsorTier = { name: string; sponsors: Sponsor[] }
export type SponsorsData = { year: string; contactEmail: string; tiers: SponsorTier[] }

export const sponsorsContent = sponsorsData as SponsorsData
