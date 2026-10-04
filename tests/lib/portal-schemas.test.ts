// @vitest-environment node
import { describe, expect, it } from "vitest";
import { announcementSchema, announcementStatus, portalLinkSchema, resourceSchema } from "@/lib/admin/portal-schemas";
import { parsePortalSetting, PORTAL_ACCESS_DEFAULTS } from "@/lib/members/settings";
import { downloadName, privateUploadTokenOptions, resourceContentType, resourceFileName, resourcePathname } from "@/lib/admin/upload-policy";
import { toEasternLocal } from "@/lib/eastern-time";

const pdf = JSON.stringify({ pathname: "resources/week-3.pdf", size: 1200, contentType: "application/pdf" });
const base = { title: "Options week 3", kind: "slides", section: "learning", tracks: [], source: "link", url: "https://drive.google.com/x", audience: "members" };
const issues = (r: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));

describe("resource rules (spec 06 §5.3)", () => {
  const schema = resourceSchema({ uploadsEnabled: true });

  it("saves a link and drops any file", () => {
    const r = schema.parse({ ...base, file: pdf });
    expect(r).toMatchObject({ url: "https://drive.google.com/x", file: null, tracks: [], pinned: false, hidden: false });
  });

  it("saves a file and drops any link", () => {
    const r = schema.parse({ ...base, source: "file", file: pdf, url: "" });
    expect(r).toMatchObject({ url: null, file: { pathname: "resources/week-3.pdf", contentType: "application/pdf" } });
  });

  it("needs the chosen source", () => {
    expect(issues(schema.safeParse({ ...base, url: "" }))).toHaveProperty("url");
    expect(issues(schema.safeParse({ ...base, source: "file", file: "" }))).toHaveProperty("file");
  });

  it("only accepts https links", () => {
    expect(issues(schema.safeParse({ ...base, url: "http://example.com" })).url).toMatch(/https/);
    expect(issues(schema.safeParse({ ...base, url: "javascript:alert(1)" })).url).toMatch(/https/);
  });

  it("rejects files outside resources/, of the wrong type, or too big", () => {
    const file = (o: object) => JSON.stringify({ pathname: "resources/a.pdf", size: 10, contentType: "application/pdf", ...o });
    expect(schema.safeParse({ ...base, source: "file", file: file({ pathname: "uploads/a.pdf" }) }).success).toBe(false);
    expect(schema.safeParse({ ...base, source: "file", file: file({ pathname: "resources/../x" }) }).success).toBe(false);
    expect(schema.safeParse({ ...base, source: "file", file: file({ contentType: "text/html" }) }).success).toBe(false);
    expect(schema.safeParse({ ...base, source: "file", file: file({ size: 51 * 1024 * 1024 }) }).success).toBe(false);
  });

  it("refuses files while the private store isn't set up, but still takes links", () => {
    const off = resourceSchema({ uploadsEnabled: false });
    expect(issues(off.safeParse({ ...base, source: "file", file: pdf })).source).toMatch(/private file store/);
    expect(off.safeParse(base).success).toBe(true);
  });

  it("keeps known tracks in a fixed order, empty meaning all", () => {
    expect(schema.parse({ ...base, tracks: ["development", "trading"] }).tracks).toEqual(["trading", "development"]);
    expect(schema.safeParse({ ...base, tracks: ["quant"] }).success).toBe(false);
  });

  it("only allows the two portal audiences", () => {
    expect(schema.safeParse({ ...base, audience: "public" }).success).toBe(false);
    expect(schema.parse({ ...base, audience: "signed_in" }).audience).toBe("signed_in");
  });
});

