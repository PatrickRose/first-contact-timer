import { getGameRepo } from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";
import GameWrapper from "../GameWrapper";
import Link from "next/link";
import { getIconForPress } from "@fc/lib/press";
import Image from "next/image";
import { notFound } from "next/navigation";

// A hard reload is how an admin edit reaches an already-open screen (see
// GameWrapper), so this page must read the live database on every request. Next
// treats a dynamic segment with no generateStaticParams as static-eligible, and
// the Mongo read goes through the driver rather than `fetch`, so the framework
// has no cache key to invalidate. A cached shell would make the reload a no-op
// and, because the stamp would never advance, loop forever.
export const dynamic = "force-dynamic";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error("Could not get game repo");
    }

    const maybeGame = await gameRepo.right.get(params.id);

    if (isLeft(maybeGame)) {
        notFound();
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

    if (Array.isArray(game.setupInformation.press)) {
        return (
            <div className="p-4">
                <p>
                    Your game has a multi-press set-up. Please choose the press
                    team you are playing as:
                </p>
                <ul>
                    {game.setupInformation.press.map((press, key) => {
                        return (
                            <li key={key} className="py-2">
                                <Link
                                    href={`/game/${game._id}/press/${key + 1}`}
                                    className="flex"
                                >
                                    <div className="flex flex-col px-2">
                                        <div>
                                            <Image
                                                src={getIconForPress(1, [
                                                    press,
                                                ])}
                                                alt=""
                                                width={60}
                                                height={60}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 px-2 pt-2">
                                        {press.name}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return <GameWrapper game={game} mode="Press" pressAccount={0} />;
}
