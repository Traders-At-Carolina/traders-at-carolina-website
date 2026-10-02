import type { HomeContent } from "@/content/types";

/**
 * Home page content (docs/specs/01-home.md). Officers edit this file.
 *
 * - stats: add real numbers only; "By the numbers" stays hidden until at least one is set.
 * - photos: add 2–3 statically imported images from public/images/events, e.g.
 *     import mockTrading from "@/public/images/events/mock-trading.jpg";
 *     { src: mockTrading, alt: "…", caption: "Mock trading night, Spring 2026", ratio: "3:2" }
 *   "Inside the club" stays hidden until there are at least 2.
 * - upcoming: optional; hidden automatically once the event's day has passed (at build time).
 */
export const home: HomeContent = {
  hero: {
    eyebrow: "UNC's Premier Quantitative Finance Club",
    headline: "Traders at Carolina",
    headlineEmphasis: "at",
    subhead:
      "Rigor, practiced together. We teach the probability, markets and interview craft behind trading and research careers — no finance background required.",
    figureCaption: "Fig. 1 — Five random walks from one origin. Same rules, different outcomes.",
  },
  headings: {
    pillars: "Three ways we build quants.",
    numbers: "An established community at Carolina.",
    inside: "Thursday nights, and everything in between.",
  },
  pillars: [
    {
      title: "Preparation",
      body: "Education sessions on probability, statistics and mental math, plus structured interview preparation for trading and research roles.",
      link: { label: "See the curriculum", href: "/membership" },
    },
    {
      title: "Engagement",
      body: "Mock trading, market-making games and competitions alongside a community of peers working toward the same roles.",
      link: { label: "How membership works", href: "/membership" },
    },
    {
      title: "Opportunity",
      body: "Firm events, sponsor connections and recruiting support from members who have been through the process.",
      link: { label: "About the club", href: "/about" },
    },
  ],
  stats: {},
  photos: [],
};
