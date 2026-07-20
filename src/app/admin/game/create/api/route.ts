import { CreateGameResponse } from "@fc/types/types";
import { CreateGameRequestDecode } from "@fc/types/io-ts-def";
import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { GAME_DEFINITIONS } from "@fc/server/game-definitions";

export async function POST(
    request: NextRequest,
): Promise<NextResponse<CreateGameResponse>> {
    const createGameReq = await request.json();

    if (!CreateGameRequestDecode.is(createGameReq)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Incorrect request"],
            },
            { status: 400 },
        );
    }

    const { setupInformation, components } =
        GAME_DEFINITIONS[createGameReq.type];

    const game = createGame(createGameReq.gameID, setupInformation, components);

    if (isLeft(game)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Failed to create game", game.left],
            },
            { status: 500 },
        );
    }

    const gamesRepo = getGameRepo();

    if (isLeft(gamesRepo)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Couldn't get the games repo", gamesRepo.left],
            },
            { status: 500 },
        );
    }

    const result = await gamesRepo.right.insert(game.right);

    if (isLeft(result)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Failed to insert game", result.left],
            },
            { status: 500 },
        );
    }

    return NextResponse.json({ result: true });
}
