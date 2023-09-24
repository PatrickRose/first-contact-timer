import { Collection, Db, MongoClient } from "mongodb";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
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

    const connStr = `mongodb+srv://${username}:${password}@${host}/${database}?retryWrites=true&w=majority`;

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
