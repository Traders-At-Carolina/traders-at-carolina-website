import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn, revalidateTag: vi.fn(), updateTag: vi.fn() }));

import { computeHealth } from "@/lib/admin/health";
import { recruitingStatus } from "@/lib/admin/recruiting-status";
import type { Recruiting } from "@/content/types";

const NOW = new Date("2026-10-04T16:00:00Z"); // noon Eastern
const officer = (over: Partial<{ id: string; name: string; group: string; visible: boolean; headshot: { width: number } | null }> = {}) => ({ id: "o1", name: "Jane Doe", group: "exec", visible: true, headshot: { width: 800 }, ...over });
const photo = (over: Partial<{ id: string; caption: string | null; image: { width: number } | null; homeOrder: number | null; membershipOrder: number | null }> = {}) => ({ id: "p1", caption: "General meeting", image: { width: 2000 }, homeOrder: 1, membershipOrder: null, ...over });
const ids = (input: Parameters<typeof computeHealth>[0]) => computeHealth(input, NOW).map((i) => i.id);

describe("computeHealth", () => {
  it("is all clear for a healthy site", () => {
    expect(ids({ people: [officer()], photos: [photo(), photo({ id: "p2", homeOrder: 2 })], events: [], requests: [] })).toEqual([]);
  });

  it("flags officers shown on Team without a headshot, ignoring hidden ones and track leads", () => {
    const issues = computeHealth({ people: [officer({ headshot: null }), officer({ id: "o2", visible: false, headshot: null }), officer({ id: "o3", group: "track-lead", headshot: null })] }, NOW);
    expect(issues).toEqual([expect.objectContaining({ id: "headshot-missing", message: "Jane Doe has no headshot on the Team page", href: "/admin/officers/o1" })]);
  });

  it("groups several missing headshots into one issue", () => {
    const issues = computeHealth({ people: [officer({ headshot: null }), officer({ id: "o2", name: "Sam Lee", headshot: null })] }, NOW);
    expect(issues).toEqual([expect.objectContaining({ message: "2 visible officers have no headshot", href: "/admin/officers" })]);
  });

  it("flags small headshots and small photos that are on a page", () => {
    expect(ids({ people: [officer({ headshot: { width: 480 } })] })).toEqual(["headshot-small-o1"]);
    expect(ids({ photos: [photo({ image: { width: 900 } }), photo({ id: "p2", homeOrder: 2 }), photo({ id: "p3", homeOrder: null, image: { width: 300 } })] })).toEqual(["photo-small-p1"]);
  });

  it("says when Home hides Inside the club for too few photos", () => {
    const issues = computeHealth({ photos: [photo()] }, NOW);
    expect(issues[0]).toMatchObject({ id: "home-photos", message: expect.stringContaining("needs 2 photos (has 1)"), href: "/admin/photos" });
  });

  it("flags featured events that have ended, using the end time when there is one", () => {
    const events = [
      { id: "e1", title: "Old talk", startsAt: "2026-10-01T18:00", endsAt: null, featured: true },
      { id: "e2", title: "Still on", startsAt: "2026-10-04T09:00", endsAt: "2026-10-04T13:00", featured: true },
      { id: "e3", title: "Not featured", startsAt: "2026-09-01T18:00", endsAt: null, featured: false },
    ];
    expect(ids({ events })).toEqual(["event-featured-e1"]);
  });

  it("flags recruiting set to Open after its deadline", () => {
    const recruiting = { applicationsOpen: true, mode: "open", applyUrl: "https://forms.gle/x", applyDeadline: "2026-10-01" } as Recruiting;
    expect(ids({ recruiting })).toEqual(["recruiting-overdue"]);
    expect(ids({ recruiting: { ...recruiting, applyDeadline: "2026-10-10" } })).toEqual([]);
  });

  it("flags requests waiting more than a week", () => {
    const issues = computeHealth({ requests: [{ createdAt: new Date("2026-09-20T12:00:00Z") }, { createdAt: new Date("2026-10-03T12:00:00Z") }] }, NOW);
    expect(issues).toEqual([expect.objectContaining({ id: "requests-stale", message: "1 access request has waited more than 7 days" })]);
  });

  it("skips only the checks whose data failed to load", () => {
    expect(ids({ people: undefined, photos: [photo()] })).toEqual(["home-photos"]);
  });
});

describe("recruitingStatus", () => {
  const base = { applicationsOpen: false, applyUrl: "https://forms.gle/x" } as Recruiting;

  it("reads open with its deadline", () => {
    expect(recruitingStatus(NOW, { ...base, mode: "open", applyDeadline: "2026-10-09T23:59" })).toMatchObject({ pill: "open", label: "Open", detail: expect.stringMatching(/^closes Fri, Oct 9/) });
  });

  it("reads scheduled before it opens", () => {
    expect(recruitingStatus(NOW, { ...base, mode: "scheduled", nextApplicationOpenDate: "2026-11-01T09:00" })).toMatchObject({ pill: "scheduled", label: "Scheduled", detail: expect.stringMatching(/^opens automatically/) });
  });

  it("reads closed", () => {
    expect(recruitingStatus(NOW, { ...base, mode: "closed" })).toEqual({ pill: "closed", label: "Closed" });
  });
});
