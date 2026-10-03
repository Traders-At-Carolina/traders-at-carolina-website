import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

/**
 * Neon over HTTP via Drizzle (spec 06 §3). Created on first use, so importing this module never needs
 * DATABASE_URL (builds of static pages and tests don't touch the database).
 */
export function db(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}
