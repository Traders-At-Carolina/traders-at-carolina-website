import { describe, expect, it } from "vitest";
import { formatEventDateTime, formatMonthDay } from "@/lib/format";
import { parseEasternDateTime } from "@/lib/eastern-time";

describe("formatEventDateTime", () => {
  it("formats in Eastern time as 'Thu, Oct 15 · 7:00 PM'", () => {
    expect(formatEventDateTime(parseEasternDateTime("2026-10-15T19:00"))).toBe("Thu, Oct 15 · 7:00 PM");
  });

  it("keeps the Eastern calendar day when UTC has already rolled over", () => {
    expect(formatEventDateTime(new Date("2027-02-07T03:30:00Z"))).toBe("Sat, Feb 6 · 10:30 PM");
  });
});

describe("formatMonthDay", () => {
  it("formats as 'Jan 12' in Eastern time", () => {
    expect(formatMonthDay(parseEasternDateTime("2027-01-12"))).toBe("Jan 12");
  });
});
