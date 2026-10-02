/** Default ingestion host when the PostHog integration hasn't set NEXT_PUBLIC_POSTHOG_HOST. */
export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/**
 * next.config rewrites that serve PostHog from /rp on our own origin. Asset paths must come before the catch-all.
 * Pair with `skipTrailingSlashRedirect`, since PostHog's API paths end in a slash.
 */
export function posthogRewrites(ingestHost: string = DEFAULT_POSTHOG_HOST) {
  const host = ingestHost.replace(/\/+$/, "");
  const assets = host.replace(/^(https:\/\/)(us|eu)\.i\.posthog\.com$/, "$1$2-assets.i.posthog.com");
  return [
    { source: "/rp/static/:path*", destination: `${assets}/static/:path*` },
    { source: "/rp/array/:path*", destination: `${assets}/array/:path*` },
    { source: "/rp/:path*", destination: `${host}/:path*` },
  ];
}
