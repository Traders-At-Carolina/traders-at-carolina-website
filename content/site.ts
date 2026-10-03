import type { Site } from "@/content/types";

/**
 * Club-wide settings. Officers edit this file each recruiting cycle.
 * Recruiting fields are defined in docs/specs/05-apply.md §5.
 */
export const site: Site = {
  name: "Traders at Carolina",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  mission: "Preparing UNC students for careers in quantitative trading, research and engineering.",
  contactEmail: "tradersatcarolina@gmail.com",
  // Pending from the club (00 §14): disclaimer.
  social: {
    instagram: "https://www.instagram.com/tradersatcarolina/",
    linkedin: "https://www.linkedin.com/company/carolinainvestmentgroup",
  },
  recruiting: {
    applicationsOpen: false,
    applyUrl: "",
    interestFormUrl: "https://forms.gle/uVcW9vqpCDQckoLj7",
  },
};
