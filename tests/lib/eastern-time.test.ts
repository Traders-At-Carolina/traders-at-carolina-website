import { describe, expect, it } from "vitest";
import { parseEasternDateTime } from "@/lib/eastern-time";

describe("parseEasternDateTime", () => {
  it("parses a winter (EST, UTC-5) date-time", () => {
    expect(parseEasternDateTime("2027-02-06T23:59").toISOString()).toBe("2027-02-07T04:59:00.000Z");
  });

  it("parses a summer (EDT, UTC-4) date-time", () => {
    expect(parseEasternDateTime("2026-10-16T19:00").toISOString()).toBe("2026-10-16T23:00:00.000Z");
  });

  it("treats a date-only value as 23:59 Eastern that day", () => {
    expect(parseEasternDateTime("2027-01-12").toISOString()).toBe("2027-01-13T04:59:00.000Z");
  });

  it("throws on malformed input", () => {
    expect(() => parseEasternDateTime("Feb 6")).toThrow(/Invalid date/);
    expect(() => parseEasternDateTime("2027-13-40")).toThrow(/Invalid date/);
  });
});
