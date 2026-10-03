import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { PortalPage } from "@/components/portal/PortalPage";
import { apply } from "@/content/apply";
import { membership } from "@/content/membership";
import { portal } from "@/content/portal";
import type { ClubEvent, Recruiting } from "@/content/types";
import type { Viewer } from "@/lib/auth/viewer";
import { NO_RESOURCES, type PortalResource } from "@/lib/data/portal";

const now = new Date("2027-01-05T17:00:00Z");
const closed: Recruiting = { applicationsOpen: false, applyUrl: "", interestFormUrl: "https://forms.gle/interest" };
const open: Recruiting = { applicationsOpen: true, applyUrl: "https://forms.gle/apply", cycleLabel: "Spring 2027", applyDeadline: "2027-01-20T23:59" };

const visitor: Viewer = { userId: "user_1", firstName: "Ada", isMember: false, isAdmin: false };
const member: Viewer = { ...visitor, isMember: true };
const admin: Viewer = { ...visitor, isMember: true, isAdmin: true };

const TRACKER = "https://docs.google.com/spreadsheets/d/members-only";
const event = (title: string, type: ClubEvent["type"], startsAt: string, extra: Partial<ClubEvent> = {}): ClubEvent => ({
  title,
  type,
  startsAt,
  audience: "public",
  featured: false,
  ...extra,
});
const resource = (id: string, kind: PortalResource["kind"], extra: Partial<PortalResource> = {}): PortalResource => ({
  id,
  title: `Resource ${id}`,
  kind,
  tracks: [],
  href: `/portal/files/${id}`,
  pinned: false,
  ...extra,
});

type Props = Parameters<typeof PortalPage>[0];
const renderPortal = (viewer: Viewer, extra: Partial<Props> = {}) =>
  render(
    <PortalPage
      viewer={viewer}
      portal={portal}
      membership={membership}
      apply={apply}
      site={{ mission: "Preparing UNC students for quant careers." }}
      timeline={{ recruiting: closed, events: [] }}
      events={[]}
      resources={NO_RESOURCES}
      announcements={[]}
      links={[]}
      settings={{ acceptRequests: false }}
      request={null}
      leadNames={{}}
      now={now}
      {...extra}
    />,
  );

const eyebrows = () => screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent);

