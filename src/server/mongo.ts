import { Collection, Db, MongoClient } from "mongodb";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { buildMongoConnectionString } from "@fc/lib/mongoConnectionString";
import { Either } from "fp-ts/Either";
import { DBUser, Game } from "@fc/types/types";

export default function initialiseMongo(): Either<string, MongoClient> {
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
    const connStr = buildMongoConnectionString({
        protocol,
        username: username!,
        password: password!,
        host: host!,
        database: database!,
        options,
    });

    return MakeRight(new MongoClient(connStr));
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
