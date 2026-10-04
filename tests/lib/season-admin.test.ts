// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "admin_1" }),
  currentUser: async () => ({ publicMetadata: { role: "admin" }, emailAddresses: [], primaryEmailAddress: { emailAddress: "officer@unc.edu" } }),
}));
const recordAudit = vi.hoisted(() => vi.fn(async () => 9));
vi.mock("@/lib/admin/audit", () => ({ recordAudit }));
const settingsDb = vi.hoisted(() => ({
  setSetting: vi.fn(async (_k: string, v: unknown) => ({ before: null, after: v })),
  insertEvent: vi.fn(async (v: Record<string, unknown>) => ({ id: "e2", ...v })),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  getEvent: vi.fn(),
}));
vi.mock("@/lib/admin/settings-db", () => settingsDb);
const listsDb = vi.hoisted(() => ({
  getSeasonSetting: vi.fn(async () => ({ academicYear: "2026–27" })),
  setSeasonSetting: vi.fn(async (v: unknown) => ({ before: {}, after: v })),
}));
vi.mock("@/lib/admin/lists-db", () => listsDb);

const recruiting = await import("@/app/admin/(console)/recruiting/actions");
const events = await import("@/app/admin/(console)/events/actions");
const { shiftLocal } = await import("@/lib/events-local");

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
};

beforeEach(() => vi.clearAllMocks());

describe("recruiting", () => {
  it("saves an open cycle with an explicit mode", async () => {
    const state = await recruiting.saveRecruiting({}, form({ mode: "open", applyUrl: "https://forms.gle/abc", applyDeadline: "2026-11-01T23:59", cycleLabel: "Fall 2026" }));
    expect(settingsDb.setSetting).toHaveBeenCalledWith("recruiting", expect.objectContaining({ mode: "open", applicationsOpen: true, applyDeadline: "2026-11-01T23:59", cycleLabel: "Fall 2026" }));
    expect(state).toMatchObject({ undoId: 9, viewHref: "/apply" });
  });

  it("needs a Google Form when open or scheduled (05 §5)", async () => {
    const state = await recruiting.saveRecruiting({}, form({ mode: "open", applyUrl: "https://example.com/apply" }));
    expect(state.fieldErrors?.applyUrl).toMatch(/Google Forms/);
    expect(settingsDb.setSetting).not.toHaveBeenCalled();
  });

  it("needs a next-open time to schedule an opening", async () => {
    const state = await recruiting.saveRecruiting({}, form({ mode: "scheduled", applyUrl: "https://forms.gle/abc" }));
    expect(state.fieldErrors?.nextApplicationOpenDate).toBeTruthy();
  });

  it("merges the member-count mode into the season", async () => {
    await recruiting.saveMemberCount({}, form({ mode: "manual", value: "45" }));
    expect(listsDb.setSeasonSetting).toHaveBeenCalledWith({ academicYear: "2026–27", memberCount: { mode: "manual", value: 45 } });
  });
});

describe("events", () => {
  const base = { title: "Mock trading night", type: "workshop", startsAt: "2026-10-16T19:00", audience: "public" };

  it("only features website events, and ends after it starts", async () => {
    expect((await events.createEvent({}, form({ ...base, audience: "members", featured: "on" }))).fieldErrors?.featured).toMatch(/website events/);
    expect((await events.createEvent({}, form({ ...base, endsAt: "2026-10-16T18:00" }))).fieldErrors?.endsAt).toMatch(/before the start/);
    await events.createEvent({}, form({ ...base, featured: "on", url: "https://rsvp.example.com" }));
    expect(settingsDb.insertEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "Mock trading night", featured: true, url: "https://rsvp.example.com" }));
  });

  it("duplicates a week later at the same local time, unfeatured", async () => {
    settingsDb.getEvent.mockResolvedValue({ id: "e1", ...base, endsAt: "2026-10-30T20:30", startsAt: "2026-10-30T19:00", featured: true, location: null, description: null, url: null, createdAt: new Date(), updatedAt: new Date() });
    await events.duplicateEvent({}, form({ id: "e1", plusWeek: "1" }));
    expect(settingsDb.insertEvent).toHaveBeenCalledWith(expect.objectContaining({ startsAt: "2026-11-06T19:00", endsAt: "2026-11-06T20:30", featured: false }));
  });
});

describe("shiftLocal", () => {
  it("keeps the wall-clock time across the end of daylight saving", () => {
    expect(shiftLocal("2026-10-30T19:00", 7)).toBe("2026-11-06T19:00");
    expect(shiftLocal("2026-12-28T09:30", 7)).toBe("2027-01-04T09:30");
  });
});
