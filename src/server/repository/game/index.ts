import { ControlAction, Game } from "@fc/types/types";
import { Either } from "fp-ts/Either";
import { MongoRepository } from "./mongo";

export default interface GameRepository {
    get: (id: string) => Promise<Either<false, Game>>;
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
