export type MongoConnectionParts = {
    protocol: string;
    username: string;
    password: string;
    host: string;
    database: string;
    options: string;
};

/**
 * Build a Mongo connection string. Shared by the app (`src/server/mongo.ts`)
 * and the e2e harness (`e2e/config.ts`) so the two can't drift in how they
 * assemble the URI. Pure and dependency-free so it is safe to import from the
 * Playwright config/setup as well as the Next.js server.
 */
export function buildMongoConnectionString({
    protocol,
    username,
    password,
    host,
    database,
    options,
}: MongoConnectionParts): string {
    return `${protocol}://${username}:${password}@${host}/${database}?${options}`;
}
