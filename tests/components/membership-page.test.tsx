import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MembershipPage } from "@/components/membership/MembershipPage";
import { membership } from "@/content/membership";

const renderPage = (content = membership, leadNames: Record<string, string> = {}) =>
  render(<MembershipPage membership={content} leadNames={leadNames} />);

const timeCommitment = { value: "About 3 hours a week", detail: "Sessions plus practice." };

describe("MembershipPage", () => {
  it("numbers the sections it renders and has one h1 and no navy band", () => {
    const { container } = renderPage();
    expect(screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent)).toEqual([
      "§ 01 — How it works",
      "§ 02 — Tracks",
      "§ 03 — What we do",
    ]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("section.bg-navy")).toHaveLength(0);
  });

  it("renders the three tracks in order with stable anchors and no 'required' wording inside them", () => {
    const { container } = renderPage();
    const articles = Array.from(container.querySelectorAll("article"));
    expect(articles.map((a) => a.id)).toEqual(["trading", "research", "development"]);
    articles.forEach((a) => expect(a.textContent).not.toMatch(/required|requirements/i));
    // The reassurance leads the section instead of trailing it as a caption.
    const region = screen.getByRole("region", { name: "Pick the role you're preparing for." });
    expect(within(region).getByText(/none of it is required to join/)).toBeInTheDocument();
  });

  it("shows a track's good-fit line and sample problem only when set", () => {
    const tracks = membership.tracks.map((t, i) =>
      i === 0 ? { ...t, goodFit: "like speed.", sampleProblem: "Quote two dice." } : { ...t, goodFit: undefined, sampleProblem: undefined },
    );
    const { container } = renderPage({ ...membership, tracks });
    const [trading, research] = Array.from(container.querySelectorAll("article"));
    expect(trading).toHaveTextContent("Good fit if you like speed.");
    expect(within(trading).getByText("Sample problem")).toBeInTheDocument();
    expect(research).not.toHaveTextContent(/Good fit|Sample problem/);
  });

  it("links a track lead to their Team card when the slug resolves", () => {
    const tracks = membership.tracks.map((t, i) => (i === 1 ? { ...t, leadSlug: "jane-doe" } : t));
    renderPage({ ...membership, tracks }, { "jane-doe": "Jane Doe" });
    expect(screen.getByRole("link", { name: "Led by Jane Doe" })).toHaveAttribute("href", "/team#jane-doe");
  });

  it("drops the Frequency and Tracks columns when they carry no information", () => {
    renderPage({ ...membership, activities: membership.activities.map((a) => ({ ...a, frequency: undefined, tracks: "all" as const })) });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Activity", "Description"]);
    expect(within(table).queryByText("All tracks")).not.toBeInTheDocument();
    expect(screen.getByText("Every activity is open to members of all three tracks.")).toBeInTheDocument();
  });

  it("shows Frequency and Tracks columns once any activity sets them", () => {
    const activities = membership.activities.map((a, i) => (i === 0 ? { ...a, frequency: "Weekly", tracks: ["trading" as const] } : a));
    renderPage({ ...membership, activities });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Activity",
      "Description",
      "Frequency",
      "Tracks",
    ]);
    expect(within(table).getAllByRole("row")).toHaveLength(1 + membership.activities.length);
    expect(within(table).getByText("Weekly")).toBeInTheDocument();
    expect(screen.queryByText("Every activity is open to members of all three tracks.")).not.toBeInTheDocument();
  });

  it("adds Expectations before Activities once two or more rows are answered", () => {
    renderPage({ ...membership, expectations: { ...membership.expectations, timeCommitment } });
    expect(screen.getAllByText(/^§ \d{2} — /).map((el) => el.textContent)).toEqual([
      "§ 01 — How it works",
      "§ 02 — Tracks",
      "§ 03 — Expectations",
      "§ 04 — What we do",
    ]);
    const dl = screen.getByRole("region", { name: "What we ask of members." }).querySelector("dl") as HTMLElement;
    expect(Array.from(dl.querySelectorAll("dt")).map((dt) => dt.textContent)).toEqual(["Time commitment", "Prerequisites"]);
    expect(screen.queryByText(/switch tracks/)).not.toBeInTheDocument();
  });

  it("shows a decorative order-book depth chart in the header instead of a random walk", () => {
    const { container } = renderPage();
    const art = container.querySelector("header svg") as SVGElement;
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art.closest(".depth-chart")).toHaveAttribute("aria-hidden", "true");
    // Bid and ask curves over their fills and a 14-level ladder each side of a dashed mid.
    expect(art.querySelectorAll('[data-layer="curves"] path')).toHaveLength(2);
    expect(art.querySelectorAll('[data-layer="fills"] path')).toHaveLength(2);
    expect(art.querySelectorAll('[data-layer="bars"] rect')).toHaveLength(28);
    expect(art.querySelectorAll('[data-layer="mid"]')).toHaveLength(1);
  });
});
