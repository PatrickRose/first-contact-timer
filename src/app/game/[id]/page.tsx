import { getGameRepo } from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";

import GameWrapper from "./GameWrapper";
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

    const game = await gameRepo.right.get(params.id);

    if (isLeft(game)) {
        notFound();
    }

    return <GameWrapper game={game.right} mode="Player" />;
}
