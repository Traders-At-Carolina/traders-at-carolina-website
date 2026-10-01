import { describe, expect, it } from "vitest";
import { getApplicationState } from "@/lib/applications";
import type { Recruiting } from "@/content/types";

const base: Recruiting = {
  applicationsOpen: true,
  applyUrl: "https://forms.gle/example",
};
const before = new Date("2027-02-01T12:00:00Z");
const after = new Date("2027-02-08T12:00:00Z");

describe("getApplicationState", () => {
  it("is closed when the flag is off", () => {
    expect(getApplicationState(before, { ...base, applicationsOpen: false }).status).toBe("closed");
  });

  it("is open with no deadline", () => {
    expect(getApplicationState(after, base)).toEqual({ status: "open" });
  });

  it("is open before the deadline and exposes it", () => {
    const state = getApplicationState(before, { ...base, applyDeadline: "2027-02-06T23:59" });
    expect(state.status).toBe("open");
    expect(state.status === "open" && state.deadline?.toISOString()).toBe("2027-02-07T04:59:00.000Z");
  });

  it("is closed after the deadline even when the flag is on", () => {
    expect(getApplicationState(after, { ...base, applyDeadline: "2027-02-06T23:59" }).status).toBe("closed");
  });

  it("passes the next open date through when closed", () => {
    const state = getApplicationState(before, {
      ...base,
      applicationsOpen: false,
      nextApplicationOpenDate: "2027-08-25",
    });
    expect(state).toEqual({ status: "closed", nextOpen: new Date("2027-08-26T03:59:00.000Z") });
  });
});
