import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/** Public routes from 00 §11. */
const routes = ["", "/about", "/membership", "/team", "/apply"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({ url: `${site.url}${route}` }));
}
