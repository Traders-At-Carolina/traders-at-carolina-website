import type { ApplyContent } from "@/content/types";

/**
 * Apply page content (docs/specs/05-apply.md). Officers edit this file.
 * Recruiting status, form links and dates live in content/site.ts → recruiting.
 *
 * FAQ answers still needed from the club (add them here once written):
 * - "Which years and majors can apply?" — the club's real eligibility
 * - "How selective is it, and what are you looking for?" — framing the club is comfortable publishing
 * - "How do interviews work, and how should I prepare?" — format, length, who conducts them
 *
 * Answers support [links](/membership#trading) and *emphasis* only.
 */
export const apply: ApplyContent = {
  stages: [
    {
      title: "Application",
      description: "A short written application covering your background, your interest in quant and the track you're considering.",
    },
    {
      title: "Interview",
      description: "A conversation with members of the board.",
    },
    {
      title: "Decision",
      description: "Decisions are sent by email.",
    },
  ],
  faq: [
    {
      question: "Do I need finance or coding experience?",
      answer:
        "No. Each track lists [recommended background](/membership#trading), but none of it is required to join. Curiosity and consistent effort matter most.",
    },
  ],
};
