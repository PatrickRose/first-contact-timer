import GameRepository, {
    ListGamesOptions,
    ListGamesResult,
    UPDATE_CONFLICT,
    UpdateConflict,
} from "./index";
import { Either, isLeft } from "fp-ts/Either";
import { ControlAction, Game } from "@fc/types/types";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { Filter, MongoClient } from "mongodb";
import initialiseMongo, { getCollection } from "../../mongo";
import { tickTurn } from "../../turn";
import { isRight } from "fp-ts/lib/Either";

// Escape every regex metacharacter so a game code is matched literally. Without
// this an unbalanced `(` or `[` in the search term would make Mongo throw.
function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_SEARCH_LENGTH = 64;

export class MongoRepository implements GameRepository {
    constructor(private readonly mongo: Promise<MongoClient>) {}

    static APIInstance(): Either<string, MongoRepository> {
        const client = initialiseMongo();

        if (isLeft(client)) {
            return client;
        }

        return MakeRight(new MongoRepository(client.right));
    }

    async get(id: string): Promise<Either<false, Game>> {
        try {
            const database = (await this.mongo).db();

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
        }
    }

    async list({
        search,
        page,
        pageSize,
    }: ListGamesOptions): Promise<Either<string, ListGamesResult>> {
        try {
            const database = (await this.mongo).db();

            const games = getCollection(database, "games");

            const trimmed = (search ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
            const filter: Filter<Game> =
                trimmed.length > 0
                    ? { _id: { $regex: escapeRegex(trimmed), $options: "i" } }
                    : {};

            const total = await games.countDocuments(filter);

            // Clamp the requested page into the available range so an
            // out-of-range/NaN page can never produce a negative skip (which
            // Mongo rejects) or an empty page past the end of the results.
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const safePage = Math.min(
                Math.max(1, Math.floor(page) || 1),
                totalPages,
            );

            const results = await games
                .find(filter)
                .sort({ _id: 1 })
                .skip((safePage - 1) * pageSize)
                .limit(pageSize)
                .toArray();

            return MakeRight({ games: results, total, page: safePage });
        } catch (e) {
            return MakeLeft((e as Error).message);
        }
    }

    async insert(game: Game): Promise<Either<string, true>> {
        try {
            const database = (await this.mongo).db();

            const gameCollection = getCollection(database, "games");

            await gameCollection.insertOne(game);

            return MakeRight<true>(true);
        } catch (e) {
            return MakeLeft((e as Error).message);
        }
    }

    async #updateTurn(
        newFields: Partial<Game>,
        currentFields: Game,
    ): Promise<Either<string | UpdateConflict, true>> {
        try {
            const database = (await this.mongo).db();

            const gameCollection = getCollection(database, "games");

            const { _id, turnInformation } = currentFields;

            // The compare-and-set filter is keyed on turnInformation ONLY. It
            // guards against concurrent turn advances, but NOT against two
            // operators editing DIFFERENT components at the same time - those
            // still last-write-wins, because neither touches turnInformation.
            // Closing that gap needs a monotonic `version` field on the document
            // (plus a data migration to backfill it), which is a deliberately
            // deferred follow-up. See #783.
            const result = await gameCollection.updateOne(
                { _id, turnInformation },
                { $set: newFields },
            );

            // The CAS filter on { _id, turnInformation } prevents double
            // advances, but a 0-match means turnInformation changed between the
            // read and this write. Surface that as a conflict rather than
            // silently no-opping and returning success. See #783.
            if (result.matchedCount === 0) {
                return MakeLeft(UPDATE_CONFLICT);
            }

            return MakeRight(true);
        } catch (e) {
            return MakeLeft((e as Error).message);
        }
    }

    async nextTurn(game: Game): Promise<Either<string, Game>> {
        const tickedTurn = tickTurn(game);

        const updateResult = await this.#updateTurn(
            { turnInformation: tickedTurn.turnInformation },
            game,
        );

        if (isLeft(updateResult)) {
            // A lost auto-advance means another writer already advanced the turn
            // (typically another player's poll). From the poller's point of view
            // that is success, so return the fresh, already-advanced state
            // instead of falling back to the stale pre-advance turn. See #783.
            if (updateResult.left === UPDATE_CONFLICT) {
                const fresh = await this.get(game._id);

                return isRight(fresh) ? fresh : MakeLeft("Failed to get game?");
            }

            return MakeLeft(updateResult.left);
        }

        const result = await this.get(game._id);

        return isRight(result) ? result : MakeLeft("Failed to get game?");
    }

    async runControlAction(
        currentGame: Game,
        action: ControlAction,
    ): Promise<Either<string | UpdateConflict, Game>> {
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
            const database = (await this.mongo).db();

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
        }

        const newGame = await this.get(_id);

        return isLeft(newGame) ? MakeLeft("Game does not exist?") : newGame;
    }
}
