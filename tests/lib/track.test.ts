import { describe, expect, it } from "vitest";
import { clickLocation, conversionEvent } from "@/lib/track";

const urls = { applyUrl: "https://forms.gle/apply", interestFormUrl: "https://forms.gle/notify" };

describe("conversionEvent", () => {
  it("classifies form and /apply links", () => {
    expect(conversionEvent("https://forms.gle/apply", urls)).toBe("apply_click");
    expect(conversionEvent("https://forms.gle/notify", urls)).toBe("notify_click");
    expect(conversionEvent("/apply", urls)).toBe("apply_page_click");
    expect(conversionEvent("/membership", urls)).toBeUndefined();
  });

  it("never matches an empty apply URL", () => {
    expect(conversionEvent("", { applyUrl: "" })).toBeUndefined();
  });
});

describe("clickLocation", () => {
  it("prefers an explicit tag, then the landmark", () => {
    document.body.innerHTML = `
      <header><a id="h" href="/apply">Apply</a></header>
      <section data-cta-band><a id="b" href="/apply">Apply</a></section>
      <div data-track-location="apply-header"><a id="t" href="/apply">Apply</a></div>
      <a id="p" href="/apply">Apply</a>`;
    const at = (id: string) => clickLocation(document.getElementById(id)!);
    expect([at("h"), at("b"), at("t"), at("p")]).toEqual(["site-header", "band", "apply-header", "page"]);
  });
});
