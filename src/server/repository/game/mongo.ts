import GameRepository from "./index";
import { Either, isLeft } from "fp-ts/Either";
import { ControlAction, Game } from "@fc/types/types";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { MongoClient } from "mongodb";
import initialiseMongo, { getCollection } from "../../mongo";
import { tickTurn } from "../../turn";
import { isRight } from "fp-ts/lib/Either";

export class MongoRepository implements GameRepository {
    constructor(private readonly mongo: MongoClient) {}

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

            const games = getCollection(database, "games");

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

            const gameCollection = getCollection(database, "games");

            await gameCollection.insertOne(game);

            return MakeRight<true>(true);
        } catch (e) {
            return MakeLeft((e as Error).message);
        } finally {
            await this.mongo.close();
        }
    }

    async #updateTurn(
        newFields: Partial<Game>,
        currentFields: Game,
    ): Promise<Either<string, true>> {
        try {
            await this.mongo.connect();

            const database = this.mongo.db();

            const gameCollection = getCollection(database, "games");

            const { _id, turnInformation } = currentFields;

            await gameCollection.updateOne(
                { _id, turnInformation },
                { $set: newFields },
            );

            return MakeRight(true);
        } catch (e) {
            return MakeLeft((e as Error).message);
        } finally {
            await this.mongo.close();
        }
    }

    async nextTurn(game: Game): Promise<Either<string, Game>> {
        const tickedTurn = tickTurn(game);

        const updateResult = await this.#updateTurn(
            { turnInformation: tickedTurn.turnInformation },
            game,
        );

        if (isLeft(updateResult)) {
            return updateResult;
        }

        const result = await this.get(game._id);

        return isRight(result) ? result : MakeLeft("Failed to get game?");
    }

    async runControlAction(
        currentGame: Game,
        action: ControlAction,
    ): Promise<Either<string, Game>> {
        const tickedTurn = action(currentGame);

        if (isLeft(tickedTurn)) {
            return tickedTurn;
        }

        const updateResult = await this.#updateTurn(
            tickedTurn.right,
            currentGame,
        );

        if (isLeft(updateResult)) {
            return updateResult;
        }

        const result = await this.get(currentGame._id);

        return isRight(result) ? result : MakeLeft("Failed to get game?");
    }

    async setBreakingNews(
        { _id, turnInformation }: Game,
        newBreakingNews: string,
        pressAccount: number,
    ): Promise<Either<string, Game>> {
        try {
            await this.mongo.connect();

            const database = this.mongo.db();

            const gameCollection = getCollection(database, "games");

            await gameCollection.updateOne(
                { _id },
                {
                    $push: {
                        breakingNews: {
                            newsText: newBreakingNews,
                            date: new Date().toISOString(),
                            turn: turnInformation.turnNumber,
                            phase: turnInformation.currentPhase,
                            pressAccount,
                        },
                    },
                },
            );
        } catch (e) {
            return MakeLeft((e as Error).message);
        } finally {
            await this.mongo.close();
        }

        const newGame = await this.get(_id);

        return isLeft(newGame) ? MakeLeft("Game does not exist?") : newGame;
    }
}
