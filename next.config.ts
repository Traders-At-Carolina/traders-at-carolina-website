import type { NextConfig } from "next";
import { posthogRewrites } from "./lib/analytics/proxy";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Analytics are served from /rp on our own origin so ad blockers don't drop them (spec 06 §7.1).
  async rewrites() {
    return posthogRewrites(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  },
  // PostHog's API paths end in a slash; pages set canonical URLs instead.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
