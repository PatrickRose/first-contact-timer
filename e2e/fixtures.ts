import { test as base } from "@playwright/test";
import { MongoClient } from "mongodb";
import type { Game } from "../src/types/types";
import { dbEnv, mongoConnectionString } from "./config";
import { gameById } from "./seed";

/**
 * Restore a game to a pristine copy of the `templateId` seed, stored under
 * `targetId`. The target id is REQUIRED (use `projectGameId` from helpers.ts)
 * so a mutating spec can't accidentally clobber a shared seed document that
 * read-only specs in other workers are relying on.
 */
export type ResetGame = (templateId: string, targetId: string) => Promise<void>;

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

            await use(async (templateId, targetId) => {
                // The replacement must not carry an _id (driver typing); the
                // upserted document takes its _id from the filter.
                const { _id, ...template } = gameById(templateId);
                void _id;

                // Single atomic op - no window where the document is missing.
                await games.replaceOne({ _id: targetId }, template, {
                    upsert: true,
                });
            });

            await client.close();
        },
        { scope: "worker" },
    ],
});

export { expect } from "@playwright/test";
