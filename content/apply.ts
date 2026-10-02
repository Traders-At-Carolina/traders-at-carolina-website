import type { ApplyContent } from "@/content/types";

/**
 * Apply page content (docs/specs/05-apply.md). Officers edit this file.
 * Recruiting status, form links and dates live in content/site.ts → recruiting.
 *
 * FAQ answers marked `draft: true` are working copy for the club to confirm. They show in development
 * and on Vercel preview deployments, never on production. Edit the answer, then delete `draft: true` to publish it.
 * Stage effort lines are DRAFT copy too; edit or remove freely.
 *
 * Answers support [links](/membership#trading) and *emphasis* only.
 */
export const apply: ApplyContent = {
  benefits: [
    {
      title: "Preparation",
      body: "Sessions on probability, statistics and mental math, plus structured interview prep for trading and research roles.",
      link: { label: "See weekly activities", href: "/membership#activities" },
    },
    {
      title: "Practice",
      body: "Mock trading, market-making games and competitions, so the first time you quote a price isn't in an interview.",
      link: { label: "Explore the three tracks", href: "/membership#tracks" },
    },
    {
      title: "Opportunity",
      body: "Firm events, sponsor connections and recruiting support from members who have been through the process.",
      link: { label: "Meet our sponsors", href: "/about#partners" },
    },
  ],
  stages: [
    {
      title: "Application",
      description: "A short written application covering your background, your interest in quant and the track you're considering.",
      effort: "Short written form",
    },
    {
      title: "Interview",
      description: "A conversation with members of the board.",
      effort: "One conversation",
    },
    {
      title: "Decision",
      description: "Decisions are sent by email.",
      effort: "By email",
    },
  ],
  faq: [
    {
      question: "Do I need finance or coding experience?",
      answer:
        "No. Each track lists [recommended background](/membership#trading), but none of it is required to join. Curiosity and consistent effort matter most.",
    },
    {
      question: "Which years and majors can apply?",
      answer: "Any UNC undergraduate, in any year and any major, can apply.",
      draft: true,
    },
    {
      question: "How do interviews work, and how should I prepare?",
      answer:
        "Interviews are a conversation with members of the board, part getting to know you and part working through a problem out loud. We care how you think, not whether you've seen the question before. Reviewing basic probability and thinking about why quant interests you is plenty.",
      draft: true,
    },
    {
      question: "How selective is it, and what are you looking for?",
      answer:
        "We can't take everyone, so we read every application closely. We look for curiosity, consistent effort, clear thinking and people who will add to the community.",
      draft: true,
    },
    {
      question: "What's the time commitment?",
      answer:
        "Expect a weekly general meeting plus your track's sessions. See [what we ask of members](/membership#expectations) for the details.",
      draft: true,
    },
  ],
};
