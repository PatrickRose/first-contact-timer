import { getGameRepo } from "../../../../server/repository/game";
import { isLeft } from "fp-ts/Either";
import { NotFound } from "next/dist/client/components/error";
import GameWrapper from "../GameWrapper";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }) {
    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error("Could not get game repo");
    }

    const maybeGame = await gameRepo.right.get(params.id);

    if (isLeft(maybeGame)) {
        return NotFound();
    }

    const game = maybeGame.right;

    if (game.setupInformation.press === false) {
        return (
            <div className="text-center bg-red-500 py-4">
                <p>Your game has been set up to not have any press at all</p>
                <p className="pt-4">
                    <Link href={`/game/${game._id}`} className="underline">
                        Please return to your main game page
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div>
            <GameWrapper game={game} mode="Press" pressAccount={0} />
        </div>
    );
}
