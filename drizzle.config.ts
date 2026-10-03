import { defineConfig } from "drizzle-kit";

/** Migrations are generated into drizzle/ and committed (spec 06 §3). Point DATABASE_URL at a dev branch locally. */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
