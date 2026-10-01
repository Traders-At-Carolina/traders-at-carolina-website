import type { AboutContent } from "@/content/types";

/**
 * About page content (docs/specs/02-about.md). Officers edit this file.
 *
 * - story.paragraphs: add 2–4 paragraphs of the real founding story (third person).
 *   "Our story" stays hidden until then (or until content/timeline.ts has 3+ milestones).
 * - partners: only firms that have agreed to be listed; use the real relationship term.
 *   Home's "Partner firms" stat counts this list automatically.
 * - Mission, vision and principles below are working copy for the club to approve or replace.
 */
export const about: AboutContent = {
  header: {
    h1: "Built by students, for the long game.",
    lead: "Traders at Carolina is a student-run community preparing UNC students for quantitative trading, research and engineering careers.",
  },
  headings: {
    mission: "Why we exist.",
    story: "How it started.",
    principles: "How we operate.",
    partners: "Who supports us.",
    advisorsOnly: "Our advisors.",
  },
  mission: {
    statement: "We prepare UNC students to compete for quantitative trading, research and engineering roles.",
    body: "Through weekly education, mock trading and interview preparation, members build the skills trading firms test for, whether or not they arrive with a finance background.",
  },
  vision: {
    statement: "A genuinely useful resource for every Carolina student pursuing a career at a trading firm.",
    body: "Curriculum, interview preparation and recruiting knowledge that improve each year and stay with the club as members graduate.",
  },
  story: {
    paragraphs: [],
  },
  principles: [
    {
      title: "Rigor over résumé lines",
      body: "We value understanding a problem over listing that we attended a session on it.",
    },
    {
      title: "Beginners welcome, standards high",
      body: "No prior finance background is required; real effort is.",
    },
    {
      title: "Learn in public",
      body: "Members teach, present and review each other's work.",
    },
    {
      title: "Give back",
      body: "Members who place help the next class prepare.",
    },
  ],
  partners: [],
  advisors: [],
};
