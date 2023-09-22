import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { SetBreakingNewsDecode } from "@fc/types/io-ts-def";
import { toApiResponse } from "@fc/server/turn";

export async function POST(
    request: NextRequest,
    {
        params,
    }: {
        params: { id: string };
    },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const id = params.id;

    const body = await request.json();

    if (!SetBreakingNewsDecode.is(body)) {
        return NextResponse.json(
            { error: "Incorrect request" },
            { status: 400 },
        );
    }

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        return NextResponse.json({ error: gameRepo.left }, { status: 500 });
    }

    const game = await gameRepo.right.get(id);

    if (isLeft(game)) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.right.active) {
        return NextResponse.json(
            { error: "Game not active, please wait" },
            { status: 400 },
        );
    }

    const newGame = await gameRepo.right.setBreakingNews(
        game.right,
        body.breakingNews,
        body.pressAccount,
    );

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}
