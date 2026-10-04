// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../helpers/fake-db";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const fake = fakeDb();
vi.mock("@/lib/db/client", () => ({ db: () => fake.db() }));

const { portalAnnouncements, portalFile, portalLinks, portalResources, portalSettings } = await import("@/lib/data/portal");
const { portalAccessSettings } = await import("@/lib/members/settings");

const at = (iso: string) => new Date(iso);
const resource = (over: Record<string, unknown>) => ({
  id: "r0",
  title: "Deck",
  kind: "slides",
  section: "learning",
  tracks: [],
  description: null,
  file: null,
  url: "https://drive.google.com/x",
  audience: "signed_in",
  pinned: false,
  sortOrder: 1,
  hidden: false,
  ...over,
});
const announcement = (over: Record<string, unknown>) => ({
  id: "a0",
  title: "Note",
  body: "Hi",
  audience: "signed_in",
  pinned: false,
  showFrom: null,
  showUntil: null,
  createdAt: at("2026-10-01T12:00:00Z"),
  ...over,
});

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgres://test");
  fake.calls.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("portalResources (phase 7)", () => {
  it("groups by section, filters by audience on the server and never returns hidden ones", async () => {
    const rows = [
      resource({ id: "r1", title: "Pinned deck", pinned: true }),
      resource({ id: "r2", title: "Members notes", kind: "notes", audience: "members", description: "Week 2" }),
      resource({ id: "r3", title: "Hidden", hidden: true }),
      resource({ id: "r4", title: "Mock interview", section: "interview-prep", tracks: ["trading"] }),
    ];
    fake.queue(rows);
    const visitor = await portalResources("signed_in");
    expect(visitor.learning.map((r) => r.id)).toEqual(["r1"]);
    expect(visitor["interview-prep"]).toEqual([{ id: "r4", title: "Mock interview", kind: "slides", tracks: ["trading"], href: "https://drive.google.com/x", pinned: false }]);

    fake.queue(rows);
    const member = await portalResources("member");
    expect(member.learning.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(member.learning[1]).toMatchObject({ description: "Week 2" });
    // The query itself also leaves hidden rows out.
    expect(fake.methods(0)).toContain("where");
  });

  it("links uploaded files through the file route, never the Blob pathname", async () => {
    fake.queue([resource({ id: "11111111-1111-4111-8111-111111111111", url: null, file: { pathname: "resources/secret-abc.pdf", size: 1, contentType: "application/pdf" } })]);
    const { learning } = await portalResources("member");
    expect(learning[0].href).toBe("/portal/files/11111111-1111-4111-8111-111111111111");
    expect(JSON.stringify(learning)).not.toContain("secret");
  });

  it("is empty without a database, and before the table is migrated", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(await portalResources("member")).toEqual({ learning: [], "interview-prep": [], recruiting: [], other: [] });
    vi.stubEnv("DATABASE_URL", "postgres://test");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fake.queue(Object.assign(new Error("relation does not exist"), { code: "42P01" }));
    expect(await portalResources("member")).toEqual({ learning: [], "interview-prep": [], recruiting: [], other: [] });
  });
});

describe("portalAnnouncements (phase 7)", () => {
  const now = at("2026-10-10T12:00:00Z");
  const rows = [
    announcement({ id: "old", createdAt: at("2026-09-01T12:00:00Z") }),
    announcement({ id: "new", createdAt: at("2026-10-09T12:00:00Z") }),
    announcement({ id: "pinned", pinned: true, createdAt: at("2026-08-01T12:00:00Z") }),
    announcement({ id: "scheduled", showFrom: at("2026-10-11T00:00:00Z") }),
    announcement({ id: "expired", showUntil: at("2026-10-09T00:00:00Z") }),
    announcement({ id: "window", showFrom: at("2026-10-01T00:00:00Z"), showUntil: at("2026-10-20T00:00:00Z"), createdAt: at("2026-09-15T12:00:00Z") }),
    announcement({ id: "members", audience: "members" }),
  ];

  it("shows only those within their dates, pinned first, then newest", async () => {
    fake.queue(rows);
    expect((await portalAnnouncements("signed_in", now)).map((a) => a.id)).toEqual(["pinned", "new", "window", "old"]);
    fake.queue(rows);
    expect((await portalAnnouncements("member", now)).map((a) => a.id)).toContain("members");
  });

  it("returns only the portal's fields", async () => {
    fake.queue([announcement({ id: "a1", body: "Read *this*." })]);
    expect(await portalAnnouncements("signed_in", now)).toEqual([{ id: "a1", title: "Note", body: "Read *this*.", pinned: false }]);
  });
});

