import { Collection, Db, MongoClient } from "mongodb";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { buildMongoConnectionString } from "@fc/lib/mongoConnectionString";
import { Either, isLeft } from "fp-ts/Either";
import { DBUser, Game } from "@fc/types/types";

/**
 * Validates the Mongo environment variables and builds the connection string.
 * Kept separate so the env-var validation (a `Left` on anything missing) is
 * preserved even though the client itself is now cached at module scope.
 */
function mongoConnectionString(): Either<string, string> {
    const host = process.env.MONGO_URL;
    const username = process.env.MONGO_USERNAME;
    const password = process.env.MONGO_PASSWORD;
    const database = process.env.MONGO_DB;

    const missing = [
        ["MONGO_URL", host],
        ["MONGO_USERNAME", username],
        ["MONGO_PASSWORD", password],
        ["MONGO_DB", database],
    ].filter(([, value]) => value === undefined);

    if (missing.length) {
        return MakeLeft(
            "Some environment variables were not set: " +
                missing.map(([envVar]) => envVar).join(", "),
        );
    }

    // The protocol and connection options are configurable via env (as
    // documented in .env.example) so the app can point at a local/standalone
    // Mongo (e.g. `mongodb://` in tests) as well as a `mongodb+srv://` Atlas
    // cluster. The defaults preserve the previous hard-coded Atlas behaviour.
    const protocol = process.env.MONGO_PROTOCOL || "mongodb+srv";
    const options = process.env.MONGO_OPTIONS || "retryWrites=true&w=majority";

    // The missing-vars guard above guarantees these are defined.
    return MakeRight(
        buildMongoConnectionString({
            protocol,
            username: username!,
            password: password!,
            host: host!,
            database: database!,
            options,
        }),
    );
}

// A single MongoClient (and therefore a single connection pool) is cached on
// the global object and reused across requests, rather than opening/closing a
// fresh client on every operation. On serverless hosts module state persists
// per warm container, so this is one small pool per container; on a long-lived
// Node process it is a single shared pool. maxPoolSize is kept low so
// N containers x pool size stays under the Atlas connection cap. See #791.
const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(connStr: string): Promise<MongoClient> {
    if (!globalWithMongo._mongoClientPromise) {
        const client = new MongoClient(connStr, {
            // Keep the pool small: many warm serverless containers can each
            // hold a pool, and (containers x maxPoolSize) must stay comfortably
            // under Atlas's 500-connection cap, so 5 leaves headroom.
            maxPoolSize: 5,
            // Fail fast (5s) rather than letting a stuck server pile up hung
            // requests that each hold the event loop until a much longer
            // default timeout elapses.
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        // Cache the connect() promise, but if it rejects clear the cache so the
        // next request starts a fresh connect. Otherwise a single failed first
        // connect would poison the cache for the whole warm life of the
        // container and every later request would reuse the rejected promise.
        const p = client.connect().catch((e) => {
            globalWithMongo._mongoClientPromise = undefined;
            throw e;
        });
        globalWithMongo._mongoClientPromise = p;
    }

    return globalWithMongo._mongoClientPromise;
}

/**
 * Returns a promise of the shared, connected MongoClient (or a `Left` if the
 * environment is not configured). Callers await the promise and MUST NOT close
 * the client - it is shared across all requests.
 */
export default function initialiseMongo(): Either<
    string,
    Promise<MongoClient>
> {
    const connStr = mongoConnectionString();

    if (isLeft(connStr)) {
        return connStr;
    }

    return MakeRight(getClientPromise(connStr.right));
}

/**
 * Closes the shared client and clears the cache. This is ONLY for short-lived
 * processes such as CLI scripts, where the shared pool would otherwise keep the
 * event loop alive and stop the process from exiting. The server request path
 * must never call this: the client is shared across all requests, so closing it
 * would break every in-flight and subsequent request. See #791.
 */
export async function closeClient(): Promise<void> {
    const promise = globalWithMongo._mongoClientPromise;

    if (promise === undefined) {
        return;
    }

    globalWithMongo._mongoClientPromise = undefined;

    const client = await promise;
    await client.close();
}

type CollectionNames = {
    users: DBUser;
    games: Game;
};

export function getCollection<T extends keyof CollectionNames>(
    db: Db,
    collectionName: T,
): Collection<CollectionNames[T]> {
    return db.collection<CollectionNames[T]>(collectionName);
}
