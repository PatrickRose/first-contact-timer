/**
 * Single source of truth for the e2e test environment.
 *
 * These values are shared between `playwright.config.ts` (which forwards them
 * to the Next.js `webServer`) and `global-setup.ts` (which starts/connects to
 * Mongo and seeds it). Keeping them here avoids the config-load vs global-setup
 * ordering problem and guarantees the app server and the seeder agree on the
 * same database.
 *
 * If `MONGO_URL` is already set in the environment (e.g. a CI service
 * container), those values win and global-setup skips starting Docker.
 */

import { buildMongoConnectionString } from "../src/lib/mongoConnectionString";

// Deliberately not 3000: a stray `next dev` on the default port would otherwise
// be reused by `reuseExistingServer`, silently running the suite against the
// developer's own dev database instead of the seeded e2e Mongo.
export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

export const DOCKER_CONTAINER_NAME = "fc-e2e-mongo";

export const dbEnv = {
    MONGO_PROTOCOL: process.env.MONGO_PROTOCOL ?? "mongodb",
    MONGO_URL: process.env.MONGO_URL ?? "localhost:27017",
    MONGO_USERNAME: process.env.MONGO_USERNAME ?? "root",
    MONGO_PASSWORD: process.env.MONGO_PASSWORD ?? "example",
    MONGO_DB: process.env.MONGO_DB ?? "firstcontact",
    MONGO_OPTIONS: process.env.MONGO_OPTIONS ?? "authSource=admin",
    SECRET_COOKIE_PASSWORD:
        process.env.SECRET_COOKIE_PASSWORD ??
        "e2e-test-cookie-password-at-least-32-chars",
    SECONDS_IN_PHASE: process.env.SECONDS_IN_PHASE ?? "15",
} as const;

/** True when Mongo is supplied externally and we must not start Docker. */
export const usingExternalMongo = process.env.MONGO_URL !== undefined;

/** Connection string the seeder uses (same builder the app uses). */
export function mongoConnectionString(): string {
    return buildMongoConnectionString({
        protocol: dbEnv.MONGO_PROTOCOL,
        username: dbEnv.MONGO_USERNAME,
        password: dbEnv.MONGO_PASSWORD,
        host: dbEnv.MONGO_URL,
        database: dbEnv.MONGO_DB,
        options: dbEnv.MONGO_OPTIONS,
    });
}
