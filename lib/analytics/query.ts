import { unstable_cache } from "next/cache";
import { cache } from "react";
import { site } from "@/content/site";
import { uiHostFor } from "@/lib/analytics/client-config";
import { DEFAULT_POSTHOG_HOST } from "@/lib/analytics/proxy";

/**
 * Server-side reads for the analytics dashboard and the Overview visitors row (spec 06 §7.2). Queries run against
 * PostHog's Query API with a read-only personal key that never reaches the browser: never import this from client code.
 * Every getter returns a typed result and never throws, so one failed query only blanks its own section.
 */

export type QueryFailure = { ok: false; reason: "not-configured" | "error"; message?: string };
export type QueryResult<T> = { ok: true; data: T; fetchedAt: number } | QueryFailure;

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

/** `?range=` → 7, 30 or 90; anything else falls back to 7. */
export function parseRange(value: unknown): Range {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 7;
}

export type PostHogEnv = { apiHost: string; projectId: string; apiKey: string };

/** The env this module needs, or null when either secret is missing (the page then shows "not connected"). */
export function posthogEnv(env: NodeJS.ProcessEnv = process.env): PostHogEnv | null {
  const apiKey = env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = env.POSTHOG_PROJECT_ID?.trim();
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, apiHost: apiHostFor(env) };
}

/** POSTHOG_API_HOST if set, else the app host for the ingestion host's region ("us.i.posthog.com" → "us.posthog.com"). */
export function apiHostFor(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.POSTHOG_API_HOST?.trim();
  if (override) return override.replace(/\/+$/, "");
  return uiHostFor(env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST);
}

/** "Open in PostHog": the project's web analytics, or null when the project isn't known. */
export function posthogProjectUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const projectId = env.POSTHOG_PROJECT_ID?.trim();
  return projectId ? `${apiHostFor(env)}/project/${encodeURIComponent(projectId)}/web` : null;
}

export const NOT_CONFIGURED: QueryFailure = { ok: false, reason: "not-configured" };

export class PostHogQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostHogQueryError";
  }
}

export const TIMEOUT_MS = 8000;

