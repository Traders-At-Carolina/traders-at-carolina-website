import { describe, expect, it } from "vitest";
import { batchUnchanged, membershipFromRow, parseRosterInput, previewAdd, toCsv } from "@/lib/members/roster";

describe("parseRosterInput", () => {
  it("reads one entry per line as an email or 'Name, email'", () => {
    expect(parseRosterInput("ada@unc.edu\nGrace Hopper, GRACE@unc.edu\n\n")).toEqual({
      rows: [
        { line: 1, email: "ada@unc.edu", name: "" },
        { line: 2, email: "grace@unc.edu", name: "Grace Hopper" },
      ],
      invalid: [],
    });
  });

  it("reads CSV with a header, quoted names and optional track and class year", () => {
    const csv = 'name,email,track,class_year\n"Lovelace, Ada",ada@unc.edu,research,2027\nAlan,alan@unc.edu,,';
    expect(parseRosterInput(csv).rows).toEqual([
      { line: 2, email: "ada@unc.edu", name: "Lovelace, Ada", track: "research", classYear: 2027 },
      { line: 3, email: "alan@unc.edu", name: "Alan" },
    ]);
  });

  it("flags lines that aren't an email, and bad tracks or years", () => {
    const { invalid } = parseRosterInput("not an email\nname,email,track,class_year\nX,x@unc.edu,magic,27");
    expect(invalid.map((i) => i.line)).toEqual([1, 3]);
  });
});

describe("previewAdd", () => {
  it("splits rows into new, already on the roster and duplicates within the paste", () => {
    const { rows } = parseRosterInput("a@unc.edu\nb@unc.edu\nA@unc.edu");
    const preview = previewAdd(rows, new Set(["b@unc.edu"]));
    expect(preview.add.map((r) => r.email)).toEqual(["a@unc.edu"]);
    expect(preview.existing.map((r) => r.email)).toEqual(["b@unc.edu"]);
    expect(preview.duplicates.map((r) => r.line)).toEqual([3]);
  });
});

describe("membershipFromRow", () => {
  it("gives active members access, alumni only while alumni access is on, and inactive none", () => {
    expect(membershipFromRow({ status: "active", track: "trading" }, { alumniAccess: true })).toEqual({ status: "active", track: "trading" });
    expect(membershipFromRow({ status: "alumni", track: null }, { alumniAccess: true })).toEqual({ status: "alumni" });
    expect(membershipFromRow({ status: "alumni", track: null }, { alumniAccess: false })).toBeNull();
    expect(membershipFromRow({ status: "inactive", track: "research" }, { alumniAccess: true })).toBeNull();
    expect(membershipFromRow(undefined, { alumniAccess: true })).toBeNull();
  });
});

describe("toCsv", () => {
  it("writes a header and quotes fields that need it", () => {
    expect(toCsv([{ name: 'Lovelace, "Ada"', email: "ada@unc.edu", status: "active", track: null, classYear: 2027, cohort: "Fall 2026", account: "Signed up" }])).toBe(
      'name,email,status,track,class_year,cohort,account\n"Lovelace, ""Ada""",ada@unc.edu,active,,2027,Fall 2026,Signed up\n',
    );
  });
});

describe("batchUnchanged", () => {
  it("is true only when every row still matches the batch's recorded state", () => {
    const after = [{ id: "1", status: "alumni" }, { id: "2", status: "alumni" }];
    expect(batchUnchanged(after, [{ id: "1", status: "alumni" }, { id: "2", status: "alumni" }])).toBe(true);
    expect(batchUnchanged(after, [{ id: "1", status: "alumni" }, { id: "2", status: "active" }])).toBe(false);
    expect(batchUnchanged(after, [{ id: "1", status: "alumni" }])).toBe(false);
  });
});
