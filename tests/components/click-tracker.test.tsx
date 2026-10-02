import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

const { ClickTracker } = await import("@/components/ClickTracker");

afterEach(() => track.mockClear());

describe("ClickTracker", () => {
  it("reports conversion clicks with their location and ignores other links", () => {
    const { container } = render(
      <div>
        <ClickTracker applyUrl="https://forms.gle/apply" interestFormUrl="https://forms.gle/notify" />
        <div data-track-location="apply-header">
          <a href="https://forms.gle/notify">
            <span>Get notified</span>
          </a>
        </div>
        <a href="/membership">Membership</a>
      </div>,
    );
    fireEvent.click(container.querySelector("span")!);
    fireEvent.click(container.querySelector('a[href="/membership"]')!);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("notify_click", { location: "apply-header", page: "/" });
  });
});
