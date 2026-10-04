import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

const path = vi.hoisted(() => ({ current: "/admin/photos" }));
vi.mock("next/navigation", () => ({ usePathname: () => path.current, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => <span data-testid="user-button" /> }));

import { AdminSubNav, AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatusPill } from "@/components/admin/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { Field, Input } from "@/components/admin/ui/Field";
import { Menu } from "@/components/admin/ui/Menu";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Switch } from "@/components/admin/ui/Switch";
import { Tabs } from "@/components/admin/ui/Tabs";
import { ADMIN_SECTIONS, ALL_SCREEN_HREFS, screenFor, sectionFor } from "@/lib/admin/nav";

/** Top-level screen folders under app/admin/(console), as /admin/<name>. */
function consoleScreens(): string[] {
  const root = join(process.cwd(), "app/admin/(console)");
  return readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .map((name) => `/admin/${name}`);
}

describe("admin nav map", () => {
  it("lists every console screen, so none can be orphaned (spec 11 §8)", () => {
    for (const href of consoleScreens()) expect(ALL_SCREEN_HREFS).toContain(href);
  });

  it("finds the section and screen for nested paths", () => {
    expect(sectionFor("/admin/events/123").label).toBe("Website");
    expect(screenFor("/admin/events/123")?.label).toBe("Events");
    expect(sectionFor("/admin").id).toBe("overview");
    expect(sectionFor("/admin/nowhere").id).toBe("overview");
  });

  it("doesn't match one screen's prefix to another", () => {
    expect(screenFor("/admin/photosx")).toBeUndefined();
  });

  it("hides screens from unshipped phases, and sections left empty", () => {
    const labels = ADMIN_SECTIONS.flatMap((s) => s.screens.map((x) => x.label));
    expect(labels).not.toContain("Analytics");
    expect(ADMIN_SECTIONS.map((s) => s.label)).toEqual(["Overview", "Club", "Website", "Insights"]);
  });
});

describe("AdminTopBar", () => {
  it("marks the active section", () => {
    path.current = "/admin/photos/abc";
    render(<AdminTopBar />);
    const sections = screen.getByRole("navigation", { name: "Sections" });
    expect(within(sections).getByRole("link", { name: "Website" })).toHaveAttribute("aria-current", "page");
    expect(within(sections).getByRole("link", { name: "Club" })).not.toHaveAttribute("aria-current");
    expect(within(sections).getByRole("link", { name: "Club" })).toHaveAttribute("href", "/admin/members");
  });

  it("opens a menu listing every screen", () => {
    path.current = "/admin/members";
    render(<AdminTopBar />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const all = screen.getByRole("navigation", { name: "All screens" });
    expect(within(all).getByRole("link", { name: "History" })).toBeInTheDocument();
    expect(within(all).getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page");
  });
});

describe("AdminSubNav", () => {
  it("lists the active section's screens and marks the current one", () => {
    path.current = "/admin/officers/new";
    render(<AdminSubNav />);
    const nav = screen.getByRole("navigation", { name: "Club screens" });
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["Members", "Officers", "Admins"]);
    expect(within(nav).getByRole("link", { name: "Officers" })).toHaveAttribute("aria-current", "page");
  });

  it("is hidden on Overview", () => {
    path.current = "/admin";
    const { container } = render(<AdminSubNav />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PageHeader", () => {
  it("shows the breadcrumb and View on site from the nav map", () => {
    path.current = "/admin/officers/jane";
    render(<PageHeader title="Jane Doe" crumb="Jane Doe" />);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Officers" })).toHaveAttribute("href", "/admin/officers");
    expect(screen.getByRole("link", { name: /View on site/ })).toHaveAttribute("href", "/team");
  });

  it("hides View on site when asked", () => {
    path.current = "/admin/officers";
    render(<PageHeader title="Officers" siteHref={false} />);
    expect(screen.queryByRole("link", { name: /View on site/ })).not.toBeInTheDocument();
  });
});

describe("Switch", () => {
  it("posts 'on' only while on, like a checkbox", () => {
    const { container } = render(<Switch name="pinned" label="Pinned" />);
    const toggle = screen.getByRole("switch", { name: "Pinned" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(container.querySelector("input[name=pinned]")).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(container.querySelector("input[name=pinned]")).toHaveValue("on");
  });
});

describe("Field", () => {
  it("labels the control and wires its error", () => {
    render(
      <Field label="Title" error="Required">
        <Input name="title" />
      </Field>,
    );
    const input = screen.getByLabelText("Title");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Required");
  });
});

describe("Tabs", () => {
  it("marks the current tab and shows counts", () => {
    render(
      <Tabs
        label="Members"
        tabs={[
          { href: "?tab=roster", label: "Roster", count: 40, current: true },
          { href: "?tab=requests", label: "Requests", count: 2, current: false },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Roster/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Requests/ })).toHaveTextContent("2");
  });
});

describe("Menu", () => {
  it("opens, moves with the arrow keys and runs the chosen item", () => {
    const remove = vi.fn();
    render(<Menu label="Actions for Jane" items={[{ label: "Edit", href: "/admin/officers/jane" }, { label: "Delete", onSelect: remove, danger: true }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Jane" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.click(items[1]);
    expect(remove).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<Menu label="Actions" items={[{ label: "Edit", href: "/x" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.keyDown(screen.getByRole("menuitem"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("says what happens and confirms or cancels", () => {
    const confirm = vi.fn();
    const close = vi.fn();
    render(<ConfirmDialog open onClose={close} onConfirm={confirm} title="Delete this score?" description="Its contact is deleted too." />);
    expect(screen.getByText("Its contact is deleted too.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(close).toHaveBeenCalled();
  });
});

describe("StatusPill", () => {
  it("always carries a word, not just a colour", () => {
    render(<StatusPill status="scheduled" />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });
});
