import type { Expectation, MembershipContent, TrackId } from "@/content/types";

export const TRACK_ORDER: TrackId[] = ["trading", "research", "development"];

/** "All tracks", or track names joined with " · " (spec 03 §5). */
export function formatActivityTracks(tracks: "all" | TrackId[], content: MembershipContent["tracks"]): string {
  if (tracks === "all") return "All tracks";
  return tracks.map((id) => content.find((t) => t.id === id)?.name ?? id).join(" · ");
}

/** Expectation rows in spec order, skipping any without a confirmed value. */
export function expectationRows(expectations: MembershipContent["expectations"]): Array<{ term: string } & Expectation> {
  const rows: Array<[string, Expectation | undefined]> = [
    ["Time commitment", expectations.timeCommitment],
    ["Attendance", expectations.attendance],
    ["Prerequisites", expectations.prerequisites],
  ];
  return rows.filter((row): row is [string, Expectation] => Boolean(row[1])).map(([term, e]) => ({ term, ...e }));
}

/** Expectations earn their own section only with at least two answered rows; one row reads as a stub (spec 03 §3.5). */
export function showExpectations(expectations: MembershipContent["expectations"]): boolean {
  return expectationRows(expectations).length >= 2;
}

/** Which optional activity columns carry information worth a column. */
export function activityColumns(activities: MembershipContent["activities"]): { frequency: boolean; tracks: boolean } {
  return {
    frequency: activities.some((a) => Boolean(a.frequency)),
    tracks: activities.some((a) => a.tracks !== "all"),
  };
}
