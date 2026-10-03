import { describe, expect, it } from "vitest";
import { getApplicationState } from "@/lib/applications";

const base = { applyUrl: "https://forms.gle/x", applyDeadline: "2026-11-01T23:59", nextApplicationOpenDate: "2026-10-20" };

describe("getApplicationState with a scheduled opening (spec 06 §5.2)", () => {
  it("is closed until the next-open date, with that date as nextOpen", () => {
    const state = getApplicationState(new Date("2026-10-19T12:00:00-04:00"), { ...base, applicationsOpen: false, mode: "scheduled" });
    expect(state.status).toBe("closed");
    expect(state.status === "closed" && state.nextOpen?.toISOString()).toBe(new Date("2026-10-20T23:59:00-04:00").toISOString());
  });

  it("opens by itself once the next-open moment passes, and still closes at the deadline", () => {
    expect(getApplicationState(new Date("2026-10-21T09:00:00-04:00"), { ...base, applicationsOpen: false, mode: "scheduled" }).status).toBe("open");
    expect(getApplicationState(new Date("2026-11-02T09:00:00-05:00"), { ...base, applicationsOpen: false, mode: "scheduled" }).status).toBe("closed");
  });

  it("treats mode open and closed like applicationsOpen", () => {
    expect(getApplicationState(new Date("2026-10-21T09:00:00-04:00"), { ...base, applicationsOpen: false, mode: "open" }).status).toBe("open");
    expect(getApplicationState(new Date("2026-10-21T09:00:00-04:00"), { ...base, applicationsOpen: true, mode: "closed" }).status).toBe("closed");
  });
});