describe("announcement rules", () => {
  const a = { title: "Kickoff", body: "See the [tracker](/portal) and *RSVP*.", audience: "signed_in" };

  it("reads Eastern times and keeps show-until after show-from", () => {
    const r = announcementSchema.parse({ ...a, showFrom: "2026-10-05T09:00", showUntil: "2026-10-12T17:00" });
    expect(r.showFrom?.toISOString()).toBe("2026-10-05T13:00:00.000Z");
    expect(issues(announcementSchema.safeParse({ ...a, showFrom: "2026-10-12T09:00", showUntil: "2026-10-05T09:00" })).showUntil).toMatch(/before/);
    expect(announcementSchema.parse({ ...a, showFrom: "", showUntil: "" })).toMatchObject({ showFrom: null, showUntil: null });
  });

  it("only allows safe links in the body", () => {
    expect(issues(announcementSchema.safeParse({ ...a, body: "[x](javascript:alert(1))" })).body).toMatch(/Links must start/);
    expect(announcementSchema.safeParse({ ...a, body: "[mail](mailto:club@unc.edu) and [site](https://unc.edu)" }).success).toBe(true);
  });

  it("needs a title, a body and a portal audience", () => {
    const e = issues(announcementSchema.safeParse({ title: " ", body: "", audience: "public" }));
    expect(Object.keys(e).sort()).toEqual(["audience", "body", "title"]);
  });

  it("is Live, Scheduled or Expired by its dates", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(announcementStatus({ showFrom: null, showUntil: null }, now)).toBe("live");
    expect(announcementStatus({ showFrom: new Date("2026-10-11T00:00:00Z"), showUntil: null }, now)).toBe("scheduled");
    expect(announcementStatus({ showFrom: null, showUntil: new Date("2026-10-09T00:00:00Z") }, now)).toBe("expired");
  });
});

describe("member link rules", () => {
  it("needs a label and an https URL", () => {
    expect(portalLinkSchema.parse({ label: "Tracker", url: " https://docs.google.com/x ", description: "", audience: "members" })).toEqual({
      label: "Tracker",
      url: "https://docs.google.com/x",
      description: null,
      audience: "members",
    });
    expect(portalLinkSchema.safeParse({ label: "Tracker", url: "http://x.com", audience: "members" }).success).toBe(false);
    expect(portalLinkSchema.safeParse({ label: "", url: "https://x.com", audience: "members" }).success).toBe(false);
  });
});

describe("portal setting", () => {
  it("defaults alumni access and requests on, and survives a bad stored value", () => {
    expect(parsePortalSetting(undefined)).toEqual(PORTAL_ACCESS_DEFAULTS);
    expect(parsePortalSetting({ acceptRequests: false, welcomeMember: "  Hi  " })).toEqual({ alumniAccess: true, acceptRequests: false, welcomeMember: "Hi" });
    expect(parsePortalSetting({ alumniAccess: "yes" })).toEqual(PORTAL_ACCESS_DEFAULTS);
  });
});

describe("private uploads", () => {
  it("only issues tokens under resources/", () => {
    expect(privateUploadTokenOptions("resources/a.pdf")).toMatchObject({ addRandomSuffix: true, maximumSizeInBytes: 50 * 1024 * 1024 });
    expect(() => privateUploadTokenOptions("uploads/a.pdf")).toThrow();
    expect(() => privateUploadTokenOptions("resources/../a.pdf")).toThrow();
  });

  it("names, types and labels files", () => {
    expect(resourcePathname("Week 3 Options (final).PDF")).toBe("resources/week-3-options-final.pdf");
    expect(resourceContentType({ type: "", name: "deck.pptx" })).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(resourceContentType({ type: "text/html", name: "x.html" })).toBe("");
    expect(resourceFileName("resources/week-3-AbCdEfGhIjKlMnOpQrStUvWxYz0123.pdf")).toBe("week-3.pdf");
    expect(downloadName('Week 3: "Options"', "resources/a-xyz.pdf")).toBe("Week 3 Options.pdf");
  });

  it("round-trips Eastern datetime-local values", () => {
    expect(toEasternLocal(new Date("2026-10-05T13:00:00Z"))).toBe("2026-10-05T09:00");
    expect(toEasternLocal(new Date("2026-12-05T14:30:00Z"))).toBe("2026-12-05T09:30");
  });
});
