import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const { formatDuration, formatUpdated } = await import("@/components/admin/analytics/format");
const { Sparkline, linePoints } = await import("@/components/admin/analytics/Sparkline");
const { TrendChart, niceMax } = await import("@/components/admin/analytics/TrendChart");
const { NotConnectedBanner, SectionNotice } = await import("@/components/admin/analytics/sections");

describe("analytics formatting", () => {
  it("formats durations and freshness", () => {
    expect(formatDuration(42)).toBe("42s");
    expect(formatDuration(134)).toBe("2m 14s");
    expect(formatDuration(3700)).toBe("1h 1m");
    expect(formatUpdated(1_000_000, 1_000_000 + 30_000)).toBe("Updated just now");
    expect(formatUpdated(1_000_000, 1_000_000 + 4 * 60_000)).toBe("Updated 4 min ago");
  });

  it("picks a tidy axis maximum", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(43)).toBe(50);
    expect(niceMax(180)).toBe(200);
  });
});

describe("Sparkline", () => {
  it("draws a line, and nothing for fewer than two points", () => {
    expect(linePoints([0, 5, 10], 100, 20)).toBe("0,20 50,10 100,0");
    const { container, rerender } = render(<Sparkline values={[1, 3, 2]} />);
    expect(container.querySelector("polyline")).toBeInTheDocument();
    rerender(<Sparkline values={[1]} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("TrendChart", () => {
  it("draws both series and lists every day in a details table", () => {
    const points = [
      { day: "2026-10-02", visitors: 4, pageviews: 9 },
      { day: "2026-10-03", visitors: 0, pageviews: 0 },
      { day: "2026-10-04", visitors: 6, pageviews: 14 },
    ];
    const { container } = render(<TrendChart points={points} />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    expect(screen.getByRole("img", { name: /daily visitors and pageviews, Oct 2 to Oct 4/i })).toBeInTheDocument();
    expect(container.querySelector("details summary")).toHaveTextContent("Show the data");
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });
});

describe("analytics notices", () => {
  it("explains which env vars to add when not connected", () => {
    render(<NotConnectedBanner />);
    expect(screen.getByText("Analytics isn't connected yet")).toBeInTheDocument();
    expect(screen.getByText("POSTHOG_PERSONAL_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("POSTHOG_PROJECT_ID")).toBeInTheDocument();
  });

  it("says a section couldn't load when PostHog fails", () => {
    render(<SectionNotice failure={{ ok: false, reason: "error", message: "PostHog answered 500." }} />);
    expect(screen.getByText("Couldn't load this from PostHog")).toBeInTheDocument();
    expect(screen.getByText("PostHog answered 500.")).toBeInTheDocument();
  });
});
