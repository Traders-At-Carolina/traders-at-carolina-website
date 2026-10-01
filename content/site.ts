import type { Site } from "@/content/types";

/**
 * Club-wide settings. Officers edit this file each recruiting cycle.
 * Recruiting fields are defined in docs/specs/05-apply.md §5.
 */
export const site: Site = {
  name: "Traders at Carolina",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  mission: "Preparing UNC students for careers in quantitative trading, research and engineering.",
  // Pending from the club (00 §14): contact email, social URLs, disclaimer.
  social: {},
  recruiting: {
    applicationsOpen: false,
    applyUrl: "",
  },
};
