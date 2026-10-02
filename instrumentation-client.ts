import { posthogConfig, readTrackContext, shouldTrack } from "@/lib/analytics/client-config";
import { DEFAULT_POSTHOG_HOST } from "@/lib/analytics/proxy";

// Anonymous visitor analytics (spec 06 §7.1). Inert without a project token, so local dev and previews stay quiet.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST;

if (token && shouldTrack(readTrackContext(window))) {
  // Load PostHog once the browser is idle so it never competes with the first paint.
  const start = () => {
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(token, posthogConfig(host, () => readTrackContext(window).internal));
    });
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 1500);
}
