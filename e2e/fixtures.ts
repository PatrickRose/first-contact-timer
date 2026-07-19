import { test as base } from "@playwright/test";
import { MongoClient } from "mongodb";
import type { Game } from "../src/types/types";
import { dbEnv, mongoConnectionString } from "./config";
import { gameById } from "./seed";

/**
 * Restore a game to a pristine copy of the `templateId` seed, stored under
 * `targetId` (defaults to `templateId`). Mutating specs pass a per-project
 * `targetId` so the four projects don't fight over one shared document.
 */
export type ResetGame = (
    templateId: string,
    targetId?: string,
) => Promise<void>;

type WorkerFixtures = {
    resetGame: ResetGame;
};

/**
 * `test` extended with a worker-scoped `resetGame` fixture. Spec files run in
 * Node, so they talk to Mongo directly to reset mutable game state between
 * tests. The client is opened once per worker and closed automatically on
 * worker teardown — no manual afterAll/closeDb bookkeeping to forget.
 */
export const test = base.extend<object, WorkerFixtures>({
    resetGame: [
        async ({}, use) => {
            const client = new MongoClient(mongoConnectionString());
            await client.connect();
            const games = client.db(dbEnv.MONGO_DB).collection<Game>("games");

            await use(async (templateId, targetId = templateId) => {
                await games.deleteMany({ _id: targetId });
                await games.insertOne({
                    ...gameById(templateId),
                    _id: targetId,
                });
            });

            await client.close();
        },
        { scope: "worker" },
    ],
});

export { expect } from "@playwright/test";
