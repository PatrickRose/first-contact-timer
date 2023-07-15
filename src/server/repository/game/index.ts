import {Game} from "../../../types/types";
import {Either} from "fp-ts/Either";
import {MongoRepository} from "./mongo";

export default interface GameRepository {
    get: (id: string) => Promise<Either<false, Game>>;
    insert: (game: Game) => Promise<Either<string, true>>;
}

export function getGameRepo(): Either<string, GameRepository> {
    return MongoRepository.APIInstance();
}
