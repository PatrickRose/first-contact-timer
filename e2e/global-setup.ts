import { execFileSync } from "node:child_process";
import { MongoClient } from "mongodb";
import {
    DOCKER_CONTAINER_NAME,
    dbEnv,
    mongoConnectionString,
    usingExternalMongo,
} from "./config";
import { seedDatabase } from "./seed";

/**
 * Provision the database the app is served against:
 *   - locally, start a disposable Mongo container via Docker;
 *   - in CI (or any env that already exports MONGO_URL), reuse that instance.
 * Then wait for it to accept connections and seed deterministic fixtures.
 *
 * Runs once before the whole Playwright suite (see playwright.config.ts).
 */

function startDockerMongo(): void {
    // Remove any leftover container from an interrupted previous run.
    try {
        execFileSync("docker", ["rm", "-f", DOCKER_CONTAINER_NAME], {
            stdio: "ignore",
        });
    } catch {
        // Nothing to remove - fine.
    }

    // Publish on whatever host port dbEnv.MONGO_URL names (non-default by
    // default, so we can't collide with a developer's own Mongo on 27017).
    const hostPort = dbEnv.MONGO_URL.split(":")[1] ?? "27017";

    try {
        execFileSync(
            "docker",
            [
                "run",
                "-d",
                "--rm",
                "-p",
                `${hostPort}:27017`,
                "-e",
                `MONGO_INITDB_ROOT_USERNAME=${dbEnv.MONGO_USERNAME}`,
                "-e",
                `MONGO_INITDB_ROOT_PASSWORD=${dbEnv.MONGO_PASSWORD}`,
                "--name",
                DOCKER_CONTAINER_NAME,
                "mongo:7",
            ],
            { stdio: "ignore" },
        );
    } catch (error) {
        throw new Error(
            `[e2e] Failed to start the Mongo container. Is Docker running, ` +
                `and is host port ${hostPort} free? (${String(error)})`,
        );
    }
}

async function waitForMongo(uri: string): Promise<MongoClient> {
    const deadline = Date.now() + 60_000;
    let lastError: unknown;

    while (Date.now() < deadline) {
        const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 2000,
        });
        try {
            await client.connect();
            await client.db(dbEnv.MONGO_DB).command({ ping: 1 });
            return client;
        } catch (error) {
            lastError = error;
            await client.close().catch(() => undefined);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    throw new Error(
        `Timed out waiting for Mongo at ${uri}: ${String(lastError)}`,
    );
}

export default async function globalSetup(): Promise<void> {
    // Make the resolved DB/session config visible to this process (and any
    // children Playwright spawns). The webServer already receives it via config.
    for (const [key, value] of Object.entries(dbEnv)) {
        process.env[key] = value;
    }

    if (usingExternalMongo) {
        // Seeding wipes the games and users collections, so refuse to touch a
        // non-local Mongo unless explicitly allowed. This stops an exported
        // MONGO_URL pointing at a shared/Atlas cluster from being wiped by a
        // stray `npm run test:e2e`.
        const host = dbEnv.MONGO_URL;
        const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
        if (!isLocal && process.env.E2E_ALLOW_EXTERNAL_MONGO !== "1") {
            throw new Error(
                `[e2e] Refusing to seed a non-local Mongo at "${host}" ` +
                    `(seeding wipes the games/users collections). Set ` +
                    `E2E_ALLOW_EXTERNAL_MONGO=1 if this really is a disposable ` +
                    `test database.`,
            );
        }
        console.log("[e2e] Using externally provided Mongo (MONGO_URL set).");
    } else {
        console.log("[e2e] Starting Docker Mongo container...");
        startDockerMongo();
    }

    // Second layer of the wipe guard, applied even for "local" hosts: a
    // localhost port can be an SSH tunnel / kubectl port-forward to a real
    // cluster, so also require the database NAME to look like a test database
    // before running the destructive seed.
    if (
        !/(e2e|test)/i.test(dbEnv.MONGO_DB) &&
        process.env.E2E_ALLOW_EXTERNAL_MONGO !== "1"
    ) {
        throw new Error(
            `[e2e] Refusing to seed database "${dbEnv.MONGO_DB}": seeding ` +
                `wipes the games/users collections, and the name doesn't look ` +
                `like a test database (no "e2e"/"test" in it). Use a dedicated ` +
                `test database, or set E2E_ALLOW_EXTERNAL_MONGO=1 if it really ` +
                `is disposable.`,
        );
    }

    const client = await waitForMongo(mongoConnectionString());
    try {
        console.log("[e2e] Seeding database...");
        await seedDatabase(client.db(dbEnv.MONGO_DB));
        console.log("[e2e] Seed complete.");
    } finally {
        await client.close();
    }
}
