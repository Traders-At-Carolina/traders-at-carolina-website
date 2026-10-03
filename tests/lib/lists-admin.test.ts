// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "admin_1", sessionClaims: { metadata: { role: "admin" } } }),
  currentUser: async () => ({ primaryEmailAddress: { emailAddress: "officer@unc.edu" } }),
}));
const recordAudit = vi.hoisted(() => vi.fn(async () => 5));
vi.mock("@/lib/admin/audit", () => ({ recordAudit }));
const dbm = vi.hoisted(() => ({
  insertSponsor: vi.fn(async (v: Record<string, unknown>) => ({ id: "s1", ...v })),
  updateSponsor: vi.fn(),
  deleteSponsor: vi.fn(),
  insertPlacement: vi.fn(async (v: Record<string, unknown>) => ({ id: "p1", wallOrder: 1, ...v })),
  updatePlacement: vi.fn(),
  deletePlacement: vi.fn(),
  setWallOrders: vi.fn(),
  wallOrder: vi.fn(),
  getPerson: vi.fn(),
  updatePerson: vi.fn(async (_id: string, v: Record<string, unknown>) => ({ before: {}, after: { slug: "ada", name: "Ada", ...v } })),
  insertPerson: vi.fn(async (v: Record<string, unknown>) => ({ id: "o1", ...v })),
  deletePerson: vi.fn(),
  freeSlug: vi.fn(async () => "ada-lovelace"),
  nextSortOrder: vi.fn(async () => 3),
  tracksLedBy: vi.fn(async (): Promise<Array<{ name: string }>> => []),
  tierOrder: vi.fn(),
  setOrders: vi.fn(),
  setSeasonSetting: vi.fn(async (v: unknown) => ({ before: {}, after: v })),
  getTrack: vi.fn(async () => ({ id: "trading" })),
  listPeople: vi.fn(async () => [{ slug: "ada", visible: true }]),
  listTracks: vi.fn(async () =>
    ["trading", "research", "development"].map((id) => ({
      id,
      roleLabel: "Role",
      name: id,
      description: "Description.",
      goodFit: null,
      sampleProblem: null,
      recommendedBackground: ["One", "Two"],
      leadSlug: null,
    })),
  ),
  updateTrack: vi.fn(async (id: string, v: Record<string, unknown>) => ({ before: {}, after: { id, ...v } })),
}));
vi.mock("@/lib/admin/lists-db", () => dbm);

const sponsors = await import("@/app/admin/(console)/sponsors/actions");
const placements = await import("@/app/admin/(console)/placements/actions");
const officers = await import("@/app/admin/(console)/officers/actions");
const tracks = await import("@/app/admin/(console)/tracks/actions");

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
};
const blobImage = JSON.stringify({ src: "https://abc.public.blob.vercel-storage.com/logo.svg", width: 120, height: 40 });

beforeEach(() => vi.clearAllMocks());

describe("sponsors", () => {
  it("requires an https website and saves as one undoable change", async () => {
    expect((await sponsors.createSponsor({}, form({ name: "Optiver", url: "http://optiver.com" }))).fieldErrors?.url).toMatch(/https/);
    const state = await sponsors.createSponsor({}, form({ name: "Optiver", url: "https://optiver.com", logo: blobImage, relationship: "" }));
    expect(dbm.insertSponsor).toHaveBeenCalledWith(expect.objectContaining({ name: "Optiver", url: "https://optiver.com", relationship: null }));
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "sponsor", before: null }));
    expect(state).toMatchObject({ undoId: 5, redirectTo: "/admin/sponsors?saved=5" });
  });

  it("rejects logos that aren't uploaded to the club's store", async () => {
    const elsewhere = JSON.stringify({ src: "https://example.com/logo.png", width: 1, height: 1 });
    expect((await sponsors.createSponsor({}, form({ name: "X", logo: elsewhere }))).fieldErrors?.logo).toMatch(/Upload/);
  });
});

describe("placements", () => {
  it("needs a light-background logo to go on the wall", async () => {
    expect((await placements.createPlacement({}, form({ firm: "SIG", showOnWall: "on" }))).fieldErrors?.logo).toMatch(/needs a logo/);
    await placements.createPlacement({}, form({ firm: "SIG" }));
    expect(dbm.insertPlacement).toHaveBeenCalledWith(expect.objectContaining({ firm: "SIG", showOnWall: false }));
  });
});

describe("officers", () => {
  it("generates a fixed slug and puts a new officer last in their tier", async () => {
    await officers.createOfficer({}, form({ name: "Ada Lovelace", role: "President", group: "exec", visible: "on" }));
    expect(dbm.insertPerson).toHaveBeenCalledWith(expect.objectContaining({ slug: "ada-lovelace", sortOrder: 3, visible: true }));
  });

  it("enforces the Team rules: a track for track leads, alt text with a headshot", async () => {
    const state = await officers.createOfficer({}, form({ name: "T", role: "Lead", group: "track-lead", headshot: JSON.stringify({ src: "https://a.public.blob.vercel-storage.com/h.jpg", width: 800, height: 800 }) }));
    expect(state.fieldErrors).toMatchObject({ track: "Track leads need a track.", alt: expect.stringContaining("Describe") });
  });

  it("won't hide someone who still leads a track", async () => {
    dbm.getPerson.mockResolvedValue({ id: "o1", slug: "ada", name: "Ada", visible: true, group: "exec", sortOrder: 1 });
    dbm.tracksLedBy.mockResolvedValue([{ name: "Research" }]);
    const state = await officers.updateOfficerAction("o1", {}, form({ name: "Ada", role: "President", group: "exec" }));
    expect(state.error).toMatch(/leads Research\. Pick another lead/);
    expect(dbm.updatePerson).not.toHaveBeenCalled();
  });

  it("stores the academic year with an en dash", async () => {
    await officers.saveAcademicYear({}, form({ academicYear: "2026-27" }));
    expect(dbm.setSeasonSetting).toHaveBeenCalledWith({ academicYear: "2026–27" });
    expect((await officers.saveAcademicYear({}, form({ academicYear: "Fall" }))).fieldErrors?.academicYear).toMatch(/2026–27/);
  });
});

describe("tracks", () => {
  const base = { roleLabel: "Quantitative trading", name: "Trading", description: "Make markets.", recommendedBackground: "Probability\nPython" };

  it("refuses 'required' wording (03 §5)", async () => {
    const state = await tracks.updateTrackAction("trading", {}, form({ ...base, description: "Python is required." }));
    expect(state.error).toMatch(/required/);
    expect(dbm.updateTrack).not.toHaveBeenCalled();
  });

  it("needs 2 to 4 background items and saves the rest", async () => {
    expect((await tracks.updateTrackAction("trading", {}, form({ ...base, recommendedBackground: "Python" }))).fieldErrors?.recommendedBackground).toMatch(/2 to 4/);
    await tracks.updateTrackAction("trading", {}, form({ ...base, leadSlug: "ada" }));
    expect(dbm.updateTrack).toHaveBeenCalledWith("trading", expect.objectContaining({ recommendedBackground: ["Probability", "Python"], leadSlug: "ada" }));
  });
});