describe("PortalPage", () => {
  it("greets the viewer by first name in the only h1, or without a name when there is none", () => {
    const { unmount } = renderPortal(visitor);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["Welcome, Ada."]);
    unmount();
    renderPortal({ ...visitor, firstName: null });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Welcome\.$/);
  });

  it("shows someone who isn't a member the recruiting timeline first, then prep, events, tracks and the club", () => {
    renderPortal(visitor);
    expect(eyebrows()).toEqual(["§ 01 — Recruiting", "§ 02 — Interview prep", "§ 03 — Upcoming", "§ 04 — Tracks", "§ 05 — The club"]);
    expect(screen.getByText("Not yet a member")).toBeInTheDocument();
    expect(screen.getByText(portal.header.visitorLead)).toBeInTheDocument();
    const recruiting = screen.getByRole("region", { name: portal.headings.recruiting });
    expect(within(recruiting).getByRole("link", { name: /Keep me posted/ })).toHaveAttribute("href", "https://forms.gle/interest");
  });

  it("never renders member sections for someone who isn't a member, even if handed member links", () => {
    const { container } = renderPortal(visitor, { links: [{ id: "t", label: "Internship tracker", url: TRACKER }] });
    expect(screen.queryByRole("region", { name: portal.headings.learning })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: portal.headings.tools })).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain(TRACKER);
  });

  it("gives members their resources first, with no recruiting timeline", () => {
    renderPortal(member);
    expect(eyebrows()).toEqual([
      "§ 01 — Learning",
      "§ 02 — Member tools",
      "§ 03 — Upcoming",
      "§ 04 — Interview prep",
      "§ 05 — Tracks",
      "§ 06 — The club",
    ]);
    expect(screen.queryByRole("region", { name: portal.headings.recruiting })).not.toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText(portal.header.memberLead)).toBeInTheDocument();
  });

  it("uses the admin's welcome lines when they're set", () => {
    const { unmount } = renderPortal(member, { settings: { acceptRequests: false, welcomeMember: "Welcome back to the club." } });
    expect(screen.getByText("Welcome back to the club.")).toBeInTheDocument();
    unmount();
    renderPortal(visitor, { settings: { acceptRequests: false, welcomeVisitor: "Glad you're here." } });
    expect(screen.getByText("Glad you're here.")).toBeInTheDocument();
  });

  it("shows three empty Learning columns until something is posted", () => {
    renderPortal(member);
    const learning = screen.getByRole("region", { name: portal.headings.learning });
    expect(within(learning).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Slides", "Notes", "Resources and textbooks"]);
    expect(within(learning).getAllByText(portal.learning.empty)).toHaveLength(3);
  });

  it("sorts learning resources into columns by kind, with the other section in the last column", () => {
    const resources = {
      ...NO_RESOURCES,
      learning: [resource("deck", "slides", { tracks: ["trading"] }), resource("book", "textbook"), resource("set", "problem-set")],
      other: [resource("misc", "link", { href: "https://example.com/misc" })],
    };
    renderPortal(member, { resources });
    const learning = screen.getByRole("region", { name: portal.headings.learning });
    expect(within(learning).getByRole("link", { name: /Resource deck/ })).toHaveAttribute("href", "/portal/files/deck");
    expect(within(learning).getByText("Trading")).toBeInTheDocument();
    expect(within(learning).getAllByText(portal.learning.empty)).toHaveLength(1);
    const lastColumn = within(learning).getByRole("heading", { name: "Resources and textbooks" }).parentElement as HTMLElement;
    expect(within(lastColumn).getAllByRole("link").map((a) => a.textContent?.replace(/\s*\(opens in a new tab\)/, ""))).toEqual([
      "Resource book",
      "Resource set",
      "Resource misc",
    ]);
  });

  it("shows member links as cards, or where the tracker will be until an admin adds one", () => {
    const { unmount } = renderPortal(member, { links: [{ id: "t", label: "Internship tracker", url: TRACKER, description: "Community-run." }] });
    const tools = screen.getByRole("region", { name: portal.headings.tools });
    expect(within(tools).getByRole("link", { name: /Internship tracker/ })).toHaveAttribute("href", TRACKER);
    expect(within(tools).getByText(portal.tools.competitions.body)).toBeInTheDocument();
    unmount();
    renderPortal(member);
    const pending = screen.getByRole("region", { name: portal.headings.tools });
    expect(within(pending).queryByRole("link")).not.toBeInTheDocument();
    expect(within(pending).getByText(portal.tools.linksPending.pending)).toBeInTheDocument();
  });

  it("links admins, and only admins, to /admin", () => {
    const { unmount } = renderPortal(admin);
    expect(screen.getByRole("link", { name: /^Admin/ })).toHaveAttribute("href", "/admin");
    unmount();
    renderPortal(member);
    expect(screen.queryByRole("link", { name: /^Admin/ })).not.toBeInTheDocument();
  });

  it("renders the account control it's given", () => {
    renderPortal(member, { account: <button type="button">Account menu</button> });
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
  });

  it("lists events by type, leaving recruiting events to the timeline for non-members", () => {
    const events = [
      event("Info session", "recruiting", "2027-01-10T19:00"),
      event("Citadel challenge", "competition", "2027-01-20T18:00", { description: "Teams of three." }),
    ];
    const { unmount } = renderPortal(visitor, { events, timeline: { recruiting: closed, events: [events[0]] } });
    const upcoming = screen.getByRole("region", { name: portal.headings.events });
    expect(within(upcoming).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Citadel challenge"]);
    expect(within(upcoming).getByText("Competition")).toBeInTheDocument();
    expect(within(upcoming).getByText("Teams of three.")).toBeInTheDocument();
    const recruiting = screen.getByRole("region", { name: portal.headings.recruiting });
    expect(within(recruiting).getByRole("heading", { name: "Info session" })).toBeInTheDocument();
    unmount();

    renderPortal(member, { events });
    const memberUpcoming = screen.getByRole("region", { name: portal.headings.events });
    expect(within(memberUpcoming).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Info session", "Citadel challenge"]);
  });

  it("says so when nothing is scheduled", () => {
    renderPortal(visitor);
    expect(screen.getByText(portal.eventsEmpty)).toBeInTheDocument();
  });

  it("adds posted interview-prep and recruiting resources under their sections", () => {
    const resources = { ...NO_RESOURCES, "interview-prep": [resource("probs", "problem-set")], recruiting: [resource("guide", "link")] };
    renderPortal(visitor, { resources });
    const prep = screen.getByRole("region", { name: portal.headings.prep });
    expect(within(prep).getByRole("heading", { name: "Practice material" })).toBeInTheDocument();
    expect(within(prep).getByRole("link", { name: /Resource probs/ })).toBeInTheDocument();
    const recruiting = screen.getByRole("region", { name: portal.headings.recruiting });
    expect(within(recruiting).getByRole("link", { name: /Resource guide/ })).toBeInTheDocument();
  });

  it("shows announcements above the first section only when there are some", () => {
    const { unmount } = renderPortal(member, {
      announcements: [{ id: "a1", title: "Dues are due", body: "Pay at the next meeting. See [the FAQ](/apply#faq).", pinned: true }],
    });
    const strip = screen.getByRole("complementary", { name: "Announcements" });
    expect(within(strip).getByText("Dues are due")).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "the FAQ" })).toHaveAttribute("href", "/apply#faq");
    unmount();
    renderPortal(member);
    expect(screen.queryByRole("complementary", { name: "Announcements" })).not.toBeInTheDocument();
  });

  it("offers Request access to non-members only while requests are open", () => {
    const action = vi.fn();
    const { unmount } = renderPortal(visitor, { requestAction: action });
    expect(screen.queryByRole("button", { name: portal.requestAccess.button })).not.toBeInTheDocument();
    unmount();
    const second = renderPortal(member, { requestAction: action, settings: { acceptRequests: true } });
    expect(screen.queryByRole("button", { name: portal.requestAccess.button })).not.toBeInTheDocument();
    second.unmount();
    renderPortal(visitor, { requestAction: action, settings: { acceptRequests: true } });
    expect(screen.getByRole("button", { name: portal.requestAccess.button })).toBeInTheDocument();
    expect(screen.getByText(portal.requestAccess.prompt)).toBeInTheDocument();
  });

  it("shows a pending request's status instead of the form, and a declined one with the form again", () => {
    const props = { requestAction: vi.fn(), settings: { acceptRequests: true } };
    const { unmount } = renderPortal(visitor, { ...props, request: { status: "pending" } });
    expect(screen.getByRole("status")).toHaveTextContent(portal.requestAccess.pending);
    expect(screen.queryByRole("button", { name: portal.requestAccess.button })).not.toBeInTheDocument();
    unmount();
    renderPortal(visitor, { ...props, request: { status: "declined" } });
    expect(screen.getByText(portal.requestAccess.declined)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: portal.requestAccess.button })).toBeInTheDocument();
  });

  it("sends the note and shows the pending status once the request is in", async () => {
    const action = vi.fn(async () => ({ ok: true as const }));
    renderPortal(visitor, { requestAction: action, settings: { acceptRequests: true } });
    fireEvent.change(screen.getByLabelText(/Note for the officers/), { target: { value: "Trading, fall 2026" } });
    fireEvent.click(screen.getByRole("button", { name: portal.requestAccess.button }));
    expect(await screen.findByRole("status")).toHaveTextContent(portal.requestAccess.pending);
    expect(action).toHaveBeenCalledWith({ note: "Trading, fall 2026" });
  });

  it.each([
    ["requests-closed", "Requests aren't open right now."],
    ["already-pending", "You've already asked."],
    ["already-member", "You're already a member."],
  ] as const)("says why when a request is refused (%s)", async (reason, message) => {
    const action = vi.fn(async () => ({ ok: false as const, reason }));
    renderPortal(visitor, { requestAction: action, settings: { acceptRequests: true } });
    fireEvent.click(screen.getByRole("button", { name: portal.requestAccess.button }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("shows open-cycle dates and the Apply button while applications are open", () => {
    renderPortal(visitor, { timeline: { recruiting: open, events: [] } });
    const recruiting = screen.getByRole("region", { name: portal.headings.recruiting });
    expect(within(recruiting).getByText("Open now")).toBeInTheDocument();
    expect(within(recruiting).getByText("Due Jan 20")).toBeInTheDocument();
    expect(within(recruiting).getByRole("link", { name: /Apply/ })).toHaveAttribute("href", "https://forms.gle/apply");
  });

  it("points the closed-cycle fallback at /apply's FAQ when there's no interest form or email", () => {
    renderPortal(visitor, { timeline: { recruiting: { applicationsOpen: false, applyUrl: "" }, events: [] } });
    expect(screen.getByRole("link", { name: /Read the FAQ/ })).toHaveAttribute("href", "/apply#faq");
  });

  it("links interview prep to the games and to the tracks on this page, and the club section to the rest of the site", () => {
    renderPortal(visitor);
    const prep = screen.getByRole("region", { name: portal.headings.prep });
    expect(within(prep).getByRole("link", { name: /Play the games/ })).toHaveAttribute("href", "/membership#games");
    expect(within(prep).getByRole("link", { name: /See the tracks/ })).toHaveAttribute("href", "#tracks");
    expect(document.getElementById("tracks")).not.toBeNull();
    const club = screen.getByRole("navigation", { name: "More about the club" });
    expect(within(club).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/about", "/membership", "/team"]);
  });
});
