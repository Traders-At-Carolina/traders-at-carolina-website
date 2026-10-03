import { describe, expect, it } from "vitest";
import { membership } from "@/content/membership";
import { expectationRows, formatActivityTracks } from "@/lib/membership";
import { collectMembershipProblems, validateMembership } from "@/lib/validate-membership";

describe("formatActivityTracks", () => {
  it("says All tracks, or joins track names", () => {
    expect(formatActivityTracks("all", membership.tracks)).toBe("All tracks");
    expect(formatActivityTracks(["trading", "development"], membership.tracks)).toBe("Trading · Development");
  });
});

describe("expectationRows", () => {
  it("keeps spec order and skips rows without a value", () => {
    const rows = expectationRows({
      attendance: { value: "8 of 10 sessions", detail: "D." },
      prerequisites: { value: "None required", detail: "D." },
    });
    expect(rows.map((r) => r.term)).toEqual(["Attendance", "Prerequisites"]);
  });
});

describe("validateMembership", () => {
  it("accepts the shipped content", () => {
    expect(() => validateMembership(membership, [])).not.toThrow();
  });

  it("requires the three tracks in order", () => {
    const tracks = [membership.tracks[1], membership.tracks[0], membership.tracks[2]];
    expect(() => validateMembership({ ...membership, tracks }, [])).toThrow(/tracks must be exactly/);
  });

  it("rejects 'required' wording in a track", () => {
    const tracks = membership.tracks.map((t, i) => (i === 0 ? { ...t, description: "Python is required." } : t));
    expect(() => validateMembership({ ...membership, tracks }, [])).toThrow(/must not say "required"/);
  });

  it("fails on a leadSlug that isn't on the team, and passes once it is", () => {
    const tracks = membership.tracks.map((t, i) => (i === 0 ? { ...t, leadSlug: "jane-doe" } : t));
    expect(() => validateMembership({ ...membership, tracks }, [])).toThrow(/leadSlug "jane-doe"/);
    expect(() => validateMembership({ ...membership, tracks }, ["jane-doe"])).not.toThrow();
  });

  it("requires 2–4 recommended background items", () => {
    const tracks = membership.tracks.map((t, i) => (i === 2 ? { ...t, recommendedBackground: ["Python"] } : t));
    expect(() => validateMembership({ ...membership, tracks }, [])).toThrow(/recommendedBackground/);
  });
});

describe("collectMembershipProblems", () => {
  it("returns no problems for the shipped content", () => {
    expect(collectMembershipProblems(membership, [])).toEqual([]);
  });

  it("returns problems instead of throwing", () => {
    const tracks = membership.tracks.map((t, i) => (i === 0 ? { ...t, leadSlug: "jane-doe" } : t));
    expect(collectMembershipProblems({ ...membership, tracks }, [])).toEqual([
      'tracks.trading.leadSlug "jane-doe" is not a person in content/team.ts',
    ]);
  });
});
