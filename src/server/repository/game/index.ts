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

export default interface GameRepository {
    get: (id: string) => Promise<Either<false, Game>>;
    list: (opts: ListGamesOptions) => Promise<Either<string, ListGamesResult>>;
    insert: (game: Game) => Promise<Either<string, true>>;
    nextTurn: (game: Game) => Promise<Either<string, Game>>;
    runControlAction: (
        currentGame: Game,
        action: ControlAction,
    ) => Promise<Either<string, Game>>;
    setBreakingNews: (
        currentGame: Game,
        breakingNews: string,
        pressAccount: number,
    ) => Promise<Either<string, Game>>;
}

export function getGameRepo(): Either<string, GameRepository> {
    return MongoRepository.APIInstance();
}
