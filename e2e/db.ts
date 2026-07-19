import { MongoClient, type Db } from "mongodb";
import { dbEnv, mongoConnectionString } from "./config";
import { gameById } from "./seed";
import type { Game } from "../src/types/types";

/**
 * Test-side database access. Spec files run in Node (not the browser), so they
 * can talk to Mongo directly to reset mutable game state between tests and keep
 * them isolated. One client per worker process, closed in an afterAll.
 */

let client: MongoClient | undefined;

async function getDb(): Promise<Db> {
    if (client === undefined) {
        client = new MongoClient(mongoConnectionString());
        await client.connect();
    }
    return client.db(dbEnv.MONGO_DB);
}

/** Restore a single game to its pristine seeded state. */
export async function resetGame(id: string): Promise<void> {
    const db = await getDb();
    const games = db.collection<Game>("games");
    await games.deleteMany({ _id: id });
    await games.insertOne(gameById(id));
}

export async function closeDb(): Promise<void> {
    if (client !== undefined) {
        await client.close();
        client = undefined;
    }
}
