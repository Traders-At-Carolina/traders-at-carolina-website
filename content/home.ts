import type { HomeContent } from "@/content/types";
import clubOverview from "@/public/images/events/club-overview.jpg";
import closingQa from "@/public/images/events/closing-qa.jpg";
import generalMeeting from "@/public/images/events/general-meeting.jpg";

/**
 * Home page content (docs/specs/01-home.md). Officers edit this file.
 *
 * - stats: add real numbers only; "By the numbers" stays hidden until at least one is set.
 * - photos: add 2–3 statically imported images from public/images/events, e.g.
 *     import mockTrading from "@/public/images/events/mock-trading.jpg";
 *     { src: mockTrading, alt: "…", caption: "Mock trading night, Spring 2026", ratio: "3:2" }
 *   "Inside the club" stays hidden until there are at least 2.
 * - The Upcoming card beside the photos is the next featured public event in content/events.ts; it hides itself once
 *   the event has finished (at build time).
 */
export const home: HomeContent = {
  hero: {
    eyebrow: "UNC's Premier Quantitative Finance Club",
    headline: "Traders at Carolina",
    headlineEmphasis: "at",
    subhead:
      "Rigor, practiced together. We teach the probability, markets and interview craft behind trading and research careers — no finance background required.",
    figureCaption: "Fig. 1 — Implied volatility (height) across strike and maturity. The bold line is at the money.",
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
      link: { label: "See weekly activities", href: "/membership#activities" },
    },
    {
      title: "Engagement",
      body: "Mock trading, market-making games (quoting prices to both buy and sell) and competitions alongside a community of peers working toward the same roles.",
      link: { label: "Explore the three tracks", href: "/membership#tracks" },
    },
    {
      title: "Opportunity",
      body: "Firm events, sponsor connections and recruiting support from members who have been through the process.",
      link: { label: "Meet our sponsors", href: "/about#partners" },
    },
  ],
  stats: { foundedYear: 2023 },
  photos: [
    {
      src: generalMeeting,
      alt: "Members seated in a UNC lecture hall during a Traders at Carolina general meeting",
      caption: "General meeting",
      ratio: "3:2",
    },
    {
      src: clubOverview,
      alt: "Officers presenting the club overview to a full classroom",
      caption: "Introducing the club",
      ratio: "3:2",
    },
    {
      src: closingQa,
      alt: "Officers at the front of the room during the closing Q&A",
      caption: "Closing Q&A",
      ratio: "3:2",
    },
  ],
};
