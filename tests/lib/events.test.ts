import { describe, expect, it } from "vitest";
import { events } from "@/content/events";
import type { ClubEvent } from "@/content/types";
import { eventTypeLabel, formatEventWhen, nextFeaturedEvent, upcomingEvents } from "@/lib/events";
import { collectEventProblems, validateEvents } from "@/lib/validate-events";

const now = new Date("2027-01-05T17:00:00Z");
const event = (title: string, startsAt: string, extra: Partial<ClubEvent> = {}): ClubEvent => ({
  title,
  type: "workshop",
  startsAt,
  audience: "public",
  featured: false,
  ...extra,
});

describe("upcomingEvents", () => {
  it("drops finished events and sorts the rest soonest first", () => {
    const list = [event("Later", "2027-02-01T18:00"), event("Past", "2027-01-04T19:00"), event("Sooner", "2027-01-14T19:00")];
    expect(upcomingEvents(list, now).map((e) => e.title)).toEqual(["Sooner", "Later"]);
  });

  it("keeps an event through the end of its last day in Eastern time", () => {
    expect(upcomingEvents([event("This morning", "2027-01-05T09:00")], now)).toHaveLength(1);
    expect(upcomingEvents([event("Ends tomorrow", "2027-01-03T09:00", { endsAt: "2027-01-06T17:00" })], now)).toHaveLength(1);
  });
});

describe("nextFeaturedEvent", () => {
  it("picks the soonest upcoming event that is both public and featured", () => {
    const list = [
      event("Members social", "2027-01-07T19:00", { audience: "members" }),
      event("Unfeatured", "2027-01-08T19:00"),
      event("Featured later", "2027-01-20T19:00", { featured: true }),
      event("Featured sooner", "2027-01-10T19:00", { featured: true }),
    ];
    expect(nextFeaturedEvent(list, now)?.title).toBe("Featured sooner");
    expect(nextFeaturedEvent([event("Unfeatured", "2027-01-08T19:00")], now)).toBeUndefined();
  });
});

describe("eventTypeLabel and formatEventWhen", () => {
  it("labels every type", () => {
    expect(eventTypeLabel("competition")).toBe("Competition");
    expect(eventTypeLabel("general-meeting")).toBe("General meeting");
    expect(eventTypeLabel("other")).toBe("Event");
  });

  it("shows the start, a same-day end time, or a multi-day range", () => {
    expect(formatEventWhen({ startsAt: "2027-01-14T19:00" })).toBe("Thu, Jan 14 · 7:00 PM");
    expect(formatEventWhen({ startsAt: "2027-01-14T19:00", endsAt: "2027-01-14T20:30" })).toBe("Thu, Jan 14 · 7:00 PM–8:30 PM");
    expect(formatEventWhen({ startsAt: "2027-01-14T19:00", endsAt: "2027-01-16T17:00" })).toBe("Thu, Jan 14 · 7:00 PM – Sat, Jan 16 · 5:00 PM");
  });
});

describe("validateEvents", () => {
  it("accepts the shipped events", () => {
    expect(() => validateEvents(events)).not.toThrow();
  });

  it("accepts a complete event", () => {
    const ok = event("Citadel challenge", "2027-01-14T19:00", {
      type: "competition",
      endsAt: "2027-01-14T21:00",
      location: "Online",
      url: "https://forms.gle/x",
      featured: true,
    });
    expect(collectEventProblems([ok])).toEqual([]);
  });

  it("lists every problem at once", () => {
    const bad: ClubEvent[] = [
      event(" ", "Oct 16", { location: "", url: "http://insecure.example" }),
      event("Backwards", "2027-01-14T19:00", { endsAt: "2027-01-14T18:00" }),
      event("Featured but private", "2027-01-14T19:00", { audience: "members", featured: true }),
      event("Date only", "2027-01-14"),
    ];
    expect(collectEventProblems(bad)).toEqual([
      "events[0].title must not be empty",
      'events[0].startsAt must be "YYYY-MM-DDTHH:mm" (got "Oct 16")',
      "events[0].location must not be empty when set",
      "events[0].url must start with https://",
      "events[1].endsAt must not be before startsAt",
      "events[2].featured is only allowed on public events",
      'events[3].startsAt must be "YYYY-MM-DDTHH:mm" (got "2027-01-14")',
    ]);
    expect(() => validateEvents(bad)).toThrow(/content\/events\.ts/);
  });
});