// PostHog allows 3 concurrent queries per project; the dashboard fires more than that at once, so they queue here.
const MAX_CONCURRENT = 3;
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(run: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await run();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

/**
 * The one place that talks to PostHog: POST /api/projects/:id/query/ with a HogQL query. Returns the `results` rows,
 * or throws PostHogQueryError on a non-200, a timeout or a body without a results array.
 */
export async function runHogQL(env: PostHogEnv, query: string, name: string): Promise<unknown[][]> {
  return withSlot(async () => {
    let res: Response;
    try {
      res = await fetch(`${env.apiHost}/api/projects/${encodeURIComponent(env.projectId)}/query/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: { kind: "HogQLQuery", query }, name: `tac-admin-${name}` }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new PostHogQueryError(timedOut ? "PostHog took too long to answer." : "Couldn't reach PostHog.");
    }
    if (!res.ok) throw new PostHogQueryError(`PostHog answered ${res.status}.`);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new PostHogQueryError("PostHog sent a response we couldn't read.");
    }
    const results = (body as { results?: unknown } | null)?.results;
    if (!Array.isArray(results) || !results.every(Array.isArray)) throw new PostHogQueryError("PostHog sent a response we couldn't read.");
    return results as unknown[][];
  });
}

// ── HogQL ──

/** Single-quoted HogQL string literal. */
export const hogString = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** The production host, from site.url; null on localhost, where every event counts (there are none in practice). */
export function productionHost(url: string = site.url): string | null {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" ? null : hostname;
  } catch {
    return null;
  }
}

/** Production traffic only (spec 06 §7.2): previews share the project token, so filter on the page's host. */
function hostFilter(): string {
  const host = productionHost();
  return host ? ` AND properties.$host = ${hogString(host)}` : "";
}

/** Whole days, today included, so the trend has `range` points. Day boundaries follow the project's timezone. */
const since = (range: Range) => `timestamp >= toStartOfDay(now()) - INTERVAL ${range - 1} DAY`;

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

export const QUERIES = {
  live: () => `SELECT uniq(distinct_id) FROM events WHERE timestamp >= now() - INTERVAL 5 MINUTE${hostFilter()}`,
  summary: (range: Range) =>
    `SELECT uniq(did), sum(pv), count(), avg(dur), countIf(pv = 1) / count() FROM (` +
    `SELECT properties.$session_id AS sid, any(distinct_id) AS did, countIf(event = '$pageview') AS pv, dateDiff('second', min(timestamp), max(timestamp)) AS dur ` +
    `FROM events WHERE ${since(range)} AND event IN ('$pageview', '$pageleave', '$autocapture')${hostFilter()} GROUP BY sid HAVING pv > 0)`,
  actives: () =>
    `SELECT uniqIf(distinct_id, timestamp >= now() - INTERVAL 1 DAY), uniqIf(distinct_id, timestamp >= now() - INTERVAL 7 DAY), uniq(distinct_id) ` +
    `FROM events WHERE timestamp >= now() - INTERVAL 30 DAY AND event = '$pageview'${hostFilter()}`,
  trend: (range: Range) =>
    `SELECT toDate(timestamp) AS day, uniq(distinct_id), count() FROM events WHERE ${since(range)} AND event = '$pageview'${hostFilter()} GROUP BY day ORDER BY day`,
  pages: (range: Range) =>
    `SELECT properties.$pathname AS path, countIf(event = '$pageview') AS views, uniqIf(distinct_id, event = '$pageview'), ` +
    `median(if(event = '$pageleave', toFloat(properties.$prev_pageview_duration), NULL)) ` +
    `FROM events WHERE ${since(range)} AND event IN ('$pageview', '$pageleave')${hostFilter()} GROUP BY path HAVING views > 0 ORDER BY views DESC LIMIT 10`,
  clicks: (range: Range) =>
    `SELECT properties.cta AS cta, properties.target AS target, count() AS clicks FROM events ` +
    `WHERE ${since(range)} AND event = '$autocapture' AND isNotNull(properties.cta)${hostFilter()} GROUP BY cta, target ORDER BY clicks DESC LIMIT 10`,
  referrers: (range: Range) =>
    `SELECT properties.$referring_domain AS domain, uniq(distinct_id) AS visitors FROM events ` +
    `WHERE ${since(range)} AND event = '$pageview'${hostFilter()} GROUP BY domain ORDER BY visitors DESC LIMIT 10`,
  applyClicks: (range: Range) =>
    `SELECT count() FROM events WHERE ${since(range)} AND event = '$autocapture' AND (properties.cta = 'apply' OR startsWith(properties.cta, 'apply-'))${hostFilter()}`,
};

// ── Mapping rows to data ──

export type Summary = { visitors: number; pageviews: number; sessions: number; avgSessionSeconds: number; bounceRate: number };
export type Actives = { dau: number; wau: number; mau: number };
export type TrendPoint = { day: string; visitors: number; pageviews: number };
export type TopPage = { path: string; views: number; visitors: number; medianSeconds: number | null };
export type TopClick = { cta: string; target: string; clicks: number };
export type Channel = "Direct" | "Search" | "Social" | "Referral";
export type TopReferrer = { domain: string; channel: Channel; visitors: number };

export const toLive = (rows: unknown[][]): number => num(rows[0]?.[0]);

export function toSummary(rows: unknown[][]): Summary {
  const [visitors, pageviews, sessions, avg, bounce] = rows[0] ?? [];
  return { visitors: num(visitors), pageviews: num(pageviews), sessions: num(sessions), avgSessionSeconds: num(avg), bounceRate: num(bounce) };
}

export function toActives(rows: unknown[][]): Actives {
  const [dau, wau, mau] = rows[0] ?? [];
  return { dau: num(dau), wau: num(wau), mau: num(mau) };
}

/** Eastern calendar date, YYYY-MM-DD. */
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });

/** One point per day, oldest first, with zeros for days PostHog returned nothing for. */
export function toTrend(rows: unknown[][], range: Range, now: Date = new Date()): TrendPoint[] {
  const byDay = new Map(rows.map((r) => [str(r[0]).slice(0, 10), { visitors: num(r[1]), pageviews: num(r[2]) }]));
  const today = isoDay.format(now);
  const base = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  return Array.from({ length: range }, (_, i) => {
    const day = new Date(base - (range - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day, ...(byDay.get(day) ?? { visitors: 0, pageviews: 0 }) };
  });
}

export const toPages = (rows: unknown[][]): TopPage[] =>
  rows.map((r) => ({ path: str(r[0]) || "(unknown)", views: num(r[1]), visitors: num(r[2]), medianSeconds: numOrNull(r[3]) }));

export const toClicks = (rows: unknown[][]): TopClick[] => rows.map((r) => ({ cta: str(r[0]), target: str(r[1]), clicks: num(r[2]) }));

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|search\.brave)\./;
const SOCIAL = /(^|\.)(linkedin|lnkd|instagram|facebook|fb|t|twitter|x|reddit|youtube|tiktok|threads|groupme|slack)\.(com|co|in|net|me)$/;

/** A rough channel from the referring domain: enough to tell search, social and links apart. */
export function channelFor(domain: string): Channel {
  const d = domain.toLowerCase();
  if (!d || d === "$direct") return "Direct";
  if (SEARCH.test(d)) return "Search";
  if (SOCIAL.test(d)) return "Social";
  return "Referral";
}

export const toReferrers = (rows: unknown[][]): TopReferrer[] =>
  rows.map((r) => {
    const domain = str(r[0]);
    const channel = channelFor(domain);
    return { domain: channel === "Direct" ? "Direct" : domain, channel, visitors: num(r[1]) };
  });

// ── Cached getters ──

/** Bump when a getter's output shape changes: unstable_cache keeps entries across deployments. */
const VERSION = "v1";
const FIVE_MINUTES = 300;
const ONE_MINUTE = 60;

type Cached<T> = { data: T; fetchedAt: number };

/**
 * A getter that is cached (failures throw inside the cache, so they're never stored), deduped per request, and safe:
 * it returns a QueryResult instead of throwing.
 */
function getter<A extends unknown[], T>(name: string, revalidate: number, load: (env: PostHogEnv, ...args: A) => Promise<T>) {
  // The project and host are arguments so they're part of the cache key; the secret key is read inside, never keyed.
  const cached = unstable_cache(
    async (projectId: string, apiHost: string, ...args: A): Promise<Cached<T>> => {
      const env = posthogEnv();
      if (!env || env.projectId !== projectId || env.apiHost !== apiHost) throw new PostHogQueryError("PostHog settings changed; try again.");
      return { data: await load(env, ...args), fetchedAt: Date.now() };
    },
    ["posthog", name, VERSION],
    { revalidate, tags: ["posthog"] },
  );
  return cache(async (...args: A): Promise<QueryResult<T>> => {
    const env = posthogEnv();
    if (!env) return NOT_CONFIGURED;
    try {
      const { data, fetchedAt } = await cached(env.projectId, env.apiHost, ...args);
      return { ok: true, data, fetchedAt };
    } catch (error) {
      return { ok: false, reason: "error", message: error instanceof PostHogQueryError ? error.message : "Unexpected error." };
    }
  });
}

/** Distinct visitors with any event in the last 5 minutes. */
export const getLiveNow = getter("live", ONE_MINUTE, async (env) => toLive(await runHogQL(env, QUERIES.live(), "live")));

/** Visitors, pageviews, sessions, average session length and bounce rate over the range. */
export const getSummary = getter("summary", FIVE_MINUTES, async (env, range: Range) => toSummary(await runHogQL(env, QUERIES.summary(range), "summary")));

/** Daily, weekly and monthly active visitors, as of now. */
export const getActives = getter("actives", FIVE_MINUTES, async (env) => toActives(await runHogQL(env, QUERIES.actives(), "actives")));

/** Visitors and pageviews per day across the range. */
export const getTrend = getter("trend", FIVE_MINUTES, async (env, range: Range) => toTrend(await runHogQL(env, QUERIES.trend(range), "trend"), range));

export const getTopPages = getter("pages", FIVE_MINUTES, async (env, range: Range) => toPages(await runHogQL(env, QUERIES.pages(range), "pages")));

/** Named clicks (spec 06 §7.1), grouped by CTA and target. */
export const getTopClicks = getter("clicks", FIVE_MINUTES, async (env, range: Range) => toClicks(await runHogQL(env, QUERIES.clicks(range), "clicks")));

export const getTopReferrers = getter("referrers", FIVE_MINUTES, async (env, range: Range) => toReferrers(await runHogQL(env, QUERIES.referrers(range), "referrers")));

/** Clicks on any Apply button (cta "apply", or a label-derived "apply-…"). */
export const getApplyClicks = getter("apply-clicks", FIVE_MINUTES, async (env, range: Range) => num((await runHogQL(env, QUERIES.applyClicks(range), "apply-clicks"))[0]?.[0]));
