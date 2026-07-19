import { execFileSync } from "node:child_process";
import { DOCKER_CONTAINER_NAME, usingExternalMongo } from "./config";

/**
 * Tear down the Docker Mongo container started in global-setup. When Mongo is
 * supplied externally (e.g. a CI service container), leave it alone.
 */
export default async function globalTeardown(): Promise<void> {
    if (usingExternalMongo) {
        return;
    }

    try {
        execFileSync("docker", ["rm", "-f", DOCKER_CONTAINER_NAME], {
            stdio: "ignore",
        });
        console.log("[e2e] Stopped Docker Mongo container.");
    } catch {
        // Container already gone - fine.
    }
}
