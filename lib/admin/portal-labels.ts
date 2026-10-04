/** Display names for the portal editors (spec 06 §6.11). Kept free of zod so client forms can import them cheaply. */
export const KIND_LABELS = { slides: "Slides", notes: "Notes", textbook: "Textbook", "problem-set": "Problem set", video: "Video", link: "Link" } as const;
export const SECTION_LABELS = { learning: "Learning", "interview-prep": "Interview prep", recruiting: "Recruiting", other: "Other" } as const;
export const TRACK_LABELS = { trading: "Trading", research: "Research", development: "Development" } as const;
export const AUDIENCE_LABELS = { signed_in: "Anyone signed in", members: "Members only" } as const;
