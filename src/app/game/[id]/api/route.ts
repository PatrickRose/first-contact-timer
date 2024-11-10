import { ApiResponse, Game } from "@fc/types/types";
import { NextRequest, NextResponse } from "next/server";
import { getGameRepo } from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";
import { hasFinished, toApiResponse } from "@fc/server/turn";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const params = await props.params;
    const id = params.id;

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        return NextResponse.json({ error: gameRepo.left }, { status: 500 });
    }

    const game = await gameRepo.right.get(id);

    if (isLeft(game)) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    let currentTurn: Game;

    if (hasFinished(game.right)) {
        const nextGame = await gameRepo.right.nextTurn(game.right);

        if (isLeft(nextGame)) {
            currentTurn = game.right;
        } else {
            currentTurn = nextGame.right;
        }
    } else {
        currentTurn = game.right;
    }

    return NextResponse.json(toApiResponse(currentTurn));
}
