import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { primaryNav } from "@/content/nav";
import type { CompanyMark, Recruiting, Site } from "@/content/types";

const pathname = vi.hoisted(() => ({ current: "/about" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const now = new Date("2027-01-05T17:00:00Z");
const logo = { src: "/x.png", width: 96, height: 96 } as StaticImageData;
const marks: CompanyMark[] = ["Citadel", "AWS"].map((name) => ({ name, logo }));
const form = "https://forms.gle/interest";

const settings = (recruiting: Partial<Recruiting> = {}, rest: Partial<Site> = {}): Site => ({
  name: "Traders at Carolina",
  url: "http://localhost:3000",
  mission: "The mission line.",
  social: {},
  recruiting: { applicationsOpen: false, applyUrl: "", ...recruiting },
  ...rest,
});
const renderFooter = (site: Site = settings(), wall: CompanyMark[] = []) => render(<SiteFooter settings={site} wall={wall} now={now} />);
const zone = (container: HTMLElement) => container.querySelector("[data-cta-band]") as HTMLElement;

afterEach(() => {
  pathname.current = "/about";
  vi.useRealTimers();
});

describe("SiteFooter CTA zone", () => {
  it("says we're between cycles, plainly says applications aren't open, and sends Keep me posted to the interest form", () => {
    const { container } = renderFooter(settings({ interestFormUrl: form }));
    const band = zone(container);
    expect(within(band).getByRole("heading", { name: "We're between cycles." })).toBeInTheDocument();
    expect(within(band).getByText(/^Applications aren't open right now\./)).toBeInTheDocument();
    expect(within(band).getByRole("link", { name: /^Keep me posted/ })).toHaveAttribute("href", form);
  });

  it("offers See how it works when closed without an interest form", () => {
    const { container } = renderFooter();
    expect(within(zone(container)).getByRole("link", { name: /^See how it works/ })).toHaveAttribute("href", "/apply");
    expect(within(zone(container)).queryByRole("link", { name: /Keep me posted/ })).not.toBeInTheDocument();
  });

  it("invites visitors to apply when applications are open, with the deadline", () => {
    const open = settings({ applicationsOpen: true, applyUrl: "https://forms.gle/apply", applyDeadline: "2027-01-20T23:59" });
    const { container } = renderFooter(open);
    const band = zone(container);
    expect(within(band).getByRole("heading", { name: "Ready to start?" })).toBeInTheDocument();
    expect(within(band).getByText("Applications close Wed, Jan 20.")).toBeInTheDocument();
    const apply = within(band).getByRole("link", { name: /^Apply/ });
    expect(apply).toHaveAttribute("href", "https://forms.gle/apply");
    expect(apply).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("flips from open to closed in the browser once the deadline passes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const withDeadline = settings({ applicationsOpen: true, applyUrl: "https://forms.gle/apply", applyDeadline: "2027-01-05T13:00", interestFormUrl: form });
    const { container } = renderFooter(withDeadline);
    expect(within(zone(container)).getByRole("heading", { name: "Ready to start?" })).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    });
    expect(within(zone(container)).getByRole("heading", { name: "We're between cycles." })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Join" })).getByRole("link", { name: /^Apply/ })).toHaveAttribute("href", "/apply");
  });

  it("is the page's only navy band, and is left out on /apply", () => {
    const first = renderFooter();
    expect(first.container.querySelectorAll("section.bg-navy")).toHaveLength(1);
    first.unmount();

    pathname.current = "/apply";
    const second = renderFooter();
    expect(second.container.querySelectorAll("section.bg-navy")).toHaveLength(0);
    expect(second.container.querySelector("footer")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Join" })).toBeInTheDocument();
  });
});

describe("SiteFooter link grid", () => {
  it("shows the brand, the mission and the header's nav links under Club", () => {
    renderFooter();
    expect(screen.getByText("The mission line.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Traders at Carolina, home" })).toHaveAttribute("href", "/");
    const club = screen.getByRole("navigation", { name: "Footer" });
    expect(within(club).getByRole("heading", { name: "Club" })).toBeInTheDocument();
    expect(within(club).getAllByRole("link").map((a) => a.textContent)).toEqual(primaryNav.map((l) => l.label));
  });

  it("puts a state-aware Apply link under Join, and Keep me posted only with an interest form", () => {
    const closedNoForm = renderFooter();
    const join = screen.getByRole("list", { name: "Join" });
    expect(within(join).getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/apply");
    expect(within(join).queryByRole("link", { name: /Keep me posted/ })).not.toBeInTheDocument();
    closedNoForm.unmount();

    renderFooter(settings({ applicationsOpen: true, applyUrl: "https://forms.gle/apply", interestFormUrl: form }));
    const openJoin = screen.getByRole("list", { name: "Join" });
    expect(within(openJoin).getByRole("link", { name: /^Apply/ })).toHaveAttribute("href", "https://forms.gle/apply");
    expect(within(openJoin).getByRole("link", { name: /^Keep me posted/ })).toHaveAttribute("href", form);
  });

  it("omits the whole Reach column until a contact value exists", () => {
    renderFooter();
    expect(screen.queryByRole("heading", { name: "Reach" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Reach" })).not.toBeInTheDocument();
  });

  it("shows only the Reach rows that have values", () => {
    renderFooter(settings({}, { contactEmail: "hi@club.org", social: { linkedin: "https://www.linkedin.com/company/tac" } }));
    const reach = screen.getByRole("list", { name: "Reach" });
    const links = within(reach).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "mailto:hi@club.org");
    expect(links[1]).toHaveAttribute("href", "https://www.linkedin.com/company/tac");
    expect(links[1]).toHaveAttribute("target", "_blank");
    expect(within(reach).queryByRole("link", { name: /Instagram/ })).not.toBeInTheDocument();
  });
});

describe("SiteFooter placement strip", () => {
  it("shows the firms when there are some", () => {
    renderFooter(settings(), marks);
    expect(screen.getByText("Where we've worked")).toBeInTheDocument();
    expect(screen.getAllByText("Citadel").length).toBeGreaterThan(0);
  });

  it("is hidden with no firms", () => {
    renderFooter(settings(), []);
    expect(screen.queryByText("Where we've worked")).not.toBeInTheDocument();
  });

  it("is hidden on /team, where the header already shows the firms", () => {
    pathname.current = "/team";
    renderFooter(settings(), marks);
    expect(screen.queryByText("Where we've worked")).not.toBeInTheDocument();
  });
});

describe("SiteFooter legal row", () => {
  it("shows the copyright, and the disclaimer only when set", () => {
    const plain = renderFooter();
    expect(screen.getByText("© 2027 Traders at Carolina")).toBeInTheDocument();
    expect(screen.queryByText("Not an official UNC organization.")).not.toBeInTheDocument();
    plain.unmount();

    renderFooter(settings({}, { disclaimer: "Not an official UNC organization." }));
    expect(screen.getByText("Not an official UNC organization.")).toBeInTheDocument();
  });
});
