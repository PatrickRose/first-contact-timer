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

    execFileSync(
        "docker",
        [
            "run",
            "-d",
            "--rm",
            "-p",
            "27017:27017",
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
        console.log("[e2e] Using externally provided Mongo (MONGO_URL set).");
    } else {
        console.log("[e2e] Starting Docker Mongo container...");
        startDockerMongo();
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
