import { ControlAction, Game } from "@fc/types/types";
import { Either } from "fp-ts/Either";
import { MongoRepository } from "./mongo";

export interface ListGamesOptions {
    search?: string;
    page: number;
    pageSize: number;
}

export interface ListGamesResult {
    games: Game[];
    total: number;
    // The page actually served, after clamping to the available range.
    page: number;
}

/**
 * Distinguishable error value returned by the game repository when a
 * compare-and-set update matches zero documents - i.e. turnInformation changed
 * between the read and the write.
 *
 * This is a unique symbol rather than a string so it can never collide with a
 * human-readable error message that happens to read "conflict"; the two share
 * the `Either` left channel. The route layer maps it to HTTP 409. See #783.
 */
export const UPDATE_CONFLICT: unique symbol = Symbol("game-update-conflict");
export type UpdateConflict = typeof UPDATE_CONFLICT;

export default interface GameRepository {
    get: (id: string) => Promise<Either<false, Game>>;
    list: (opts: ListGamesOptions) => Promise<Either<string, ListGamesResult>>;
    insert: (game: Game) => Promise<Either<string, true>>;
    nextTurn: (game: Game) => Promise<Either<string, Game>>;
    runControlAction: (
        currentGame: Game,
        action: ControlAction,
    ) => Promise<Either<string | UpdateConflict, Game>>;
    setBreakingNews: (
        currentGame: Game,
        breakingNews: string,
        pressAccount: number,
    ) => Promise<Either<string, Game>>;
}

export function getGameRepo(): Either<string, GameRepository> {
    return MongoRepository.APIInstance();
}
