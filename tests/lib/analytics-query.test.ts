import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: (fn: unknown) => fn }));

const {
  apiHostFor,
  channelFor,
  getApplyClicks,
  getLiveNow,
  getSummary,
  getTopPages,
  getTopReferrers,
  getTrend,
  hogString,
  parseRange,
  posthogEnv,
  posthogProjectUrl,
  productionHost,
  QUERIES,
  toTrend,
} = await import("@/lib/analytics/query");

const ENV = { POSTHOG_PERSONAL_API_KEY: "phx_test", POSTHOG_PROJECT_ID: "12345", NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com" };
const KEYS = ["POSTHOG_PERSONAL_API_KEY", "POSTHOG_PROJECT_ID", "NEXT_PUBLIC_POSTHOG_HOST", "POSTHOG_API_HOST"] as const;

const fetchMock = vi.fn();

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
}

beforeEach(() => {
  for (const k of KEYS) vi.stubEnv(k, "");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const configure = () => Object.entries(ENV).forEach(([k, v]) => vi.stubEnv(k, v));

describe("parseRange", () => {
  it("allows only 7, 30 and 90, defaulting to 7", () => {
    expect(parseRange("30")).toBe(30);
    expect(parseRange("90")).toBe(90);
    expect(parseRange(["30", "90"])).toBe(30);
    for (const bad of [undefined, "", "14", "abc", "7.5", "-7", "1e3"]) expect(parseRange(bad)).toBe(7);
  });
});

describe("configuration", () => {
  it("is null without both the personal key and the project id", () => {
    expect(posthogEnv(env({ POSTHOG_PROJECT_ID: "1" }))).toBeNull();
    expect(posthogEnv(env({ POSTHOG_PERSONAL_API_KEY: "phx" }))).toBeNull();
    expect(posthogEnv(env({ ...ENV }))).toEqual({ apiKey: "phx_test", projectId: "12345", apiHost: "https://us.posthog.com" });
  });

  it("derives the app host from the ingestion host, or takes an override", () => {
    expect(apiHostFor(env({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" }))).toBe("https://eu.posthog.com");
    expect(apiHostFor(env({}))).toBe("https://us.posthog.com");
    expect(apiHostFor(env({ POSTHOG_API_HOST: "https://ph.example.com/" }))).toBe("https://ph.example.com");
  });

  it("links to the project in PostHog only when the project id is known", () => {
    expect(posthogProjectUrl(env({ POSTHOG_PROJECT_ID: "12345" }))).toBe("https://us.posthog.com/project/12345/web");
    expect(posthogProjectUrl(env({}))).toBeNull();
  });

  it("returns not-configured without calling PostHog", async () => {
    expect(await getLiveNow()).toEqual({ ok: false, reason: "not-configured" });
    expect(await getSummary(7)).toEqual({ ok: false, reason: "not-configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the request", () => {
  it("POSTs a HogQL query to the project's query endpoint with the personal key", async () => {
    configure();
    respond({ results: [[3]] });
    expect(await getLiveNow()).toMatchObject({ ok: true, data: 3 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://us.posthog.com/api/projects/12345/query/");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer phx_test", "Content-Type": "application/json" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init.body));
    expect(body.query).toEqual({ kind: "HogQLQuery", query: QUERIES.live() });
    expect(body.query.query).toContain("INTERVAL 5 MINUTE");
  });

  it("asks for the selected range", () => {
    expect(QUERIES.summary(30)).toContain("INTERVAL 29 DAY");
    expect(QUERIES.trend(90)).toContain("INTERVAL 89 DAY");
  });
});

describe("mapping results", () => {
  beforeEach(configure);

  it("maps the summary row", async () => {
    respond({ results: [[120, 480, 150, 95.4, 0.42]] });
    expect(await getSummary(7)).toMatchObject({ ok: true, data: { visitors: 120, pageviews: 480, sessions: 150, avgSessionSeconds: 95.4, bounceRate: 0.42 } });
  });

  it("maps top pages, keeping a missing time on page as null", async () => {
    respond({ results: [["/", 300, 200, 41.5], ["/apply", 90, 70, null]] });
    const result = await getTopPages(7);
    expect(result).toMatchObject({
      ok: true,
      data: [
        { path: "/", views: 300, visitors: 200, medianSeconds: 41.5 },
        { path: "/apply", views: 90, visitors: 70, medianSeconds: null },
      ],
    });
  });

  it("labels referrers with a channel", async () => {
    respond({ results: [["$direct", 50], ["www.google.com", 20], ["www.linkedin.com", 9], ["unc.edu", 4]] });
    const result = await getTopReferrers(30);
    expect(result.ok && result.data).toEqual([
      { domain: "Direct", channel: "Direct", visitors: 50 },
      { domain: "www.google.com", channel: "Search", visitors: 20 },
      { domain: "www.linkedin.com", channel: "Social", visitors: 9 },
      { domain: "unc.edu", channel: "Referral", visitors: 4 },
    ]);
  });

  it("counts Apply clicks", async () => {
    respond({ results: [["17"]] });
    expect(await getApplyClicks(7)).toMatchObject({ ok: true, data: 17 });
    expect(QUERIES.applyClicks(7)).toContain("properties.cta = 'apply'");
  });

  it("fills the trend with one point per day, zero where PostHog had nothing", async () => {
    respond({ results: [["2026-10-02", 4, 9]] });
    const result = await getTrend(7);
    expect(result.ok && result.data).toHaveLength(7);
    const points = toTrend([["2026-10-02", 4, 9], ["2026-10-04", 1, 2]], 7, new Date("2026-10-04T15:00:00Z"));
    expect(points.map((p) => p.day)).toEqual(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(points[4]).toEqual({ day: "2026-10-02", visitors: 4, pageviews: 9 });
    expect(points[5]).toEqual({ day: "2026-10-03", visitors: 0, pageviews: 0 });
  });
});

describe("failures never throw", () => {
  beforeEach(configure);

  it("returns an error on a non-200", async () => {
    respond({ detail: "nope" }, 403);
    expect(await getLiveNow()).toEqual({ ok: false, reason: "error", message: "PostHog answered 403." });
  });

  it("returns an error on malformed JSON or a body without results", async () => {
    respond("<html>oops</html>");
    expect(await getLiveNow()).toMatchObject({ ok: false, reason: "error" });
    respond({ results: "nope" });
    expect(await getLiveNow()).toMatchObject({ ok: false, reason: "error" });
  });

  it("returns an error on a timeout or network failure", async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    expect(await getLiveNow()).toEqual({ ok: false, reason: "error", message: "PostHog took too long to answer." });
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await getLiveNow()).toEqual({ ok: false, reason: "error", message: "Couldn't reach PostHog." });
  });
});

describe("helpers", () => {
  it("escapes HogQL strings", () => {
    expect(hogString("it's")).toBe("'it\\'s'");
  });

  it("filters to the production host, except on localhost", () => {
    expect(productionHost("https://tradersatcarolina.org")).toBe("tradersatcarolina.org");
    expect(productionHost("http://localhost:3000")).toBeNull();
  });

  it("derives a channel from the referring domain", () => {
    expect(channelFor("")).toBe("Direct");
    expect(channelFor("duckduckgo.com")).toBe("Search");
    expect(channelFor("t.co")).toBe("Social");
    expect(channelFor("news.ycombinator.com")).toBe("Referral");
  });
});
