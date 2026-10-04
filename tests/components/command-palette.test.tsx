import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const path = vi.hoisted(() => ({ current: "/admin/photos" }));
const push = vi.hoisted(() => vi.fn());
const searchAdmin = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => path.current, useRouter: () => ({ push }) }));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => <span data-testid="user-button" /> }));
vi.mock("@/lib/admin/search", () => ({ searchAdmin }));

import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { RECENT_KEY } from "@/lib/admin/palette";

const openWithKeys = () => fireEvent.keyDown(window, { key: "k", ctrlKey: true });
const input = () => screen.getByRole("combobox");
const options = () => screen.getAllByRole("option");
const group = (name: string) => screen.getByRole("group", { name });

beforeEach(() => {
  path.current = "/admin/photos";
  push.mockReset();
  searchAdmin.mockReset();
  searchAdmin.mockResolvedValue([]);
  sessionStorage.clear();
});

describe("CommandPalette", () => {
  it("opens on Ctrl+K and focuses the search input", () => {
    render(<AdminTopBar />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    openWithKeys();
    expect(input()).toHaveFocus();
    expect(input()).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
  });

  it("opens from the top-bar search button and returns focus to it on Escape", () => {
    render(<AdminTopBar />);
    const button = screen.getByRole("button", { name: "Search" });
    button.focus();
    fireEvent.click(button);
    expect(input()).toHaveFocus();
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("lists recent screens, then every screen, before typing", () => {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(["/admin/events", "/admin/photos", "/admin/nowhere"]));
    render(<AdminTopBar />);
    openWithKeys();
    // The current screen and unknown hrefs are left out of Recent.
    expect(within(group("Recent")).getAllByRole("option").map((o) => o.textContent)).toEqual([expect.stringContaining("Events")]);
    const screens = within(group("Screens")).getAllByRole("option");
    expect(screens[0]).toHaveTextContent("Overview");
    expect(screens.map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Members"), expect.stringContaining("History")]));
    expect(screen.queryByRole("group", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("records the current screen as recent", () => {
    path.current = "/admin/sponsors/123";
    render(<AdminTopBar />);
    expect(JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? "[]")).toEqual(["/admin/sponsors"]);
  });

  it("filters screens and actions as you type", () => {
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "spons" } });
    expect(within(group("Screens")).getAllByRole("option")).toHaveLength(1);
    expect(within(group("Screens")).getByRole("option")).toHaveTextContent("Sponsors");
    expect(within(group("Actions")).getByRole("option")).toHaveTextContent("New sponsor");
  });

  it("moves with the arrow keys (wrapping) and opens with Enter", () => {
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "event" } });
    // Screens: Events; Actions: New event.
    expect(options()[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input()).toHaveAttribute("aria-activedescendant", options()[1].id);
    expect(options()[1]).toHaveTextContent("New event");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/admin/events/new");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("wraps from the first option to the last with ArrowUp", () => {
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "event" } });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(options()[options().length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("opens in a new tab with Ctrl+Enter", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "history" } });
    fireEvent.keyDown(input(), { key: "Enter", ctrlKey: true });
    expect(open).toHaveBeenCalledWith("/admin/history", "_blank", "noopener,noreferrer");
    expect(push).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("opens an option on click", () => {
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.click(within(group("Screens")).getByRole("option", { name: /^Members/ }));
    expect(push).toHaveBeenCalledWith("/admin/members");
  });

  it("shows records from searchAdmin after the debounce, ignoring 1-character queries", async () => {
    vi.useFakeTimers();
    try {
      searchAdmin.mockResolvedValue([{ kind: "member", id: "m1", label: "Jane Doe", sub: "jane@unc.edu", href: "/admin/members/m1" }]);
      render(<AdminTopBar />);
      openWithKeys();
      fireEvent.change(input(), { target: { value: "j" } });
      await act(() => vi.advanceTimersByTimeAsync(300));
      expect(searchAdmin).not.toHaveBeenCalled();

      fireEvent.change(input(), { target: { value: "ja" } });
      fireEvent.change(input(), { target: { value: "jan" } });
      expect(screen.getByText("Searching…")).toBeInTheDocument();
      await act(() => vi.advanceTimersByTimeAsync(250));
      expect(searchAdmin).toHaveBeenCalledTimes(1);
      expect(searchAdmin).toHaveBeenCalledWith("jan");
    } finally {
      vi.useRealTimers();
    }
    const record = await within(group("Records")).findByRole("option");
    expect(record).toHaveTextContent("Jane Doe");
    expect(record).toHaveTextContent("jane@unc.edu");
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();
    fireEvent.click(record);
    expect(push).toHaveBeenCalledWith("/admin/members/m1");
  });

  it("drops a stale response that lands after a newer query", async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    searchAdmin.mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)));
    searchAdmin.mockResolvedValueOnce([{ kind: "sponsor", id: "s1", label: "Citadel", href: "/admin/sponsors/s1" }]);
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "cit" } });
    await waitFor(() => expect(searchAdmin).toHaveBeenCalledTimes(1));
    fireEvent.change(input(), { target: { value: "cita" } });
    await waitFor(() => expect(within(group("Records")).getByRole("option")).toHaveTextContent("Citadel"));
    await act(async () => resolveFirst([{ kind: "sponsor", id: "old", label: "Old result", href: "/admin/sponsors/old" }]));
    expect(screen.queryByText("Old result")).not.toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    render(<AdminTopBar />);
    openWithKeys();
    fireEvent.change(input(), { target: { value: "zzzzqq" } });
    expect(await screen.findByText(/No results/)).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape", () => {
    render(<AdminTopBar />);
    openWithKeys();
    expect(input()).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
