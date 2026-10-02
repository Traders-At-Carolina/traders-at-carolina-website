import type { MembershipContent } from "@/content/types";

/**
 * Membership page content (docs/specs/03-membership.md). Officers edit this file.
 *
 * Pending from the club — rows/fields stay hidden until filled in:
 * - switchingPolicy (e.g. "Members can switch tracks at the start of each semester.")
 * - expectations.timeCommitment ({ value: "About 3 hours a week", detail: "…" })
 * - expectations.attendance ({ value: "…", detail: "…" })
 * - activities[].frequency (e.g. "Weekly" or "Thursdays, 7–8:30 PM")
 * - tracks[].leadSlug (a slug from content/team.ts, once the Team page exists)
 *
 * Track descriptions describe what members do; never call background items "required".
 * goodFit and sampleProblem are DRAFT copy written for review; edit or remove freely.
 */
export const membership: MembershipContent = {
  header: {
    h1: "Three tracks. One standard.",
    // Non-breaking spaces keep each em dash on the line with the word before it.
    lead: "Members join one of three tracks\u00a0— Trading, Research or Development\u00a0— and build skills that map directly to roles at quantitative trading firms.",
  },
  headings: {
    how: "From application to your first project.",
    tracks: "Pick the role you're preparing for.",
    activities: "The work, week to week.",
    expectations: "What we ask of members.",
  },
  steps: [
    { title: "Apply", body: "Submit a short application during the recruiting window." },
    { title: "Choose a track", body: "Pick Trading, Research or Development based on the role you're working toward." },
    { title: "Build with your track", body: "Attend track sessions, work on projects and prepare alongside peers." },
  ],
  tracks: [
    {
      id: "trading",
      roleLabel: "Quantitative trading",
      name: "Trading",
      description:
        "Market-making games (quoting prices to both buy and sell), decision-making under uncertainty, expected value and fast mental math.",
      goodFit: "like making fast decisions with incomplete information and living with the outcome.",
      sampleProblem:
        "Make a two-sided market on the sum of two dice. Someone buys at your ask. What did you just learn, and where do you quote next?",
      recommendedBackground: ["Probability", "Mental math", "Comfort with quick estimation"],
    },
    {
      id: "research",
      roleLabel: "Quantitative research",
      name: "Research",
      description: "Statistics, modeling and research projects on market data, from forming a hypothesis to testing it honestly.",
      goodFit: "would rather find out why something works than take it on faith.",
      sampleProblem: "A strategy returned 18% last year. What would you check before believing it, and how would you test whether it was luck?",
      recommendedBackground: ["Statistics", "Linear algebra", "Python or R"],
    },
    {
      id: "development",
      roleLabel: "Software engineering",
      name: "Development",
      description: "Building backtesters, trading simulators and the infrastructure the club's other tracks use.",
      goodFit: "like building tools other people depend on and making them fast.",
      sampleProblem: "Replay a day of prices through a simple strategy, then find the bug that makes the backtest look better than it should.",
      recommendedBackground: ["Python or C++", "Data structures and algorithms"],
    },
  ],
  activities: [
    {
      name: "Education sessions",
      description: "Probability, statistics, market microstructure and mental math.",
      tracks: "all",
    },
    {
      name: "Mock trading and games",
      description: "Market-making games and trading simulations.",
      tracks: "all",
    },
    {
      name: "Interview prep",
      description: "Mock interviews, problem sets and résumé reviews.",
      tracks: "all",
    },
    {
      name: "Firm events and competitions",
      description: "Speaker events, firm info sessions and external competitions.",
      tracks: "all",
    },
  ],
  expectations: {
    prerequisites: {
      value: "None required",
      detail: "Each track lists recommended background. Curiosity and consistent effort matter more.",
    },
  },
};
