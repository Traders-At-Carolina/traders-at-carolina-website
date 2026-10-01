import { describe, expect, it } from "vitest";
import { validateSite } from "@/lib/validate-site";
import type { Site } from "@/content/types";

const valid: Site = {
  name: "Traders at Carolina",
  url: "https://example.org",
  mission: "Preparing UNC students for quantitative careers.",
  social: {},
  recruiting: { applicationsOpen: false, applyUrl: "" },
};

describe("validateSite", () => {
  it("accepts a valid closed configuration", () => {
    expect(() => validateSite(valid)).not.toThrow();
  });

  it("accepts an open configuration with a Google Forms URL", () => {
    const site = { ...valid, recruiting: { applicationsOpen: true, applyUrl: "https://docs.google.com/forms/d/e/abc/viewform" } };
    expect(() => validateSite(site)).not.toThrow();
  });

  it("rejects an open configuration without a valid Google Forms URL", () => {
    expect(() => validateSite({ ...valid, recruiting: { applicationsOpen: true, applyUrl: "" } })).toThrow(/applyUrl/);
    expect(() =>
      validateSite({ ...valid, recruiting: { applicationsOpen: true, applyUrl: "https://example.com/form" } }),
    ).toThrow(/applyUrl/);
  });

  it("rejects malformed dates and inverted interview windows, listing every problem", () => {
    const site: Site = {
      ...valid,
      recruiting: {
        ...valid.recruiting,
        applyDeadline: "Feb 6",
        interviewWindow: { start: "2027-02-14", end: "2027-02-10" },
      },
    };
    expect(() => validateSite(site)).toThrow(/applyDeadline[\s\S]*interviewWindow/);
  });

  it("rejects a non-https interest form URL", () => {
    const site = { ...valid, recruiting: { ...valid.recruiting, interestFormUrl: "http://forms.gle/x" } };
    expect(() => validateSite(site)).toThrow(/interestFormUrl/);
  });
});
