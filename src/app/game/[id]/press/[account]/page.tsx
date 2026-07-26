import { getGameRepo } from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";
import GameWrapper from "../../GameWrapper";
import StandardPressPage from "../page";
import Link from "next/link";
import { notFound } from "next/navigation";

// A hard reload is how an admin edit reaches an already-open screen (see
// GameWrapper), so this page must read the live database on every request. Next
// treats a dynamic segment with no generateStaticParams as static-eligible, and
// the Mongo read goes through the driver rather than `fetch`, so the framework
// has no cache key to invalidate. A cached shell would make the reload a no-op
// and, because the stamp would never advance, loop forever.
export const dynamic = "force-dynamic";

export default async function Page(props: {
    params: Promise<{ id: string; account: string }>;
}) {
    const params = await props.params;
    // First, verify that the account is a number
    const pressAccount = Number.parseInt(params.account, 10);

    if (isNaN(pressAccount)) {
        notFound();
    }

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error("Could not get game repo");
    }

    const maybeGame = await gameRepo.right.get(params.id);

    if (isLeft(maybeGame)) {
        return notFound();
    }

    const game = maybeGame.right;

    if (!Array.isArray(game.setupInformation.press)) {
        // Then the user should be using the base press page
        // For ease, just show that component
        return <StandardPressPage params={props.params} />;
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

    return <GameWrapper game={game} mode="Press" pressAccount={pressAccount} />;
}
