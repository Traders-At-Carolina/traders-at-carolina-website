import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { StatRow } from "@/components/Stat";
import { TextLink } from "@/components/TextLink";

describe("Button", () => {
  it("renders an internal link without target or arrow", () => {
    render(<Button href="/membership">How membership works</Button>);
    const link = screen.getByRole("link", { name: "How membership works" });
    expect(link).toHaveAttribute("href", "/membership");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens external links in a new tab with a hidden ↗", () => {
    render(
      <Button href="https://forms.gle/x" external>
        Apply
      </Button>,
    );
    const link = screen.getByRole("link", { name: /^Apply/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent("↗");
  });
});

describe("TextLink", () => {
  it("uses → for internal and ↗ for external arrows", () => {
    render(
      <>
        <TextLink href="/about" arrow>
          About
        </TextLink>
        <TextLink href="https://example.org" external arrow>
          Site
        </TextLink>
      </>,
    );
    expect(screen.getByRole("link", { name: /About/ })).toHaveTextContent("About →");
    expect(screen.getByRole("link", { name: /Site/ })).toHaveTextContent("Site ↗");
  });
});

describe("Eyebrow", () => {
  it("formats a numbered section label", () => {
    render(<Eyebrow index={3}>Tracks</Eyebrow>);
    expect(screen.getByText("§ 03 — Tracks")).toBeInTheDocument();
  });

  it("omits the number when no index is given", () => {
    render(<Eyebrow>About</Eyebrow>);
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});

describe("StatRow", () => {
  it("drops stats without a value", () => {
    render(
      <StatRow
        stats={[
          { value: "120+", label: "Active members" },
          { value: undefined, label: "Founded" },
          { value: "8", label: "Partner firms" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.queryByText("Founded")).not.toBeInTheDocument();
  });

  it("renders nothing when no stat has a value", () => {
    const { container } = render(<StatRow stats={[{ label: "Founded" }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
