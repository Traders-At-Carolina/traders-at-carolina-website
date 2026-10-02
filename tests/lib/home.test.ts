import { describe, expect, it } from "vitest";
import { homeApplyCopy, isUpcoming, numberSections } from "@/lib/home";
import { getApplicationState } from "@/lib/applications";
import type { Recruiting } from "@/content/types";

const now = new Date("2027-01-05T17:00:00Z"); // Jan 5, 12:00 PM Eastern

describe("isUpcoming", () => {
  it("is true for a future event", () => {
    expect(isUpcoming("2027-01-20T19:00", now)).toBe(true);
  });

  it("stays true through the end of the event's day in Eastern time", () => {
    expect(isUpcoming("2027-01-05T09:00", now)).toBe(true);
  });

  it("is false once the event's day has passed", () => {
    expect(isUpcoming("2027-01-04T19:00", now)).toBe(false);
  });
});

describe("numberSections", () => {
  it("numbers the rendered sections sequentially from 1", () => {
    expect(numberSections(["hero", "pillars", "photos"])).toEqual({ hero: 1, pillars: 2, photos: 3 });
  });
});

describe("homeApplyCopy", () => {
  const recruiting: Recruiting = { applicationsOpen: true, applyUrl: "https://forms.gle/apply" };
  const form = "https://forms.gle/interest";

  it("links both buttons to the form when open", () => {
    const copy = homeApplyCopy(getApplicationState(now, recruiting), recruiting, now);
    expect(copy.hero).toEqual({ label: "Apply", href: "https://forms.gle/apply", external: true, arrow: false });
    expect(copy.band).toMatchObject({ title: "Ready to start?", label: "Apply", href: "https://forms.gle/apply", external: true });
    expect(copy.band.lead).toBeUndefined();
  });

  it("states the deadline in the band when open with one", () => {
    const withDeadline = { ...recruiting, applyDeadline: "2027-01-20" };
    const copy = homeApplyCopy(getApplicationState(now, withDeadline), withDeadline, now);
    expect(copy.band.lead).toBe("Applications close Wed, Jan 20.");
  });

  it("sends both closed-state buttons straight to the interest form", () => {
    const closed = { ...recruiting, applicationsOpen: false, interestFormUrl: form };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero).toEqual({
      label: "Get notified",
      href: form,
      external: true,
      arrow: false,
      status: "Applications are closed. We recruit each fall and spring.",
    });
    expect(copy.band).toMatchObject({ title: "Applications are closed for now.", label: "Get notified", href: form, external: true });
    expect(copy.band.lead).toMatch(/Leave your email/);
  });

  it("names the next open date in the closed status line", () => {
    const closed = { ...recruiting, applicationsOpen: false, nextApplicationOpenDate: "2027-01-12" };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero.status).toBe("Applications are closed. The next cycle opens Tue, Jan 12.");
  });

  it("falls back to 'How to apply' without an interest form, never promising a notification", () => {
    const closed = { ...recruiting, applicationsOpen: false };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero).toMatchObject({ label: "How to apply", href: "/apply", external: false, arrow: true });
    expect(copy.band).toMatchObject({ label: "How to apply", href: "/apply" });
    expect(copy.band.lead).toBe("We recruit each fall and spring.");
  });

  it("ignores a next open date that is already in the past", () => {
    const closed = { ...recruiting, applicationsOpen: false, nextApplicationOpenDate: "2027-01-02" };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero.status).toBe("Applications are closed. We recruit each fall and spring.");
  });
});
