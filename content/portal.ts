import type { PortalContent } from "@/content/types";

/**
 * Portal copy (docs/specs/09-portal.md §5.1). Officers edit this file.
 *
 * THIS REPOSITORY IS PUBLIC. Nothing members-only goes here: no slide decks, notes, textbook files or the internship
 * tracker link. Those come from lib/data/portal.ts (spec 06 §8: the admin dashboard, an environment variable until
 * then). The build rejects any link here that isn't internal (starts with "/" or "#").
 *
 * Interview prep is DRAFT working copy for the club to confirm; it describes the club's own interview, not firm
 * interviews. Edit freely.
 */
export const portal: PortalContent = {
  header: {
    visitorLead: "You're signed in, but not a member yet. Here's when we recruit, how our interview works and what's coming up.",
    memberLead: "Your member resources, plus what's coming up at the club.",
  },
  headings: {
    recruiting: "When we recruit.",
    prep: "How our interview works.",
    events: "Competitions and events.",
    tracks: "Pick the role you're preparing for.",
    club: "The work, week to week.",
    learning: "Slides, notes and textbooks.",
    tools: "Tracker and competitions.",
  },
  interviewPrep: {
    lead: "One conversation with members of the board. We care how you think, not whether you've seen the question before.",
    expect:
      "Part of the conversation is getting to know you: your background, why quant interests you and the track you're considering. The rest is working through a short problem out loud, usually probability or estimation. How you reason matters more than the final number.",
    lookFor: [
      "Curiosity about markets and problem solving",
      "Clear thinking, explained out loud",
      "Consistent effort over polish",
      "People who will add to the community",
    ],
    prepare: [
      { text: "Review basic probability: expected value, conditional probability and simple counting." },
      { text: "Practise mental math and quick estimates.", link: { label: "Play the games", href: "/membership#games" } },
      { text: "Read the sample problem for the track you're considering.", link: { label: "See the tracks", href: "#tracks" } },
      { text: "Know why quant interests you, and which role you're working toward." },
    ],
  },
  eventsEmpty: "Nothing scheduled right now. New competitions and events show up here first.",
  learning: {
    lead: "Material from education sessions and track meetings, in one place.",
    empty: "Nothing posted yet.",
  },
  tools: {
    linksPending: {
      title: "Internship tracker",
      body: "A community-run spreadsheet of where members are applying, interviewing and landing. Links to it, Slack and the shared Drive show up here.",
      pending: "Link coming soon.",
    },
    competitions: {
      title: "Competitions",
      body: "Coming soon. Practice rounds and the external competitions the club enters will live here.",
    },
  },
  requestAccess: {
    prompt: "Already in the club? Ask for member access and an officer will confirm it.",
    button: "Request access",
    notePlaceholder: "Optional note, e.g. your track or the semester you joined",
    pending: "Your request is in. An officer will review it soon.",
    declined: "Your request wasn't approved. If you think that's a mistake, you can ask again.",
  },
  clubLinks: [
    { label: "About the club", href: "/about" },
    { label: "Membership", href: "/membership" },
    { label: "The team", href: "/team" },
  ],
};
