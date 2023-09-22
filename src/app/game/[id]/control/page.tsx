import { getGameRepo } from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";

import GameWrapper from "../GameWrapper";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        throw new Error("Could not get game repo");
    }

    const game = await gameRepo.right.get(params.id);

    if (isLeft(game)) {
        notFound();
    }

    return <GameWrapper game={game.right} mode="Control" />;
}
