import { initializeDatabase } from "./init";

/** Single-flight: first webhook / server startup ensures tables exist (safe for Vercel cold starts). */
let schemaPromise: Promise<void> | null = null;

export function ensureSchemaOnce(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initializeDatabase();
  }
  return schemaPromise;
}