describe("portalLinks (phase 7)", () => {
  const env = { INTERNSHIP_TRACKER_URL: "https://docs.google.com/spreadsheets/d/abc" };

  it("returns admin links in order, filtered by audience", async () => {
    const rows = [
      { id: "l1", label: "Tracker", url: "https://docs.google.com/t", description: "Where people applied", audience: "members", sortOrder: 1 },
      { id: "l2", label: "Calendar", url: "https://calendar.google.com", description: null, audience: "signed_in", sortOrder: 2 },
    ];
    fake.queue(rows);
    expect(await portalLinks("member", env)).toEqual([
      { id: "l1", label: "Tracker", url: "https://docs.google.com/t", description: "Where people applied" },
      { id: "l2", label: "Calendar", url: "https://calendar.google.com" },
    ]);
    fake.queue(rows);
    expect((await portalLinks("signed_in", env)).map((l) => l.id)).toEqual(["l2"]);
  });

  it("keeps the interim tracker until an admin adds the first link", async () => {
    fake.queue([]);
    expect(await portalLinks("member", env)).toEqual([expect.objectContaining({ id: "internship-tracker", url: env.INTERNSHIP_TRACKER_URL })]);
    fake.queue([]);
    expect(await portalLinks("signed_in", env)).toEqual([]);
  });
});

describe("portal settings (phase 7)", () => {
  it("reads the welcome lines and the toggles from the portal setting", async () => {
    fake.queue([{ value: { alumniAccess: false, acceptRequests: false, welcomeMember: "Welcome back.", welcomeVisitor: "Glad you're here." } }]);
    expect(await portalSettings()).toEqual({ acceptRequests: false, welcomeMember: "Welcome back.", welcomeVisitor: "Glad you're here." });
    fake.queue([{ value: { alumniAccess: false } }]);
    expect(await portalAccessSettings()).toEqual({ alumniAccess: false, acceptRequests: true });
  });

  it("falls back to the defaults when unsaved, without a database, or when the read fails", async () => {
    fake.queue([]);
    expect(await portalSettings()).toEqual({ acceptRequests: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fake.queue(new Error("db down"));
    expect(await portalAccessSettings()).toEqual({ alumniAccess: true, acceptRequests: true });
    vi.stubEnv("DATABASE_URL", "");
    const before = fake.calls.length;
    expect(await portalAccessSettings()).toEqual({ alumniAccess: true, acceptRequests: true });
    expect(fake.calls.length).toBe(before);
  });
});

describe("portalFile", () => {
  const file = { pathname: "resources/a.pdf", size: 3, contentType: "application/pdf" };

  it("returns the file only for a visible file resource the viewer may see", async () => {
    fake.queue([{ title: "Deck", file, hidden: false, audience: "members" }]);
    expect(await portalFile("r1", "member")).toEqual({ title: "Deck", file });
    fake.queue([{ title: "Deck", file, hidden: false, audience: "members" }]);
    expect(await portalFile("r1", "signed_in")).toBeNull();
    fake.queue([{ title: "Deck", file, hidden: true, audience: "signed_in" }]);
    expect(await portalFile("r1", "member")).toBeNull();
    fake.queue([{ title: "Link", file: null, hidden: false, audience: "signed_in" }]);
    expect(await portalFile("r1", "member")).toBeNull();
    fake.queue([]);
    expect(await portalFile("r1", "member")).toBeNull();
  });
});
