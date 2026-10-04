import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

/**
 * Portal settings (spec 06 §5.2 `portal`), edited at /admin/portal (§6.13). Until an admin first saves that screen,
 * or without a database in local development, the spec's defaults apply: alumni keep access, requests are accepted.
 */
export const PORTAL_ACCESS_DEFAULTS = { alumniAccess: true, acceptRequests: true } as const;

const welcome = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined), z.string().max(200, "Keep it under 200 characters.").optional());

/** The stored `portal` setting. Missing fields fall back to the defaults, so older values still parse. */
export const portalSettingSchema = z.object({
  alumniAccess: z.boolean().default(PORTAL_ACCESS_DEFAULTS.alumniAccess),
  acceptRequests: z.boolean().default(PORTAL_ACCESS_DEFAULTS.acceptRequests),
  welcomeMember: welcome,
  welcomeVisitor: welcome,
});

export type PortalSetting = z.infer<typeof portalSettingSchema>;

/** Parses a stored value, falling back to the defaults when it is missing or malformed. */
export function parsePortalSetting(value: unknown): PortalSetting {
  const parsed = portalSettingSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : { ...PORTAL_ACCESS_DEFAULTS };
}

/** The whole `portal` setting. Never throws: a missing database or table, or any read failure, gives the defaults. */
export async function readPortalSetting(): Promise<PortalSetting> {
  if (!process.env.DATABASE_URL) return { ...PORTAL_ACCESS_DEFAULTS };
  try {
    const [row] = await db().select({ value: settings.value }).from(settings).where(eq(settings.key, "portal")).limit(1);
    return parsePortalSetting(row?.value);
  } catch (error) {
    console.warn("portal setting unavailable; using defaults", error);
    return { ...PORTAL_ACCESS_DEFAULTS };
  }
}

export async function portalAccessSettings(): Promise<{ alumniAccess: boolean; acceptRequests: boolean }> {
  const { alumniAccess, acceptRequests } = await readPortalSetting();
  return { alumniAccess, acceptRequests };
}
