import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { SetWolfAttackDecode } from "@fc/types/io-ts-def";
import { toApiResponse } from "@fc/server/turn";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const id = params.id;

    const body = await request.json();

    if (!SetWolfAttackDecode.is(body)) {
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

    const newGame = await gameRepo.right.runControlAction(
        game.right,
        (game) => {
            const newGame = { ...game };

            // Find the defcon component
            const defconComponent = newGame.components.find(
                (val) => val.componentType == "DoWWolfAttack",
            );

            if (defconComponent?.componentType != "DoWWolfAttack") {
                return MakeLeft(`No wolf component for game ${id}`);
            }

            defconComponent.inProgress = body.newStatus;

            if (!newGame.active) {
                const frozenComponent = newGame.frozenTurn.components.find(
                    (val) => val.componentType == "DoWWolfAttack",
                );

                if (frozenComponent?.componentType == "DoWWolfAttack") {
                    frozenComponent.inProgress = body.newStatus;
                }
            }

            return MakeRight(newGame);
        },
    );

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}
