import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplyButton } from "@/components/ApplyButton";
import { Button } from "@/components/Button";
import { PersonCard } from "@/components/PersonCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { TextLink } from "@/components/TextLink";
import { PartnersAdvisors } from "@/components/about/PartnersAdvisors";
import { primaryNav } from "@/content/nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const cta = (el: HTMLElement) => el.getAttribute("data-ph-capture-attribute-cta");
const placement = (el: HTMLElement) => el.getAttribute("data-ph-capture-attribute-placement");
const target = (el: HTMLElement) => el.getAttribute("data-ph-capture-attribute-target");

describe("tracked links", () => {
  it("Button and TextLink carry tracking attributes on internal and external links", () => {
    render(
      <>
        <Button href="/apply" track={{ cta: "apply", placement: "hero" }}>
          Internal
        </Button>
        <TextLink href="https://example.com" external track={{ cta: "sponsor", target: "Example" }}>
          External
        </TextLink>
      </>,
    );
    const internal = screen.getByRole("link", { name: "Internal" });
    expect([cta(internal), placement(internal)]).toEqual(["apply", "hero"]);
    const external = screen.getByRole("link", { name: /External/ });
    expect([cta(external), target(external)]).toEqual(["sponsor", "Example"]);
  });

  it("leaves untracked links free of tracking attributes", () => {
    render(<Button href="/about">Plain</Button>);
    expect(cta(screen.getByRole("link", { name: "Plain" }))).toBeNull();
  });

  it("ApplyButton names its placement", () => {
    render(<ApplyButton placement="band" recruiting={{ applicationsOpen: false, applyUrl: "" }} />);
    const link = screen.getByRole("link", { name: "Apply" });
    expect([cta(link), placement(link)]).toEqual(["apply", "band"]);
  });

  it("tags a person's LinkedIn link with their slug", () => {
    render(<PersonCard person={{ slug: "ada", name: "Ada", role: "President", group: "exec", order: 1, linkedin: "https://linkedin.com/in/ada" }} />);
    const link = screen.getByRole("link", { name: "Ada on LinkedIn" });
    expect([cta(link), target(link)]).toEqual(["linkedin", "ada"]);
  });

  it("tags sponsor links with the sponsor's name", () => {
    render(
      <PartnersAdvisors index={4} headings={{ mission: "M", story: "S", principles: "P", partners: "Partners", advisorsOnly: "Advisors" }} partners={[{ name: "Citadel", url: "https://citadel.com" }]} advisors={[]} />,
    );
    const link = screen.getByRole("link", { name: /Citadel/ });
    expect([cta(link), target(link)]).toEqual(["sponsor", "Citadel"]);
  });

  it("tags the header's Apply button and nav links", () => {
    render(<SiteHeaderClient links={primaryNav} applyHref="/apply" applyExternal={false} />);
    const applies = screen.getAllByRole("link", { name: "Apply" });
    expect(applies.map(placement)).toContain("header");
    expect(applies.every((el) => cta(el) === "apply")).toBe(true);
    const about = screen.getAllByRole("link", { name: "About" })[0];
    expect([cta(about), target(about), placement(about)]).toEqual(["nav", "About", "header"]);
  });

  it("tags footer links and says analytics are privacy-respecting", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    const about = screen.getByRole("link", { name: "About" });
    expect([cta(about), placement(about)]).toEqual(["nav", "footer"]);
    const apply = screen.getByRole("link", { name: /Apply/ });
    expect([cta(apply), placement(apply)]).toEqual(["apply", "footer"]);
    expect(footer).toHaveTextContent(/anonymous, cookie-free analytics/i);
  });
});
