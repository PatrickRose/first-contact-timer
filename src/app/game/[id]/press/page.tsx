import {getGameRepo} from "../../../../server/repository/game";
import {isLeft} from "fp-ts/Either";
import {NotFound} from "next/dist/client/components/error";
import GameWrapper from "../GameWrapper";

export default async function Page({ params }: { params: { id: string } }) {
    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error('Could not get game repo');
    }

    const game = await gameRepo.right.get(params.id);

    if (isLeft(game)) {
        return NotFound();
    }

    return <div>
        <GameWrapper game={game.right} mode="Press" />
    </div>
}
