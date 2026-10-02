import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { HomePage } from "@/components/home/HomePage";
import type { HomeContent, HomePhoto, Recruiting } from "@/content/types";

const now = new Date("2027-01-05T17:00:00Z");
const image = { src: "/images/events/x.jpg", width: 1800, height: 1200, blurDataURL: "data:image/png;base64,iVBORw0KGgo=" } as StaticImageData;
const photo = (n: number, ratio: HomePhoto["ratio"] = "3:2"): HomePhoto => ({
  src: image,
  alt: `Members at event ${n}`,
  caption: `Event ${n}`,
  ratio,
});

const base: HomeContent = {
  hero: { headline: "Rigor, practiced together.", headlineEmphasis: "practiced", subhead: "Prepares UNC students." },
  headings: { pillars: "Three ways we build quants.", numbers: "By the numbers title", inside: "Inside title" },
  pillars: [
    { title: "Preparation", body: "P.", link: { label: "See weekly activities", href: "/membership#activities" } },
    { title: "Engagement", body: "E.", link: { label: "Explore the three tracks", href: "/membership#tracks" } },
    { title: "Opportunity", body: "O.", link: { label: "Meet our sponsors", href: "/about#partners" } },
  ],
  stats: {},
  photos: [],
};
const closed: Recruiting = { applicationsOpen: false, applyUrl: "" };
const open: Recruiting = { applicationsOpen: true, applyUrl: "https://forms.gle/apply" };

const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);

describe("HomePage", () => {
  it("renders one h1 with the italic emphasis", () => {
    render(<HomePage home={base} recruiting={closed} now={now} />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].querySelector("em")).toHaveTextContent("practiced");
  });

  it("hides stats and photos sections when there is no real content", () => {
    render(<HomePage home={base} recruiting={closed} now={now} />);
    expect(screen.queryByText("By the numbers title")).not.toBeInTheDocument();
    expect(screen.queryByText("Inside title")).not.toBeInTheDocument();
    expect(eyebrows()).toEqual(["§ 01 — Quantitative finance at UNC", "§ 02 — What we do"]);
  });

  it("keeps numbering sequential when stats are hidden but photos show", () => {
    render(<HomePage home={{ ...base, photos: [photo(1), photo(2)] }} recruiting={closed} now={now} />);
    expect(eyebrows()).toEqual([
      "§ 01 — Quantitative finance at UNC",
      "§ 02 — What we do",
      "§ 03 — Inside the club",
    ]);
  });

  it("renders only the stats that have values", () => {
    render(<HomePage home={{ ...base, stats: { members: 120, foundedYear: 2019 } }} recruiting={closed} now={now} />);
    const section = screen.getByRole("region", { name: "By the numbers title" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(2);
    expect(within(section).getByText("120+")).toBeInTheDocument();
    expect(within(section).queryByText("Partner firms")).not.toBeInTheDocument();
  });

  it("links hero and band buttons to the form when applications are open", () => {
    render(<HomePage home={base} recruiting={open} now={now} />);
    const applyLinks = screen.getAllByRole("link", { name: /^Apply/ });
    expect(applyLinks).toHaveLength(2);
    applyLinks.forEach((link) => expect(link).toHaveAttribute("href", "https://forms.gle/apply"));
    expect(screen.getByRole("heading", { name: "Ready to start?" })).toBeInTheDocument();
  });

  it("says applications are closed in the hero and links Get notified to the interest form", () => {
    const interest = "https://forms.gle/interest";
    render(<HomePage home={base} recruiting={{ ...closed, interestFormUrl: interest, nextApplicationOpenDate: "2027-01-12" }} now={now} />);
    expect(screen.getByText("Applications are closed. The next cycle opens Tue, Jan 12.")).toBeInTheDocument();
    const notify = screen.getAllByRole("link", { name: /^Get notified/ });
    expect(notify).toHaveLength(2);
    notify.forEach((link) => expect(link).toHaveAttribute("href", interest));
    expect(screen.getByRole("heading", { name: "Applications are closed for now." })).toBeInTheDocument();
  });

  it("never shows Get notified without an interest form", () => {
    render(<HomePage home={base} recruiting={closed} now={now} />);
    expect(screen.queryByRole("link", { name: /Get notified/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^How to apply/ })).toHaveLength(2);
  });

  it("flips open-state buttons to the closed state once the deadline passes in the browser", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const withDeadline = { ...open, applyDeadline: "2027-01-05T13:00", interestFormUrl: "https://forms.gle/interest" };
      render(<HomePage home={base} recruiting={withDeadline} now={now} />);
      expect(screen.getAllByRole("link", { name: /^Apply/ })).toHaveLength(2);
      await act(async () => {
        vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      });
      expect(screen.queryByRole("link", { name: /^Apply/ })).not.toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /^Get notified/ })).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lists sponsors by name in the numbers section instead of a bare count", () => {
    render(
      <HomePage
        home={{ ...base, stats: { foundedYear: 2023, partnerFirms: 2 } }}
        recruiting={closed}
        sponsors={[
          { name: "Jane Street", logo: { src: "/images/sponsors/jane-street.svg", width: 28, height: 28 } },
          { name: "TradingView" },
        ]}
        now={now}
      />,
    );
    const section = screen.getByRole("region", { name: "By the numbers title" });
    expect(within(section).getByText("2023")).toBeInTheDocument();
    expect(within(section).queryByText("Partner firms")).not.toBeInTheDocument();
    expect(within(section).getByText("Jane Street")).toBeInTheDocument();
    expect(within(section).getByText("TradingView")).toBeInTheDocument();
  });

  it("puts sponsors on graphite with a decorative mark beside each name that has one", () => {
    render(
      <HomePage
        home={{ ...base, stats: { foundedYear: 2023 } }}
        recruiting={closed}
        sponsors={[
          { name: "Jane Street", logo: { src: "/images/sponsors/jane-street.svg", width: 28, height: 28 } },
          { name: "TradingView" },
        ]}
        now={now}
      />,
    );
    const section = screen.getByRole("region", { name: "By the numbers title" });
    expect(section).toHaveClass("surface-graphite");
    const marks = section.querySelectorAll('li span[aria-hidden="true"]');
    expect(marks).toHaveLength(1);
    expect(marks[0].closest("li")).toHaveTextContent("Jane Street");
  });

  it("shows the Upcoming card only for events that haven't passed", () => {
    const upcoming = { title: "Mock trading night", date: "2027-01-14T19:00", location: "Gardner Hall 105" };
    const withPhotos = { ...base, photos: [photo(1), photo(2, "4:5")] };

    const { unmount } = render(<HomePage home={{ ...withPhotos, upcoming }} recruiting={closed} now={now} />);
    expect(screen.getByText("Mock trading night")).toBeInTheDocument();
    expect(screen.getByText("Thu, Jan 14 · 7:00 PM")).toBeInTheDocument();
    unmount();

    render(<HomePage home={{ ...withPhotos, upcoming: { ...upcoming, date: "2027-01-02T19:00" } }} recruiting={closed} now={now} />);
    expect(screen.queryByText("Mock trading night")).not.toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(2);
  });

  it("renders photos with alt text and captions", () => {
    render(<HomePage home={{ ...base, photos: [photo(1), photo(2), photo(3)] }} recruiting={closed} now={now} />);
    expect(screen.getAllByRole("img", { name: /Members at event/ })).toHaveLength(3);
    expect(screen.getByText("Event 3")).toBeInTheDocument();
  });

  it("renders exactly one navy band", () => {
    const { container } = render(<HomePage home={base} recruiting={closed} now={now} />);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(1);
  });
});
