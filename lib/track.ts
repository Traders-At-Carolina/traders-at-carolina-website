export type ConversionEvent = "apply_click" | "notify_click" | "apply_page_click";

type ConversionUrls = { applyUrl: string; interestFormUrl?: string };

/**
 * Which conversion a link click is, judged by its raw href: the application form, the "Get notified" form,
 * or a link to /apply (what Apply buttons point to while applications are closed). Anything else is ignored.
 */
export function conversionEvent(href: string, { applyUrl, interestFormUrl }: ConversionUrls): ConversionEvent | undefined {
  if (applyUrl && href === applyUrl) return "apply_click";
  if (interestFormUrl && href === interestFormUrl) return "notify_click";
  if (href === "/apply") return "apply_page_click";
  return undefined;
}

/** Where on the page a link sits: the nearest data-track-location, else the header, footer or navy band, else "page". */
export function clickLocation(el: Element): string {
  const tagged = el.closest("[data-track-location]")?.getAttribute("data-track-location");
  if (tagged) return tagged;
  if (el.closest("footer")) return "footer";
  if (el.closest("header")) return "site-header";
  if (el.closest("[data-cta-band]")) return "band";
  return "page";
}
