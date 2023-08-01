import { getGameRepo } from "../../../../../server/repository/game";
import { isLeft } from "fp-ts/Either";
import { NotFound } from "next/dist/client/components/error";
import GameWrapper from "../../GameWrapper";
import StandardPressPage from "../page";
import Link from "next/link";

export default async function Page({
    params,
}: {
    params: { id: string; account: string };
}) {
    // First, verify that the account is a number
    const pressAccount = Number.parseInt(params.account, 10);

    if (isNaN(pressAccount)) {
        return <NotFound />;
    }

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error("Could not get game repo");
    }

    const maybeGame = await gameRepo.right.get(params.id);

    if (isLeft(maybeGame)) {
        return NotFound();
    }

    const game = maybeGame.right;

    if (!Array.isArray(game.setupInformation.press)) {
        // Then the user should be using the base press page
        // For ease, just show that component
        return <StandardPressPage params={{ id: params.id }} />;
    }

    if (pressAccount > game.setupInformation.press.length) {
        return (
            <div className="text-center bg-red-500 py-4">
                <p>
                    You have requested press account {pressAccount} but that
                    does not exist for this game
                </p>
                <p className="pt-4">
                    <Link
                        href={`/game/${game._id}/press`}
                        className="underline"
                    >
                        Please return to the press page and select the right
                        press account
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div>
            <GameWrapper game={game} mode="Press" pressAccount={pressAccount} />
        </div>
    );
}
