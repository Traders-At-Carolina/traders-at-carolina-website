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

  it("links both buttons to the form when open", () => {
    const copy = homeApplyCopy(getApplicationState(now, recruiting), recruiting, now);
    expect(copy.hero).toEqual({ label: "Apply", href: "https://forms.gle/apply", external: true, arrow: false });
    expect(copy.band).toEqual({ title: "Ready to start?", label: "Apply", href: "https://forms.gle/apply", external: true });
  });

  it("shows the next open date when closed", () => {
    const closed = { ...recruiting, applicationsOpen: false, nextApplicationOpenDate: "2027-01-12" };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero).toEqual({ label: "Applications open Jan 12", href: "/apply", external: false, arrow: false });
    expect(copy.band).toEqual({
      title: "Applications are closed for now.",
      label: "Get notified",
      href: "/apply",
      external: false,
    });
  });

  it("falls back to 'How to apply' when closed with no next date", () => {
    const closed = { ...recruiting, applicationsOpen: false };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero).toEqual({ label: "How to apply", href: "/apply", external: false, arrow: true });
  });

  it("ignores a next open date that is already in the past", () => {
    const closed = { ...recruiting, applicationsOpen: false, nextApplicationOpenDate: "2027-01-02" };
    const copy = homeApplyCopy(getApplicationState(now, closed), closed, now);
    expect(copy.hero.label).toBe("How to apply");
  });
});
