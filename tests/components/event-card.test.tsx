import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/EventCard";
import type { ClubEvent } from "@/content/types";

const event: ClubEvent = {
  title: "Citadel challenge",
  type: "competition",
  startsAt: "2027-01-14T19:00",
  endsAt: "2027-01-14T21:00",
  location: "Gardner Hall 105",
  description: "Teams of three.",
  url: "https://forms.gle/x",
  audience: "public",
  featured: true,
};

describe("EventCard", () => {
  it("shows the label, title, time range, location and a details link", () => {
    render(<EventCard event={event} label="Competition" />);
    expect(screen.getByText("Competition")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Citadel challenge" })).toBeInTheDocument();
    expect(screen.getByText("Thu, Jan 14 · 7:00 PM–9:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Gardner Hall 105")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Details/ })).toHaveAttribute("href", "https://forms.gle/x");
  });

  it("shows the description only when asked (the portal, not Home), and leaves out what isn't set", () => {
    const { unmount } = render(<EventCard event={event} label="Competition" showDescription />);
    expect(screen.getByText("Teams of three.")).toBeInTheDocument();
    unmount();
    render(<EventCard event={{ ...event, location: undefined, url: undefined }} label="Upcoming" />);
    expect(screen.queryByText("Teams of three.")).not.toBeInTheDocument();
    expect(screen.queryByText("Gardner Hall 105")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
