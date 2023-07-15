import GameRepository from "./index";
import {Either, isLeft} from "fp-ts/Either";
import {Game} from "../../../types/types";
import {MakeLeft, MakeRight} from "../../../lib/io-ts-helpers";
import {MongoClient} from "mongodb";
import initialiseMongo, {getCollection} from "../../mongo";

export class MongoRepository implements GameRepository {

    constructor(private readonly mongo: MongoClient) {
    }

    static APIInstance(): Either<string, MongoRepository> {
        const client = initialiseMongo();

        if (isLeft(client)) {
            return client;
        }

        return MakeRight(new MongoRepository(client.right));
    }

    async get(id: string): Promise<Either<false, Game>> {
        try {
            await this.mongo.connect();

            const database = this.mongo.db();

            const games = getCollection(database, 'games');

            const cursor = games.find<Game>({ _id: id });

            const game = await cursor.next();

            if (game === null) {
                return MakeLeft(false);
            }

            return MakeRight(game);
        } catch (e) {
            console.log(e);
            return MakeLeft(false);
        } finally {
            await this.mongo.close();
        }
    }

    async insert(game: Game): Promise<Either<string, true>> {
        try {
            await this.mongo.connect();

            const database = this.mongo.db();

            const gameCollection = getCollection(database, 'games');

            await gameCollection.insertOne(game);

            return MakeRight<true>(true);
        } catch (e) {
            return MakeLeft((e as Error).message);
        } finally {
            await this.mongo.close();
        }
    }

}
